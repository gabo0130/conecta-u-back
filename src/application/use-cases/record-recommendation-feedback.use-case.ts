import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { RecommendationFeedbackRepository } from '../../domain/repositories/recommendation-feedback.repository.interface';
import type { RecommendationRepository } from '../../domain/repositories/recommendation.repository.interface';
import type { RequiredProfileRepository } from '../../domain/repositories/required-profile.repository.interface';
import {
  PROJECT_REPOSITORY,
  RECOMMENDATION_FEEDBACK_REPOSITORY,
  RECOMMENDATION_REPOSITORY,
  REQUIRED_PROFILE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { RecommendationFeedbackDto } from '../dto/recommendations.dto';
import { toFeedbackResponse } from '../mappers/recommendation-response.mapper';
import { loadOwnedProject } from '../support/project-access';

export const RECOMMENDATION_NOT_FOUND = 'Recomendación no encontrada';

/**
 * Tesis (T7, D6): el líder dueño acepta o descarta a una persona recomendada. Se guarda por
 * perfil y persona con el puesto y el puntaje actuales; repetir la decisión la reemplaza.
 */
@Injectable()
export class RecordRecommendationFeedbackUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(REQUIRED_PROFILE_REPOSITORY)
    private readonly requiredProfileRepository: RequiredProfileRepository,
    @Inject(RECOMMENDATION_REPOSITORY)
    private readonly recommendationRepository: RecommendationRepository,
    @Inject(RECOMMENDATION_FEEDBACK_REPOSITORY)
    private readonly feedbackRepository: RecommendationFeedbackRepository,
  ) {}

  async execute(
    userId: string,
    projectId: string,
    recommendationId: string,
    data: RecommendationFeedbackDto,
  ) {
    await loadOwnedProject(this.projectRepository, userId, projectId);
    const view =
      await this.recommendationRepository.findViewById(recommendationId);
    const profile = view
      ? await this.requiredProfileRepository.findById(view.requiredProfileId)
      : null;
    // Una recomendación de otro proyecto se trata como inexistente.
    if (!view || profile?.projectId !== projectId) {
      throw new NotFoundException({ message: RECOMMENDATION_NOT_FOUND });
    }
    const feedback = await this.feedbackRepository.upsert({
      projectId,
      requiredProfileId: view.requiredProfileId,
      collaboratorId: view.collaborator.id,
      decision: data.decision,
      reason: data.reason ?? null,
      rankAtDecision: view.rank,
      scoreAtDecision: view.score,
      decidedById: userId,
    });
    return { recommendationId, ...toFeedbackResponse(feedback) };
  }
}
