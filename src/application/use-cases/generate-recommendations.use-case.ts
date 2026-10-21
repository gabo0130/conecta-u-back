import { ConflictException, Inject, Injectable } from '@nestjs/common';
import type { ProjectAnalysisRepository } from '../../domain/repositories/project-analysis.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type {
  MatchCandidate,
  NewRecommendation,
  RecommendationRepository,
} from '../../domain/repositories/recommendation.repository.interface';
import type { RequiredProfileEntity } from '../../domain/entities/required-profile.entity';
import type { RequiredProfileRepository } from '../../domain/repositories/required-profile.repository.interface';
import { computeMatch } from '../../domain/services/match-score';
import {
  MATCH_SETTINGS,
  PROJECT_ANALYSIS_REPOSITORY,
  PROJECT_REPOSITORY,
  PROJECT_TYPE_REPOSITORY,
  RECOMMENDATION_REPOSITORY,
  REQUIRED_PROFILE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { AppLoggerService } from '../../shared/logging/logger.service';
import { CollaboratorEmbeddingService } from '../analysis/collaborator-embedding.service';
import { ProfileEmbedder } from '../analysis/profile-embedder';
import { REBUILD_MAX_LIMIT } from '../dto/rebuild-embeddings.dto';
import type { GenerateRecommendationsDto } from '../dto/recommendations.dto';
import { toRecommendationsResponse } from '../mappers/recommendation-response.mapper';
import {
  projectExperienceType,
  toPersonSpec,
  toProfileSpec,
} from '../matchmaking/match-input';
import type { MatchSettings } from '../matchmaking/match-settings';
import { loadOwnedProject } from '../support/project-access';

/**
 * Antes de calcular se ponen al día los embeddings que falten, con un tope de personas y de
 * tiempo: la petición del líder no puede quedar colgada si el proveedor está lento.
 */
const EMBEDDING_REFRESH_LIMIT = REBUILD_MAX_LIMIT;
const EMBEDDING_REFRESH_BUDGET_MS = 20_000;
/** Tope para regenerar los perfiles del proyecto cuyo vector es de otro modelo (pocos, 1–5). */
const PROFILE_REFRESH_BUDGET_MS = 10_000;

/**
 * RF15–RF16: compara cada perfil requerido activo con las personas elegibles y guarda las
 * mejores `topN` por perfil. Reemplaza las recomendaciones anteriores del proyecto.
 */
@Injectable()
export class GenerateRecommendationsUseCase {
  private readonly logger: ReturnType<AppLoggerService['forContext']>;

  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_ANALYSIS_REPOSITORY)
    private readonly analysisRepository: ProjectAnalysisRepository,
    @Inject(REQUIRED_PROFILE_REPOSITORY)
    private readonly requiredProfileRepository: RequiredProfileRepository,
    @Inject(PROJECT_TYPE_REPOSITORY)
    private readonly projectTypeRepository: ProjectTypeRepository,
    @Inject(RECOMMENDATION_REPOSITORY)
    private readonly recommendationRepository: RecommendationRepository,
    @Inject(MATCH_SETTINGS) private readonly settings: MatchSettings,
    private readonly collaboratorEmbeddings: CollaboratorEmbeddingService,
    private readonly profileEmbedder: ProfileEmbedder,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(GenerateRecommendationsUseCase.name);
  }

  async execute(
    userId: string,
    projectId: string,
    { includeUnavailable = false }: GenerateRecommendationsDto = {},
  ) {
    const project = await loadOwnedProject(
      this.projectRepository,
      userId,
      projectId,
    );
    const analysis =
      await this.analysisRepository.findLatestCompleted(projectId);
    if (!analysis) {
      throw new ConflictException({
        message:
          'Primero analiza el proyecto con IA para obtener los perfiles requeridos.',
      });
    }
    const profiles = await this.requiredProfileRepository.findActiveForProject(
      projectId,
      analysis.id,
    );
    if (profiles.length === 0) {
      throw new ConflictException({
        message: 'El proyecto no tiene perfiles requeridos activos.',
      });
    }

    await this.refreshEmbeddings();
    // Solo se comparan vectores del modelo actual: los de otro modelo no son comparables.
    const model = this.profileEmbedder.model;
    const [candidates, profileEmbeddings, projectType] = await Promise.all([
      this.recommendationRepository.findCandidates(model),
      this.currentProfileEmbeddings(profiles, model),
      this.projectTypeRepository.findById(project.typeId),
    ]);

    // El líder no se recomienda a sí mismo; quien hoy no está disponible, solo si se pide.
    const eligible = candidates.filter(
      ({ collaborator }) =>
        collaborator.userId !== project.leaderId &&
        (includeUnavailable ||
          collaborator.availabilityStatus !== 'NO_DISPONIBLE'),
    );
    const experienceType = projectExperienceType(projectType?.code ?? null);
    const now = new Date();

    const rows = profiles.flatMap((profile) =>
      this.rankCandidates(
        profile.id,
        toProfileSpec(profile, profileEmbeddings.get(profile.id) ?? null),
        eligible,
        experienceType,
        now,
      ),
    );
    await this.recommendationRepository.replaceForProject(projectId, rows);

    const views = await this.recommendationRepository.findByProject(projectId, {
      includeUnavailable,
    });
    return toRecommendationsResponse(
      projectId,
      profiles,
      views,
      includeUnavailable,
    );
  }

  private rankCandidates(
    requiredProfileId: string,
    profile: ReturnType<typeof toProfileSpec>,
    candidates: MatchCandidate[],
    experienceType: ReturnType<typeof projectExperienceType>,
    now: Date,
  ): NewRecommendation[] {
    return candidates
      .map(({ collaborator, embedding }) => ({
        collaborator,
        result: computeMatch(
          profile,
          toPersonSpec(collaborator, embedding, now),
          {
            weights: this.settings.weights,
            projectExperienceType: experienceType,
          },
        ),
      }))
      .filter(({ result }) => result.relevant)
      .sort(
        (a, b) =>
          b.result.score - a.result.score ||
          b.result.components.skills - a.result.components.skills ||
          a.collaborator.lastName.localeCompare(b.collaborator.lastName) ||
          a.collaborator.firstName.localeCompare(b.collaborator.firstName),
      )
      .slice(0, this.settings.topN)
      .map(({ collaborator, result }, index) => ({
        requiredProfileId,
        collaboratorId: collaborator.id,
        rank: index + 1,
        score: result.score,
        skillScore: result.components.skills,
        semanticScore: result.components.semantic,
        experienceScore: result.components.experience,
        availabilityScore: result.components.availability,
        breakdown: result.breakdown,
      }));
  }

  /**
   * Embeddings de los perfiles con el modelo actual. Los que faltan o son de otro modelo
   * (p. ej. se analizó con `fake` y hoy se usa Gemini) se regeneran ahora; si el proveedor
   * falla, esos perfiles se comparan sin la parte semántica.
   */
  private async currentProfileEmbeddings(
    profiles: RequiredProfileEntity[],
    model: string,
  ): Promise<Map<string, number[]>> {
    const current = await this.requiredProfileRepository.findEmbeddings(
      profiles.map((profile) => profile.id),
      model,
    );
    const outdated = profiles.filter((profile) => !current.has(profile.id));
    if (outdated.length === 0) return current;

    const refreshed = await this.profileEmbedder.refreshStored(outdated, {
      timeoutMs: PROFILE_REFRESH_BUDGET_MS,
    });
    return new Map([...current, ...refreshed]);
  }

  /** La parte semántica es opcional: si no se pueden calcular, se recomienda sin ella. */
  private async refreshEmbeddings(): Promise<void> {
    try {
      await this.collaboratorEmbeddings.rebuildStale(EMBEDDING_REFRESH_LIMIT, {
        maxDurationMs: EMBEDDING_REFRESH_BUDGET_MS,
      });
    } catch (error) {
      this.logger.warn('No se pudieron actualizar los embeddings de personas', {
        method: 'refreshEmbeddings',
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
