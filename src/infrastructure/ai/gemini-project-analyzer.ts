import { Logger } from '@nestjs/common';
import {
  ApiError,
  FinishReason,
  GoogleGenAI,
  ThinkingLevel,
} from '@google/genai';
import type { GenerateContentResponse } from '@google/genai';
import type { AnalysisAttempt } from '../../domain/entities/analysis-attempt.type';
import {
  AnalyzerUnavailableError,
  InvalidAnalysisOutputError,
  TruncatedAnalysisOutputError,
} from '../../domain/repositories/project-analyzer.interface';
import type {
  AnalysisInput,
  AnalyzeOptions,
  AnalyzerResponse,
  ProjectAnalyzer,
} from '../../domain/repositories/project-analyzer.interface';
import {
  ANALYSIS_PROMPT_VERSION,
  ANALYSIS_RESPONSE_SCHEMA,
  ANALYSIS_SYSTEM_INSTRUCTION,
  buildAnalysisPrompt,
} from './gemini-prompt';
import { QuotaCircuitBreaker } from './quota-circuit-breaker';
import {
  callWithTransientRetry,
  isDailyQuotaError,
  isTransientApiError,
} from './retry-transient';

export interface GeminiAnalyzerOptions {
  apiKey: string;
  model: string;
  /** Modelo de respaldo si el principal agota su cuota o sigue en alta demanda. */
  fallbackModel?: string;
  /**
   * Máximo que se espera al modelo principal cuando hay respaldo (`GEMINI_PRIMARY_TIMEOUT_MS`).
   * No depende de `AI_TIMEOUT_MS`: con 5 min de presupuesto se esperaban 280 s a un modelo que
   * no iba a responder.
   */
  primaryTimeoutMs?: number;
  /** Se inyecta en las pruebas; por defecto, uno propio con el enfriamiento estándar. */
  quotaBreaker?: QuotaCircuitBreaker;
}

// Incluye los tokens de razonamiento: con poco margen el JSON podría cortarse a la mitad.
const MAX_OUTPUT_TOKENS = 16384;
/** Con menos tiempo que esto no vale la pena intentar con el modelo de respaldo. */
const MIN_FALLBACK_MS = 8000;
/**
 * Tiempo que se le guarda al modelo de respaldo. Con alta demanda el principal a veces no
 * responde nunca (sin 503): sin esta reserva se comía todo el presupuesto y el respaldo, que
 * suele responder en segundos, no alcanzaba a correr.
 */
const FALLBACK_RESERVE_MS = 20_000;
/** Espera por defecto al principal: responde en 5–15 s cuando está sano. */
export const DEFAULT_PRIMARY_TIMEOUT_MS = 25_000;

const logger = new Logger('GeminiProjectAnalyzer');

/**
 * Análisis con Gemini (RF8): salida JSON estructurada. Toda falla del servicio (red, cuota,
 * tiempo agotado, bloqueo) se traduce a `AnalyzerUnavailableError`; un JSON ilegible, a
 * `InvalidAnalysisOutputError`, que el caso de uso reintenta una vez.
 *
 * Cuota (RT7): un 429 no se reintenta sobre el mismo modelo, se pasa al de respaldo. Si es la
 * cuota diaria, el modelo queda bloqueado un tiempo (`QuotaCircuitBreaker`) y no se llama.
 */
export class GeminiProjectAnalyzer implements ProjectAnalyzer {
  readonly provider = 'gemini';
  readonly promptVersion = ANALYSIS_PROMPT_VERSION;
  readonly model: string;

  private readonly client: GoogleGenAI;
  private readonly fallbackModel?: string;
  private readonly quotaBreaker: QuotaCircuitBreaker;
  private readonly primaryTimeoutMs: number;

