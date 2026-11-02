import { Logger } from '@nestjs/common';
import { ApiError, GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { GenerateContentResponse, Schema } from '@google/genai';
import {
  AnalyzerUnavailableError,
  InvalidAnalysisOutputError,
  type AnalyzerResponse,
} from '../../domain/repositories/project-analyzer.interface';
import { QuotaCircuitBreaker } from './quota-circuit-breaker';
import {
  callWithTransientRetry,
  isDailyQuotaError,
  isTransientApiError,
} from './retry-transient';

export interface GeminiJsonGeneratorOptions {
  apiKey: string;
  model: string;
  /** Modelo de respaldo si el principal agota su cuota o sigue en alta demanda. */
  fallbackModel?: string;
  /** Compartido entre adaptadores: la cuota es del modelo, no de cada uso. */
  quotaBreaker?: QuotaCircuitBreaker;
  /** Nombre para los avisos del log. */
  logContext: string;
}

export interface JsonRequest {
  contents: string;
  systemInstruction: string;
  responseSchema: Schema;
  /** Incluye los tokens de razonamiento: con poco margen el JSON podría cortarse a la mitad. */
  maxOutputTokens: number;
}

/** Con menos tiempo que esto no vale la pena intentar con el modelo de respaldo. */
const MIN_FALLBACK_MS = 8000;

/**
 * Llamada a Gemini con salida JSON estructurada, compartida por el análisis de proyectos y la
 * caracterización de necesidades. Toda falla del servicio (red, cuota, tiempo agotado,
 * bloqueo) se traduce a `AnalyzerUnavailableError`; un JSON ilegible, a
 * `InvalidAnalysisOutputError`, que el caso de uso reintenta una vez.
 *
 * Cuota (RT7): un 429 no se reintenta sobre el mismo modelo, se pasa al de respaldo. Si es la
 * cuota diaria, el modelo queda bloqueado un tiempo (`QuotaCircuitBreaker`) y no se llama.
 */
export class GeminiJsonGenerator {
  readonly model: string;

  private readonly client: GoogleGenAI;
  private readonly fallbackModel?: string;
  private readonly quotaBreaker: QuotaCircuitBreaker;
  private readonly logger: Logger;

  constructor({
    apiKey,
    model,
    fallbackModel,
    quotaBreaker = new QuotaCircuitBreaker(),
    logContext,
  }: GeminiJsonGeneratorOptions) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
    this.fallbackModel = fallbackModel;
    this.quotaBreaker = quotaBreaker;
    this.logger = new Logger(logContext);
  }

  /** Falso si todos los modelos tienen la cuota diaria agotada: no vale la pena llamar. */
  isAvailable(): boolean {
    return this.usableModels().length > 0;
  }

  /** `timeoutMs` cubre el modelo principal, sus reintentos y el de respaldo: nunca se excede. */
  async generate(
    request: JsonRequest,
    timeoutMs: number,
  ): Promise<AnalyzerResponse> {
    const deadline = Date.now() + timeoutMs;
    const models = this.usableModels();
    if (models.length === 0) {
      throw new AnalyzerUnavailableError(
        'La cuota diaria de Gemini está agotada en todos los modelos configurados',
      );
    }
    const [usedModel, response] = await this.generateWithFallback(
      models,
      request,
      deadline,
    );

    const text = response.text;
    if (!text) {
      const reason = response.promptFeedback?.blockReason;
      if (reason) {
        throw new AnalyzerUnavailableError(
          `Gemini bloqueó la solicitud (${reason})`,
        );
      }
      throw new InvalidAnalysisOutputError(
        'Gemini devolvió una respuesta vacía',
      );
    }

    return {
      output: parseJson(text),
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount ?? null,
        outputTokens: toOutputTokens(response.usageMetadata),
      },
      ...(usedModel === this.model ? {} : { model: usedModel }),
    };
  }

  /** Prueba los modelos en orden; pasa al siguiente solo ante cuota o alta demanda. */
  private async generateWithFallback(
    models: string[],
    request: JsonRequest,
    deadline: number,
  ): Promise<[string, GenerateContentResponse]> {
    for (let index = 0; ; index++) {
      const model = models[index];
      try {
        const response = await this.call(
          model,
          request,
          Math.max(deadline - Date.now(), 1),
        );
        return [model, response];
      } catch (error) {
        if (isDailyQuotaError(error)) {
          this.quotaBreaker.trip(model);
          this.logger.warn(
            `${model} agotó su cuota diaria: no se volverá a llamar por un tiempo`,
          );
        }
        const next = models[index + 1];
        if (
          next === undefined ||
          !isTransientApiError(error) ||
          deadline - Date.now() < MIN_FALLBACK_MS
        ) {
          throw new AnalyzerUnavailableError(describeFailure(error), {
            cause: error,
          });
        }
        this.logger.warn(
          `${model} no está disponible (${describeFailure(error)}): se intenta con el modelo de respaldo ${next}`,
        );
      }
    }
  }

  private usableModels(): string[] {
    return [this.model, this.fallbackModel].filter(
      (model): model is string =>
        model !== undefined && !this.quotaBreaker.isOpen(model),
    );
  }

  private call(
    model: string,
    request: JsonRequest,
    timeoutMs: number,
  ): Promise<GenerateContentResponse> {
    return callWithTransientRetry(
      (signal) =>
        this.client.models.generateContent({
          model,
          contents: request.contents,
          config: {
            systemInstruction: request.systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: request.responseSchema,
            // Poco razonamiento: la tarea es estructurada y así responde en segundos, no en minutos.
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            maxOutputTokens: request.maxOutputTokens,
            abortSignal: signal,
          },
        }),
      timeoutMs,
    );
  }
}

/** Los tokens de "pensamiento" también se facturan: cuentan como salida. */
function toOutputTokens(
  usage:
    { candidatesTokenCount?: number; thoughtsTokenCount?: number } | undefined,
): number | null {
  if (!usage) return null;
  const { candidatesTokenCount, thoughtsTokenCount } = usage;
  if (candidatesTokenCount === undefined && thoughtsTokenCount === undefined) {
    return null;
  }
  return (candidatesTokenCount ?? 0) + (thoughtsTokenCount ?? 0);
}

function parseJson(text: string): unknown {
  // Aunque se pida JSON, algunos modelos lo envuelven en una cerca ```json.
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned) as unknown;
  } catch {
    throw new InvalidAnalysisOutputError('Gemini no devolvió un JSON válido');
  }
}

function describeFailure(error: unknown): string {
  if (error instanceof ApiError) {
    return `Gemini respondió con error ${error.status}: ${error.message}`;
  }
  if (error instanceof Error && error.name === 'TimeoutError') {
    return 'Gemini no respondió dentro del tiempo límite';
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return 'La solicitud a Gemini fue cancelada';
  }
  return error instanceof Error ? error.message : String(error);
}
