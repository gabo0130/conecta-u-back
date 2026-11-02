/**
 * Decisión del líder sobre una persona recomendada (tesis, D6: tasa de aceptación). Se guarda
 * por perfil requerido y persona, con el puesto y el puntaje que tenía en ese momento: así no
 * se pierde al regenerar las recomendaciones y se puede evaluar el ranking de entonces.
 */
export const FEEDBACK_DECISIONS = ['ACEPTADA', 'DESCARTADA'] as const;
export type FeedbackDecision = (typeof FEEDBACK_DECISIONS)[number];

export const FEEDBACK_REASON_MAX_LENGTH = 500;

export interface RecommendationFeedbackEntity {
  id: string;
  projectId: string;
  requiredProfileId: string;
  collaboratorId: string;
  decision: FeedbackDecision;
  reason: string | null;
  rankAtDecision: number;
  scoreAtDecision: number;
  decidedById: string;
  decidedAt: Date;
}

/** Aceptadas sobre decididas; null si todavía no hay decisiones. */
export function acceptanceRate(
  accepted: number,
  discarded: number,
): number | null {
  const decided = accepted + discarded;
  return decided === 0
    ? null
    : Math.round((10000 * accepted) / decided) / 10000;
}
