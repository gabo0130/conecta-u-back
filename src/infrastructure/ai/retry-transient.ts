import { ApiError } from '@google/genai';

/**
 * Errores que justifican probar con otro modelo: cuota (429) y caídas o picos de demanda (5xx).
 */
const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
/**
 * Errores que se reintentan sobre el mismo modelo: solo caídas o picos de demanda. Un 429 no:
 * la cuota no se recupera en segundos y cada reintento se cuenta contra ella (RT7).
 */
const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);
const BACKOFF_MS = [1500, 4000];
/** Con menos tiempo que esto no vale la pena otro intento. */
const MIN_ATTEMPT_MS = 5000;
/** Gemini identifica la cuota agotada en `quotaId` (p. ej. `GenerateRequestsPerDayPerProjectPerModel`). */
const DAILY_QUOTA_PATTERN = /PerDay/i;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const isTransientApiError = (error: unknown): boolean =>
  error instanceof ApiError && TRANSIENT_STATUSES.has(error.status);

const isRetryableApiError = (error: unknown): boolean =>
  error instanceof ApiError && RETRYABLE_STATUSES.has(error.status);

/** 429 por la cuota diaria del modelo: no vuelve hasta que la cuota se reinicie. */
export const isDailyQuotaError = (error: unknown): boolean =>
  error instanceof ApiError &&
  error.status === 429 &&
  DAILY_QUOTA_PATTERN.test(error.message);

/**
 * Llama al servicio de IA y reintenta (hasta 2 veces, con espera creciente) si responde con
 * un 5xx. Un 429 (cuota) no se reintenta. `timeoutMs` es el presupuesto total: los reintentos
 * nunca lo superan, y un tiempo agotado no se reintenta.
 */
export async function callWithTransientRetry<T>(
  call: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (let attempt = 0; ; attempt++) {
    try {
      return await call(
        AbortSignal.timeout(Math.max(deadline - Date.now(), 1)),
      );
    } catch (error) {
      const wait = BACKOFF_MS[attempt];
      const canRetry =
        isRetryableApiError(error) &&
        wait !== undefined &&
        deadline - Date.now() > wait + MIN_ATTEMPT_MS;
      if (!canRetry) throw error;
      await sleep(wait);
    }
  }
}
