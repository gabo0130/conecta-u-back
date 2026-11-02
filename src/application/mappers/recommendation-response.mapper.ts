import type { RequiredProfileEntity } from '../../domain/entities/required-profile.entity';
import type { RecommendationFeedbackEntity } from '../../domain/entities/recommendation-feedback';
import type { RecommendationView } from '../../domain/repositories/recommendation.repository.interface';

// Respuestas de las recomendaciones (RF11–RF13). Nunca incluyen correo, teléfono ni enlaces.

const toComponents = (view: RecommendationView) => ({
  skills: view.skillScore,
  semantic: view.semanticScore,
  experience: view.experienceScore,
  availability: view.availabilityScore,
});

const toPerson = (view: RecommendationView) => ({ ...view.collaborator });

/** Decisión del líder (tesis, D6), sin datos de quién decidió. */
export function toFeedbackResponse(feedback: RecommendationFeedbackEntity) {
  return {
    decision: feedback.decision,
    reason: feedback.reason,
    rankAtDecision: feedback.rankAtDecision,
    scoreAtDecision: feedback.scoreAtDecision,
    decidedAt: feedback.decidedAt,
  };
}

/** Clave de una decisión: vale para la persona en ese perfil, aunque se regenere la lista. */
export const feedbackKey = (
  requiredProfileId: string,
  collaboratorId: string,
) => `${requiredProfileId}:${collaboratorId}`;

export type FeedbackIndex = ReadonlyMap<string, RecommendationFeedbackEntity>;

export function indexFeedback(
  feedback: RecommendationFeedbackEntity[],
): FeedbackIndex {
  return new Map(
    feedback.map((item) => [
      feedbackKey(item.requiredProfileId, item.collaboratorId),
      item,
    ]),
  );
}

export function toRecommendationItem(
  view: RecommendationView,
  feedback: FeedbackIndex = new Map(),
) {
  const { matchedSkills, missingSkills } = view.breakdown;
  const decision = feedback.get(
    feedbackKey(view.requiredProfileId, view.collaborator.id),
  );
  return {
    id: view.id,
    rank: view.rank,
    score: view.score,
    components: toComponents(view),
    matchedSkillCount: matchedSkills.length,
    requiredSkillCount: matchedSkills.length + missingSkills.length,
    collaborator: toPerson(view),
    feedback: decision ? toFeedbackResponse(decision) : null,
  };
}

export function toRecommendationsResponse(
  projectId: string,
  profiles: RequiredProfileEntity[],
  views: RecommendationView[],
  includeUnavailable: boolean,
  feedback: FeedbackIndex = new Map(),
) {
  const generatedAt = views.reduce<Date | null>(
    (latest, view) =>
      latest === null || view.generatedAt > latest ? view.generatedAt : latest,
    null,
  );
  return {
    projectId,
    generatedAt,
    includeUnavailable,
    profiles: profiles.map((profile) => ({
      profileId: profile.id,
      name: profile.name,
      source: profile.source,
      quantity: profile.quantity,
      priority: profile.priority,
      recommendations: views
        .filter((view) => view.requiredProfileId === profile.id)
        .map((view) => toRecommendationItem(view, feedback)),
    })),
  };
}

export function toRecommendationDetail(
  view: RecommendationView,
  profile: RequiredProfileEntity,
) {
  return {
    id: view.id,
    rank: view.rank,
    score: view.score,
    components: toComponents(view),
    breakdown: view.breakdown,
    generatedAt: view.generatedAt,
    profile: {
      id: profile.id,
      name: profile.name,
      source: profile.source,
      quantity: profile.quantity,
      priority: profile.priority,
    },
    collaborator: toPerson(view),
  };
}
