import { Inject, Injectable } from '@nestjs/common';
import type { ProjectAnalysisRepository } from '../../domain/repositories/project-analysis.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import {
  PROJECT_ANALYSIS_REPOSITORY,
  PROJECT_REPOSITORY,
} from '../../shared/interfaces/tokens';
import {
  toPageMeta,
  type PageParams,
} from '../../shared/pagination/pagination.util';
import { toAnalysisSummary } from '../mappers/analysis-response.mapper';
import { AnalysisRecoveryService } from '../analysis/analysis-recovery.service';
import { type Actor, loadProjectForViewer } from '../support/project-access';

/** Historial de análisis de un proyecto (RNF8): fecha, estado, modelo y consumo. */
@Injectable()
export class ListProjectAnalysesUseCase {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: ProjectRepository,
    @Inject(PROJECT_ANALYSIS_REPOSITORY)
    private readonly analysisRepository: ProjectAnalysisRepository,
    private readonly recovery: AnalysisRecoveryService,
  ) {}

  async execute(actor: Actor, projectId: string, params: PageParams) {
    await loadProjectForViewer(this.projectRepository, actor, projectId);
    // El historial no debe mostrar como PENDIENTE un análisis que ya no está vivo.
    await this.recovery.recover(projectId);
    const { items, total } = await this.analysisRepository.findByProjectId(
      projectId,
      params,
    );
    return {
      analyses: items.map(toAnalysisSummary),
      meta: toPageMeta(params.page, params.pageSize, total),
    };
  }
}
