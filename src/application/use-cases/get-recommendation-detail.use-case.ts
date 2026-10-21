import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { RecommendationRepository } from '../../domain/repositories/recommendation.repository.interface';
import type { RequiredProfileRepository } from '../../domain/repositories/required-profile.repository.interface';
import {
  PROJECT_REPOSITORY,
  RECOMMENDATION_REPOSITORY,
  REQUIRED_PROFILE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { toRecommendationDetail } from '../mappers/recommendation-response.mapper';
import { type Actor, loadProjectForViewer } from '../support/project-access';

/** RF17: por qué se recomienda a una persona (desglose del puntaje). */
@Injectable()
export class GetRecommendationDetailUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(REQUIRED_PROFILE_REPOSITORY)
    private readonly requiredProfileRepository: RequiredProfileRepository,
    @Inject(RECOMMENDATION_REPOSITORY)
    private readonly recommendationRepository: RecommendationRepository,
  ) {}

  async execute(actor: Actor, projectId: string, recommendationId: string) {
    await loadProjectForViewer(this.projectRepository, actor, projectId);

    const view =
      await this.recommendationRepository.findViewById(recommendationId);
    const profile = view
      ? await this.requiredProfileRepository.findById(view.requiredProfileId)
      : null;
    // Una recomendación de otro proyecto se trata como inexistente (no se filtra su existencia).
    if (!view || profile?.projectId !== projectId) {
      throw new NotFoundException({ message: 'Recomendación no encontrada' });
    }
    return toRecommendationDetail(view, profile);
  }
}
