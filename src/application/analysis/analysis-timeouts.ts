/**
 * Tiempos del análisis con IA (RT7). Un solo presupuesto para toda la petición: las llamadas
 * a la IA, su reintento y los embeddings se reparten lo que queda, así `POST …/analysis`
 * responde antes de que el front deje de esperar (60 s).
 */
export interface AnalysisTimeouts {
  /** Presupuesto total de un análisis (`AI_TIMEOUT_MS`). */
  totalMs: number;
  /** Máximo por llamada de embeddings (`EMBEDDING_TIMEOUT_MS`): son opcionales, no deben comerse el análisis. */
  embeddingMs: number;
  /**
   * Un análisis PENDIENTE más viejo que esto ya no puede estar vivo (el servidor se reinició a
   * mitad): se da por interrumpido y su proyecto vuelve al estado que corresponde.
   */
  staleAfterMs: number;
}

const DEFAULT_TOTAL_MS = 55_000;
const DEFAULT_EMBEDDING_MS = 10_000;
const TOTAL_RANGE = { min: 10_000, max: 300_000 } as const;
const EMBEDDING_RANGE = { min: 1_000, max: 60_000 } as const;
/** Margen sobre el presupuesto para guardar el resultado en la base y responder. */
const STALE_MARGIN_MS = 60_000;

/** Un valor inválido no tumba el arranque: se usa el valor por defecto. */
export function parseAnalysisTimeouts(
  totalRaw?: string,
  embeddingRaw?: string,
): AnalysisTimeouts {
  const totalMs = parseMs(totalRaw, DEFAULT_TOTAL_MS, TOTAL_RANGE);
  return {
    totalMs,
    embeddingMs: parseMs(embeddingRaw, DEFAULT_EMBEDDING_MS, EMBEDDING_RANGE),
    staleAfterMs: totalMs + STALE_MARGIN_MS,
  };
}

function parseMs(
  raw: string | undefined,
  fallback: number,
  range: { min: number; max: number },
): number {
  const value = Math.trunc(Number(raw));
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(Math.max(value, range.min), range.max);
}
