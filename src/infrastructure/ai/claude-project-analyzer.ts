import Anthropic from '@anthropic-ai/sdk';
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
import { ANALYSIS_JSON_SCHEMA } from './analysis-json-schema';
import {
  ANALYSIS_PROMPT_VERSION,
  ANALYSIS_SYSTEM_INSTRUCTION,
  buildAnalysisPrompt,
} from './gemini-prompt';
import { QuotaCircuitBreaker } from './quota-circuit-breaker';

export const DEFAULT_CLAUDE_MODEL = 'claude-haiku-5-5';

export interface ClaudeAnalyzerOptions {
  apiKey: string;
  model?: string;
  /** Se inyecta en las pruebas. */
  client?: Pick<Anthropic, 'messages'>;
  /** Se inyecta en las pruebas; por defecto, uno propio. */
  quotaBreaker?: QuotaCircuitBreaker;
}

/** El perfil en JSON ocupa ~0,3–1,3 mil tokens; el margen evita cortar el JSON a la mitad. */
const MAX_OUTPUT_TOKENS = 8000;
/** Sobrecarga o caída pasajera (5xx, 529): un reintento. Un 429 nunca se reintenta (RT7). */
const RETRYABLE_STATUSES = new Set([500, 502, 503, 504, 529]);
const RETRY_DELAY_MS = 1500;
/** Con menos tiempo que esto no vale la pena reintentar. */
const MIN_RETRY_MS = 5000;
/** Tras un 429 sin `retry-after`: el límite de Anthropic se mide por minuto. */
const RATE_LIMIT_COOLDOWN_MS = 60_000;
const MAX_RATE_LIMIT_COOLDOWN_MS = 10 * 60_000;
/** Sin saldo o con el límite de gasto alcanzado: no vuelve en minutos. */
const BILLING_COOLDOWN_MS = 30 * 60_000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Análisis con Claude (RF6): mismo prompt (`promptVersion`) y mismo esquema que Gemini, con
 * salidas estructuradas (`output_config.format`). Sin razonamiento: la tarea es extraer datos con
 * un esquema fijo y así responde en segundos. Toda falla del servicio (red, cuota, sobrecarga,
 * tiempo agotado, rechazo) es `AnalyzerUnavailableError`, para que entre el respaldo; una salida
 * ilegible, `InvalidAnalysisOutputError`, que el caso de uso reintenta una vez; una cortada por
 * longitud, `TruncatedAnalysisOutputError`, que no se reintenta.
 *
 * Límites de uso (RT7): un 429 o un error de facturación no se reintentan; el modelo queda
 * bloqueado un tiempo (`QuotaCircuitBreaker`) y mientras tanto responde el respaldo sin llamarlo.
 */
export class ClaudeProjectAnalyzer implements ProjectAnalyzer {
  readonly provider = 'claude';
  readonly promptVersion = ANALYSIS_PROMPT_VERSION;
  readonly model: string;

  private readonly client: Pick<Anthropic, 'messages'>;
  private readonly quotaBreaker: QuotaCircuitBreaker;

  constructor({ apiKey, model, client, quotaBreaker }: ClaudeAnalyzerOptions) {
    this.model = model ?? DEFAULT_CLAUDE_MODEL;
    // Sin reintentos del SDK: los suyos incluyen el 429. Los decide `analyze`.
    this.client = client ?? new Anthropic({ apiKey, maxRetries: 0 });
    this.quotaBreaker = quotaBreaker ?? new QuotaCircuitBreaker();
  }

  isAvailable(): boolean {
    return !this.quotaBreaker.isOpen(this.model);
  }

