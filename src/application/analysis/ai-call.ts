import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import {
  AnalyzerUnavailableError,
  InvalidAnalysisOutputError,
} from '../../domain/repositories/project-analyzer.interface';

/** Con menos tiempo que esto no vale la pena reintentar una salida inválida. */
export const MIN_RETRY_MS = 10_000;

/**
 * Regla única de reintento de la IA (análisis y caracterización): si la salida no cumple el
 * esquema (`InvalidAnalysisOutputError`) y queda tiempo, se intenta una vez más; si falla otra
 * vez, se rinde. `attempt` recibe solo lo que le queda al presupuesto.
 */
export async function withOneRetryOnInvalidOutput<T>(
  attempt: (timeoutMs: number) => Promise<T>,
  deadline: number,
  onRetry: (reason: string) => void,
): Promise<T> {
  for (let tries = 1; ; tries++) {
    try {
      return await attempt(Math.max(deadline - Date.now(), 1));
    } catch (error) {
      const retryable =
        error instanceof InvalidAnalysisOutputError &&
        tries === 1 &&
        deadline - Date.now() >= MIN_RETRY_MS;
      if (!retryable) throw error;
      onRetry(error.message);
    }
  }
}

export interface AiErrorMessages {
  unavailable: string;
  invalidOutput: string;
}

/** Errores de la IA → 503 con un mensaje seguro; los HTTP ya formados pasan tal cual. */
export function aiErrorToHttp(
  error: unknown,
  messages: AiErrorMessages,
): unknown {
  if (error instanceof HttpException) return error;
  if (error instanceof AnalyzerUnavailableError) {
    return new ServiceUnavailableException({ message: messages.unavailable });
  }
  if (error instanceof InvalidAnalysisOutputError) {
    return new ServiceUnavailableException({ message: messages.invalidOutput });
  }
  return error;
}
