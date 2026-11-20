import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ProjectAnalysisRepository } from '../../domain/repositories/project-analysis.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { RequiredProfileRepository } from '../../domain/repositories/required-profile.repository.interface';
import {
  PROJECT_ANALYSIS_REPOSITORY,
  PROJECT_REPOSITORY,
  REQUIRED_PROFILE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import {
  AnalysisInputBuilder,
  projectFingerprint,
} from '../analysis/analysis-input.builder';
import {
  toAnalysisSummary,
  toProjectAnalysisResponse,
} from '../mappers/analysis-response.mapper';
import { AnalysisRecoveryService } from '../analysis/analysis-recovery.service';
import { type Actor, loadProjectForViewer } from '../support/project-access';

/**
 * RF6–RF7: el último análisis completado de un proyecto, con sus perfiles y justificaciones.
 * Con `analysisId`, ese intento en cualquier estado: el front lo consulta mientras corre en
 * segundo plano (PENDIENTE → COMPLETADO o ERROR).
 */
@Injectable()
export class GetProjectAnalysisUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_ANALYSIS_REPOSITORY)
    private readonly analysisRepository: ProjectAnalysisRepository,
    @Inject(REQUIRED_PROFILE_REPOSITORY)
    private readonly requiredProfileRepository: RequiredProfileRepository,
    private readonly inputBuilder: AnalysisInputBuilder,
    private readonly recovery: AnalysisRecoveryService,
  ) {}

  async execute(actor: Actor, projectId: string, analysisId?: string) {
    const project = await loadProjectForViewer(
      this.projectRepository,
      actor,
      projectId,
    );
    // Si un análisis quedó colgado, el proyecto deja EN_ANALISIS antes de mostrarse.
    await this.recovery.recover(projectId);
    const analysis = analysisId
      ? await this.findAttempt(projectId, analysisId)
      : await this.analysisRepository.findLatestCompleted(projectId);
    if (!analysis) {
      throw new NotFoundException({
        message: analysisId
          ? 'Análisis no encontrado.'
          : 'Este proyecto aún no tiene un análisis.',
      });
    }
    // En curso o fallido: aún no tiene perfiles que mostrar.
    if (analysis.status !== 'COMPLETADO') {
      return { ...toAnalysisSummary(analysis), outdated: false, profiles: [] };
    }

    const profiles = await this.requiredProfileRepository.findActiveForProject(
      projectId,
      analysis.id,
    );
    const current = projectFingerprint(
      await this.inputBuilder.buildProject(project),
    );
    const outdated = analysis.input.fingerprint !== current;

    return toProjectAnalysisResponse(analysis, profiles, outdated);
  }

  private async findAttempt(projectId: string, analysisId: string) {
    const analysis = await this.analysisRepository.findById(analysisId);
    return analysis?.projectId === projectId ? analysis : null;
  }
}
