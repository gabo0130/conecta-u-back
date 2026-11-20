import type { AnalysisAttempt } from '../../domain/entities/analysis-attempt.type';
import type { AnalysisUsage } from '../../domain/repositories/project-analysis.repository.interface';
import type {
  AnalyzerResponse,
  ProjectAnalyzer,
} from '../../domain/repositories/project-analyzer.interface';

/**
 * Lleva la cuenta de lo que consume un análisis (RT7, RT12): cada llamada real a un modelo, con
 * sus tokens, también las que fallaron o devolvieron una salida inválida.
 */
export class AnalysisUsageMeter {
  private readonly recorded: AnalysisAttempt[] = [];

  /** Para pasar como `onAttempt` al analizador. */
  readonly record = (attempt: AnalysisAttempt): void => {
    this.recorded.push(attempt);
  };

  /** Cuántas llamadas van; sirve para saber si una respuesta ya quedó registrada. */
  get count(): number {
    return this.recorded.length;
  }

  /**
   * Un analizador que no informa sus llamadas (el de prueba, sin red) respondió: la respuesta
   * cuenta como una llamada, para no perder sus tokens.
   */
  recordUnreportedResponse(
    analyzer: ProjectAnalyzer,
    response: AnalyzerResponse,
  ): void {
    this.record({
      provider: response.provider ?? analyzer.provider,
      model: response.model ?? analyzer.model,
      outcome: 'answered',
      durationMs: 0,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
    });
  }

  usage(): AnalysisUsage {
    return {
      inputTokens: sum(this.recorded.map((attempt) => attempt.inputTokens)),
      outputTokens: sum(this.recorded.map((attempt) => attempt.outputTokens)),
      attempts: [...this.recorded],
    };
  }
}

/** null si ninguna llamada informó tokens (no es lo mismo que cero). */
function sum(values: (number | null)[]): number | null {
  const known = values.filter((value): value is number => value !== null);
  return known.length === 0 ? null : known.reduce((a, b) => a + b, 0);
}
