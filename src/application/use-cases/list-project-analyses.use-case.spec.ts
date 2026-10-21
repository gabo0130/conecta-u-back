import { ForbiddenException } from '@nestjs/common';
import { ProjectAnalysisEntity } from '../../domain/entities/project-analysis.entity';
import type { ProjectAnalysisRepository } from '../../domain/repositories/project-analysis.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import { buildProject, createMock } from '../../testing/test-doubles.testing';
import type { AnalysisRecoveryService } from '../analysis/analysis-recovery.service';
import { ListProjectAnalysesUseCase } from './list-project-analyses.use-case';

const analysis = new ProjectAnalysisEntity({
  id: 'a1',
  projectId: 'project-1',
  requestedById: 'leader-1',
  status: 'ERROR',
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  promptVersion: 'v1',
  input: {},
  inputTokens: 10,
  outputTokens: 5,
  rawOutput: null,
  summary: null,
  errorMessage: 'timeout',
  durationMs: 30000,
  createdAt: new Date(),
  completedAt: null,
});

describe('ListProjectAnalysesUseCase', () => {
  const projectRepository = createMock<ProjectRepository>();
  const analysisRepository = createMock<ProjectAnalysisRepository>();
  const recovery = createMock<AnalysisRecoveryService>();
  const useCase = new ListProjectAnalysesUseCase(
    projectRepository,
    analysisRepository,
    recovery,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    projectRepository.findById.mockResolvedValue(buildProject());
  });

  it('returns the history with pagination metadata', async () => {
    analysisRepository.findByProjectId.mockResolvedValue({
      items: [analysis],
      total: 1,
    });

    const result = await useCase.execute(
      { userId: 'leader-1', role: 'LIDER' },
      'project-1',
      { page: 1, pageSize: 20 },
    );

    expect(result.analyses).toHaveLength(1);
    expect(result.analyses[0]).toMatchObject({ id: 'a1', status: 'ERROR' });
    expect(result.meta).toMatchObject({ page: 1, pageSize: 20, total: 1 });
    // El historial no muestra como PENDIENTE un análisis que ya no está vivo.
    expect(recovery.recover).toHaveBeenCalledWith('project-1');
  });

  it('throws ForbiddenException for another leader', async () => {
    await expect(
      useCase.execute({ userId: 'other', role: 'LIDER' }, 'project-1', {
        page: 1,
        pageSize: 20,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(analysisRepository.findByProjectId).not.toHaveBeenCalled();
  });
});
