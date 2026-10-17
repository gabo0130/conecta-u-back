import {
  DEFAULT_MATCH_WEIGHTS,
  normalizeWeights,
  type MatchWeights,
} from '../../domain/services/match-score';

export interface MatchSettings {
  weights: MatchWeights;
  /** Cuántas personas se guardan por perfil. */
  topN: number;
}

const DEFAULT_TOP_N = 10;
const MAX_TOP_N = 50;

/**
 * `MATCH_WEIGHTS` = "habilidades,semántica,experiencia,disponibilidad" (p. ej. "0.5,0.2,0.15,0.15").
 * Un valor inválido no tumba el arranque: se usan los pesos por defecto.
 */
export function parseMatchSettings(
  weightsRaw?: string,
  topNRaw?: string,
): MatchSettings {
  return { weights: parseWeights(weightsRaw), topN: parseTopN(topNRaw) };
}

function parseWeights(raw?: string): MatchWeights {
  const parts = (raw ?? '').split(',').map((part) => Number(part.trim()));
  const valid =
    parts.length === 4 &&
    parts.every((value) => Number.isFinite(value) && value >= 0) &&
    parts.some((value) => value > 0);
  if (!valid) return { ...DEFAULT_MATCH_WEIGHTS };
  const [skills, semantic, experience, availability] = parts;
  return normalizeWeights({ skills, semantic, experience, availability });
}

function parseTopN(raw?: string): number {
  const value = Math.trunc(Number(raw));
  if (!Number.isFinite(value) || value < 1) return DEFAULT_TOP_N;
  return Math.min(value, MAX_TOP_N);
}