  constructor({
    apiKey,
    model,
    fallbackModel,
    quotaBreaker = new QuotaCircuitBreaker(),
    primaryTimeoutMs = DEFAULT_PRIMARY_TIMEOUT_MS,
  }: GeminiAnalyzerOptions) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
    this.fallbackModel = fallbackModel;
    this.quotaBreaker = quotaBreaker;
    this.primaryTimeoutMs = primaryTimeoutMs;
  }

  /** Falso si todos los modelos tienen la cuota diaria agotada: no vale la pena llamar. */
  isAvailable(): boolean {
    return this.usableModels().length > 0;
  }

  /** `timeoutMs` cubre el modelo principal, sus reintentos y el de respaldo: nunca se excede. */
  async analyze(
    input: AnalysisInput,
    { timeoutMs, onAttempt }: AnalyzeOptions,
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
      input,
      deadline,
      onAttempt,
    );

    // Un JSON cortado a la mitad no se arregla repitiendo con el mismo tope: se dice por qué falló.
    if (isTruncated(response)) {
      throw new TruncatedAnalysisOutputError(
        'Gemini cortó la respuesta por longitud',
      );
    }
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
    input: AnalysisInput,
    deadline: number,
    onAttempt: AnalyzeOptions['onAttempt'],
  ): Promise<[string, GenerateContentResponse]> {
    for (let index = 0; ; index++) {
      const model = models[index];
      const hasNext = models[index + 1] !== undefined;
      try {
        const response = await this.generate(
          model,
          input,
          attemptBudget(
            deadline - Date.now(),
            hasNext ? this.primaryTimeoutMs : null,
          ),
          onAttempt,
        );
        return [model, response];
      } catch (error) {
        if (isDailyQuotaError(error)) {
          this.quotaBreaker.trip(model);
          logger.warn(
            `${model} agotó su cuota diaria: no se volverá a llamar por un tiempo`,
          );
        }
        const next = models[index + 1];
        if (
          next === undefined ||
          !(isTransientApiError(error) || isTimeout(error)) ||
          deadline - Date.now() < MIN_FALLBACK_MS
        ) {
          throw new AnalyzerUnavailableError(describeFailure(error), {
            cause: error,
          });
        }
        logger.warn(
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

  /** Cada llamada real (también los reintentos internos) se informa con `onAttempt`. */
  private generate(
    model: string,
    input: AnalysisInput,
    timeoutMs: number,
    onAttempt: AnalyzeOptions['onAttempt'],
  ): Promise<GenerateContentResponse> {
    return callWithTransientRetry(async (signal) => {
      const startedAt = Date.now();
      const attempt = (fields: Partial<AnalysisAttempt>): AnalysisAttempt => ({
        provider: this.provider,
        model,
        outcome: 'answered',
        durationMs: Date.now() - startedAt,
        inputTokens: null,
        outputTokens: null,
        ...fields,
      });
      try {
        const response = await this.client.models.generateContent({
          model,
          contents: buildAnalysisPrompt(input),
          config: {
            systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: ANALYSIS_RESPONSE_SCHEMA,
            // Poco razonamiento: la tarea es estructurada y así responde en segundos, no en minutos.
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            abortSignal: signal,
          },
        });
        onAttempt?.(
          attempt({
            inputTokens: response.usageMetadata?.promptTokenCount ?? null,
            outputTokens: toOutputTokens(response.usageMetadata),
            ...(isTruncated(response) ? { truncated: true } : {}),
          }),
        );
        return response;
      } catch (error) {
        onAttempt?.(attempt(failedAttempt(error)));
        throw error;
      }
    }, timeoutMs);
  }
}

/**
 * Si después viene el respaldo (`capMs` no nulo) y alcanza el tiempo, el modelo actual espera
 * como mucho `capMs` y siempre deja `FALLBACK_RESERVE_MS` libres; si no, usa todo lo que queda.
 */
function attemptBudget(remainingMs: number, capMs: number | null): number {
  const remaining = Math.max(remainingMs, 1);
  if (capMs === null || remaining < FALLBACK_RESERVE_MS + MIN_FALLBACK_MS) {
    return remaining;
  }
  return Math.min(capMs, remaining - FALLBACK_RESERVE_MS);
}

const isTimeout = (error: unknown): boolean =>
  error instanceof Error && error.name === 'TimeoutError';

const isTruncated = (response: GenerateContentResponse): boolean =>
  response.candidates?.[0]?.finishReason === FinishReason.MAX_TOKENS;

/** Resultado y código HTTP de una llamada que falló. */
function failedAttempt(error: unknown): Partial<AnalysisAttempt> {
  if (isTimeout(error)) return { outcome: 'timeout' };
  if (error instanceof ApiError) {
    return {
      outcome: error.status === 429 ? 'rate_limited' : 'unavailable',
      httpStatus: error.status,
    };
  }
  return { outcome: 'unavailable' };
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
    return `Gemini no respondió dentro del tiempo límite (${error.message})`;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return 'La solicitud a Gemini fue cancelada';
  }
  return error instanceof Error ? error.message : String(error);
}
