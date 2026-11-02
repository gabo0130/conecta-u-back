import type { Priority } from '../entities/priority.type';

// Priorización básica de necesidades (tesis, D4). Función pura:
//   prioridad = 100 · (0,4 · impacto/5 + 0,4 · urgencia/5 + 0,2 · completitud/100)
// Impacto y urgencia (1–5) los declara el formulador; la completitud (0–100) premia las
// necesidades mejor caracterizadas, que se pueden convertir antes en una oportunidad.
// La priorización avanzada (criterios institucionales, recursos, dependencias entre
// necesidades, análisis multicriterio) queda fuera del alcance del anteproyecto.

export const NEED_PRIORITY_WEIGHTS = {
  impact: 0.4,
  urgency: 0.4,
  completeness: 0.2,
} as const;

/** Desde qué puntaje cada nivel (incluido). */
export const NEED_PRIORITY_THRESHOLDS = { ALTA: 70, MEDIA: 40 } as const;

const SCALE_MAX = 5;

export interface PriorityInput {
  impact: number;
  urgency: number;
  completeness: number;
}

export interface PriorityResult {
  /** 0–100, con 2 decimales. */
  score: number;
  level: Priority;
}

export function priorityLevel(score: number): Priority {
  if (score >= NEED_PRIORITY_THRESHOLDS.ALTA) return 'ALTA';
  if (score >= NEED_PRIORITY_THRESHOLDS.MEDIA) return 'MEDIA';
  return 'BAJA';
}

export function computeNeedPriority({
  impact,
  urgency,
  completeness,
}: PriorityInput): PriorityResult {
  const { impact: wi, urgency: wu, completeness: wc } = NEED_PRIORITY_WEIGHTS;
  const raw =
    100 *
    ((wi * impact) / SCALE_MAX +
      (wu * urgency) / SCALE_MAX +
      (wc * completeness) / 100);
  const score = Math.round(Math.min(Math.max(raw, 0), 100) * 100) / 100;
  return { score, level: priorityLevel(score) };
}