  async analyze(
    input: AnalysisInput,
    { timeoutMs, onAttempt }: AnalyzeOptions,
  ): Promise<AnalyzerResponse> {
    const deadline = Date.now() + timeoutMs;
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.analyzeOnce(
          input,
          Math.max(deadline - Date.now(), 1),
          onAttempt,
        );
      } catch (error) {
        const retryable =
          attempt === 1 &&
          isRetryable(error) &&
          deadline - Date.now() > RETRY_DELAY_MS + MIN_RETRY_MS;
        if (!retryable) throw toAnalyzerError(error);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  private async analyzeOnce(
    input: AnalysisInput,
    timeoutMs: number,
    onAttempt: AnalyzeOptions['onAttempt'],
  ): Promise<AnalyzerResponse> {
    // `setTimeout` y no `AbortSignal.timeout`: así el reloj simulado de las pruebas lo controla.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();
    const attempt = (fields: Partial<AnalysisAttempt>): AnalysisAttempt => ({
      provider: this.provider,
      model: this.model,
      outcome: 'answered',
      durationMs: Date.now() - startedAt,
      inputTokens: null,
      outputTokens: null,
      ...fields,
    });
    let message: Anthropic.Message;
    try {
      message = await this.client.messages.create(
        {
          model: this.model,
          max_tokens: MAX_OUTPUT_TOKENS,
          system: ANALYSIS_SYSTEM_INSTRUCTION,
          messages: [{ role: 'user', content: buildAnalysisPrompt(input) }],
          thinking: { type: 'disabled' },
          output_config: {
            format: { type: 'json_schema', schema: ANALYSIS_JSON_SCHEMA },
          },
        },
        { signal: controller.signal },
      );
    } catch (error) {
      const timedOut = controller.signal.aborted;
      onAttempt?.(attempt(failedAttempt(error, timedOut)));
      this.tripIfOutOfQuota(error);
      throw timedOut ? new ClaudeTimeoutError(timeoutMs, error) : error;
    } finally {
      clearTimeout(timer);
    }

    const truncated = message.stop_reason === 'max_tokens';
    onAttempt?.(
      attempt({
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
        ...(truncated ? { truncated: true } : {}),
      }),
    );
    if (message.stop_reason === 'refusal') {
      throw new AnalyzerUnavailableError(
        `Claude declinó la solicitud (${message.stop_details?.category ?? 'sin categoría'})`,
      );
    }
    if (truncated) {
      throw new TruncatedAnalysisOutputError(
        'Claude cortó la respuesta por longitud',
      );
    }
    const text = message.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('');

    return {
      output: parseJson(text),
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  }

  /** Límite por minuto (429) o sin saldo: no se vuelve a llamar hasta que pase el enfriamiento. */
  private tripIfOutOfQuota(error: unknown): void {
    const apiError = asApiError(error);
    if (apiError?.type === 'billing_error') {
      this.quotaBreaker.trip(this.model, BILLING_COOLDOWN_MS);
    } else if (apiError?.status === 429) {
      this.quotaBreaker.trip(this.model, retryAfterMs(apiError.headers));
    }
  }
}

/** Se agotó el tiempo: se informa así, no con el error de cancelación del SDK. */
class ClaudeTimeoutError extends Error {
  constructor(
    readonly timeoutMs: number,
    cause: unknown,
  ) {
    super('timeout', { cause });
  }
}

/** Lo que se usa de un error HTTP del SDK, con tipos (sus genéricos llegan como `any`). */
interface ClaudeApiError {
  status: number;
  type: Anthropic.ErrorType | null;
  headers: Headers | undefined;
}

function asApiError(error: unknown): ClaudeApiError | null {
  if (!(error instanceof Anthropic.APIError)) return null;
  const status = error.status as number | undefined;
  if (status === undefined) return null;
  return {
    status,
    type: error.type,
    headers: error.headers as Headers | undefined,
  };
}

const isRetryable = (error: unknown): boolean => {
  const apiError = asApiError(error);
  return apiError !== null && RETRYABLE_STATUSES.has(apiError.status);
};

function toAnalyzerError(error: unknown): Error {
  if (
    error instanceof AnalyzerUnavailableError ||
    error instanceof InvalidAnalysisOutputError
  ) {
    return error;
  }
  if (error instanceof ClaudeTimeoutError) {
    return new AnalyzerUnavailableError(
      `Claude no respondió dentro del tiempo límite (sin respuesta en ${Math.round(error.timeoutMs / 1000)} s)`,
      { cause: error.cause },
    );
  }
  return new AnalyzerUnavailableError(describeFailure(error), { cause: error });
}

function failedAttempt(
  error: unknown,
  timedOut: boolean,
): Partial<AnalysisAttempt> {
  if (timedOut) return { outcome: 'timeout' };
  const apiError = asApiError(error);
  if (!apiError) return { outcome: 'unavailable' };
  const outOfQuota =
    apiError.status === 429 || apiError.type === 'billing_error';
  return {
    outcome: outOfQuota ? 'rate_limited' : 'unavailable',
    httpStatus: apiError.status,
  };
}

/** `retry-after` en segundos, con un tope de 10 min; sin él, un minuto. */
function retryAfterMs(headers: Headers | undefined): number {
  const seconds = Number(headers?.get('retry-after'));
  if (!Number.isFinite(seconds) || seconds <= 0) return RATE_LIMIT_COOLDOWN_MS;
  return Math.min(seconds * 1000, MAX_RATE_LIMIT_COOLDOWN_MS);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new InvalidAnalysisOutputError('Claude no devolvió un JSON válido');
  }
}

function describeFailure(error: unknown): string {
  if (error instanceof Anthropic.APIError && error.status !== undefined) {
    return `Claude respondió con error ${error.status}: ${error.message}`;
  }
  return error instanceof Error ? error.message : String(error);
}
