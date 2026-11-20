/**
 * Resultado de una llamada al modelo: respondió (aunque su salida resulte inválida), no estaba
 * disponible (caída, sobrecarga), alcanzó su límite de uso o no respondió a tiempo.
 */
export const ANALYSIS_ATTEMPT_OUTCOMES = [
  'answered',
  'unavailable',
  'rate_limited',
  'timeout',
] as const;

export type AnalysisAttemptOutcome = (typeof ANALYSIS_ATTEMPT_OUTCOMES)[number];

/**
 * Una llamada facturable a un modelo dentro de un análisis (RT7, RT12, RNF8). Un análisis puede
 * tener varias: reintentos, el modelo de respaldo, otro proveedor o una salida inválida repetida.
 */
export interface AnalysisAttempt {
  provider: string;
  model: string;
  outcome: AnalysisAttemptOutcome;
  durationMs: number;
  inputTokens: number | null;
  outputTokens: number | null;
  /** Código HTTP del proveedor, si respondió con error. */
  httpStatus?: number;
  /** La respuesta se cortó por el tope de tokens de salida. */
  truncated?: boolean;
}
