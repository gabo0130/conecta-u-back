import { Logger } from '@nestjs/common';
import { AnalyzerUnavailableError } from '../../domain/repositories/project-analyzer.interface';
import type {
  AnalysisInput,
  AnalyzeOptions,
  AnalyzerResponse,
  ProjectAnalyzer,
} from '../../domain/repositories/project-analyzer.interface';

export const DEFAULT_PRIMARY_ANALYZER_TIMEOUT_MS = 25_000;
/** Tiempo que se le guarda al respaldo cuando el principal no responde. */
const FALLBACK_RESERVE_MS = 20_000;
/** Con menos tiempo que esto no vale la pena llamar al respaldo. */
const MIN_FALLBACK_MS = 8_000;

const logger = new Logger('FallbackProjectAnalyzer');

/**
 * Dos proveedores de IA: el principal (p. ej. Claude) y, si no está disponible, el respaldo
 * (p. ej. Gemini, que además tiene su propio modelo de respaldo). El principal espera como mucho
 * `primaryTimeoutMs` y siempre deja tiempo al respaldo. Solo se pasa al respaldo ante
 * `AnalyzerUnavailableError` (caída, cuota, tiempo agotado, rechazo); una salida inválida la
 * reintenta el caso de uso (con el mismo analizador), salvo si se cortó por longitud.
 */
export class FallbackProjectAnalyzer implements ProjectAnalyzer {
  constructor(
    private readonly primary: ProjectAnalyzer,
    private readonly fallback: ProjectAnalyzer,
    private readonly primaryTimeoutMs = DEFAULT_PRIMARY_ANALYZER_TIMEOUT_MS,
  ) {}

  get provider(): string {
    return this.primary.provider;
  }

  get model(): string {
    return this.primary.model;
  }

  get promptVersion(): string {
    return this.primary.promptVersion;
  }

  isAvailable(): boolean {
    return this.primary.isAvailable() || this.fallback.isAvailable();
  }

  async analyze(
    input: AnalysisInput,
    { timeoutMs, onAttempt }: AnalyzeOptions,
  ): Promise<AnalyzerResponse> {
    const deadline = Date.now() + timeoutMs;
    if (this.primary.isAvailable()) {
      // Aún no corrió nada: todo el presupuesto (sin volver a leer el reloj).
      const remaining = timeoutMs;
      const canFallBack =
        this.fallback.isAvailable() &&
        remaining >= FALLBACK_RESERVE_MS + MIN_FALLBACK_MS;
      try {
        return await this.primary.analyze(input, {
          timeoutMs: canFallBack
            ? Math.min(this.primaryTimeoutMs, remaining - FALLBACK_RESERVE_MS)
            : remaining,
          onAttempt,
        });
      } catch (error) {
        if (!(error instanceof AnalyzerUnavailableError) || !canFallBack) {
          throw error;
        }
        logger.warn(
          `${this.primary.provider}/${this.primary.model} no está disponible (${error.message}): se intenta con ${this.fallback.provider}`,
        );
      }
    }

    const response = await this.fallback.analyze(input, {
      timeoutMs: Math.max(deadline - Date.now(), 1),
      onAttempt,
    });
    // El análisis guarda qué proveedor y qué modelo respondieron de verdad (RNF8).
    return {
      ...response,
      provider: response.provider ?? this.fallback.provider,
      model: response.model ?? this.fallback.model,
    };
  }
}
