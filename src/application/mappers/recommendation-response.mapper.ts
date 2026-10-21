import type { RequiredProfileEntity } from '../../domain/entities/required-profile.entity';
import type { RecommendationView } from '../../domain/repositories/recommendation.repository.interface';

// Respuestas de las recomendaciones (RF15–RF17). Nunca incluyen correo, teléfono ni enlaces.

const toComponents = (view: RecommendationView) => ({
  skills: view.skillScore,
  semantic: view.semanticScore,
  experience: view.experienceScore,
  availability: view.availabilityScore,
});

const toPerson = (view: RecommendationView) => ({ ...view.collaborator });

export function toRecommendationItem(view: RecommendationView) {
  const { matchedSkills, missingSkills } = view.breakdown;
  return {
    id: view.id,
    rank: view.rank,
    score: view.score,
    components: toComponents(view),
    matchedSkillCount: matchedSkills.length,
    requiredSkillCount: matchedSkills.length + missingSkills.length,
    collaborator: toPerson(view),
  };
}

export function toRecommendationsResponse(
  projectId: string,
  profiles: RequiredProfileEntity[],
  views: RecommendationView[],
  includeUnavailable: boolean,
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
        .map(toRecommendationItem),
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
