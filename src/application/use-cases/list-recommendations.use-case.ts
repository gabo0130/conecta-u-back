import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ProjectAnalysisRepository } from '../../domain/repositories/project-analysis.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { RecommendationRepository } from '../../domain/repositories/recommendation.repository.interface';
import type { RequiredProfileRepository } from '../../domain/repositories/required-profile.repository.interface';
import {
  PROJECT_ANALYSIS_REPOSITORY,
  PROJECT_REPOSITORY,
  RECOMMENDATION_REPOSITORY,
  REQUIRED_PROFILE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import type { ListRecommendationsQueryDto } from '../dto/recommendations.dto';
import { toRecommendationsResponse } from '../mappers/recommendation-response.mapper';
import { type Actor, loadProjectForViewer } from '../support/project-access';

/** RF16: lista ordenada de personas recomendadas por perfil (LIDER dueño o ADMIN). */
@Injectable()
export class ListRecommendationsUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_ANALYSIS_REPOSITORY)
    private readonly analysisRepository: ProjectAnalysisRepository,
    @Inject(REQUIRED_PROFILE_REPOSITORY)
    private readonly requiredProfileRepository: RequiredProfileRepository,
    @Inject(RECOMMENDATION_REPOSITORY)
    private readonly recommendationRepository: RecommendationRepository,
  ) {}

  async execute(
    actor: Actor,
    projectId: string,
    { profileId, includeUnavailable = false }: ListRecommendationsQueryDto = {},
  ) {
    await loadProjectForViewer(this.projectRepository, actor, projectId);
    const analysis =
      await this.analysisRepository.findLatestCompleted(projectId);
    const allProfiles =
      await this.requiredProfileRepository.findActiveForProject(
        projectId,
        analysis?.id ?? null,
      );

    const profiles = profileId
      ? allProfiles.filter((profile) => profile.id === profileId)
      : allProfiles;
    if (profileId && profiles.length === 0) {
      throw new NotFoundException({ message: 'Perfil no encontrado' });
    }

    const views = await this.recommendationRepository.findByProject(projectId, {
      profileId,
      includeUnavailable,
    });
    return toRecommendationsResponse(
      projectId,
      profiles,
      views,
      includeUnavailable,
    );
  }
}
