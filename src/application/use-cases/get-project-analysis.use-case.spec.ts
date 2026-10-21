import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectAnalysisEntity } from '../../domain/entities/project-analysis.entity';
import type { ProjectAnalysisRepository } from '../../domain/repositories/project-analysis.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { RequiredProfileRepository } from '../../domain/repositories/required-profile.repository.interface';
import { buildProject, createMock } from '../../testing/test-doubles.testing';
import {
  projectFingerprint,
  type AnalysisInputBuilder,
} from '../analysis/analysis-input.builder';
import type { AnalysisRecoveryService } from '../analysis/analysis-recovery.service';
import { GetProjectAnalysisUseCase } from './get-project-analysis.use-case';

const projectInput = {
  title: 'Conecta U',
  summary: 'Resumen',
  objectives: 'Objetivos',
  type: { name: 'Curso', fields: [] },
  category: 'Desarrollo',
  program: null,
  deliverables: [],
  knownSkills: [],
};

const analysisWith = (fingerprint: string) =>
  new ProjectAnalysisEntity({
    id: 'a1',
    projectId: 'project-1',
    requestedById: 'leader-1',
    status: 'COMPLETADO',
    provider: 'fake',
    model: 'fake-1',
    promptVersion: 'v1',
    input: { fingerprint },
    inputTokens: null,
    outputTokens: null,
    rawOutput: null,
    summary: 'Resumen del análisis',
    errorMessage: null,
    durationMs: 10,
    createdAt: new Date(),
    completedAt: new Date(),
  });

describe('GetProjectAnalysisUseCase', () => {
  const projectRepository = createMock<ProjectRepository>();
  const analysisRepository = createMock<ProjectAnalysisRepository>();
  const requiredProfileRepository = createMock<RequiredProfileRepository>();
  const inputBuilder = createMock<AnalysisInputBuilder>();
  const recovery = createMock<AnalysisRecoveryService>();

  const useCase = new GetProjectAnalysisUseCase(
    projectRepository,
    analysisRepository,
    requiredProfileRepository,
    inputBuilder,
    recovery,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    projectRepository.findById.mockResolvedValue(buildProject());
    inputBuilder.buildProject.mockResolvedValue(projectInput);
    requiredProfileRepository.findActiveForProject.mockResolvedValue([]);
  });

  it('recovers an interrupted analysis before reading, so the project leaves EN_ANALISIS', async () => {
    analysisRepository.findLatestCompleted.mockResolvedValue(
      analysisWith(projectFingerprint(projectInput)),
    );

    await useCase.execute({ userId: 'leader-1', role: 'LIDER' }, 'project-1');

    expect(recovery.recover).toHaveBeenCalledWith('project-1');
    expect(recovery.recover.mock.invocationCallOrder[0]).toBeLessThan(
      analysisRepository.findLatestCompleted.mock.invocationCallOrder[0],
    );
  });

  it('is not outdated when the project did not change since the analysis', async () => {
    analysisRepository.findLatestCompleted.mockResolvedValue(
      analysisWith(projectFingerprint(projectInput)),
    );

    const result = await useCase.execute(
      { userId: 'leader-1', role: 'LIDER' },
      'project-1',
    );

    expect(result.outdated).toBe(false);
    expect(requiredProfileRepository.findActiveForProject).toHaveBeenCalledWith(
      'project-1',
      'a1',
    );
  });

  it('flags the analysis as outdated when the project changed', async () => {
    analysisRepository.findLatestCompleted.mockResolvedValue(
      analysisWith('huella-vieja'),
    );

    const result = await useCase.execute(
      { userId: 'leader-1', role: 'LIDER' },
      'project-1',
    );

    expect(result.outdated).toBe(true);
  });

  it('lets an ADMIN read the analysis of any project', async () => {
    analysisRepository.findLatestCompleted.mockResolvedValue(analysisWith('x'));

    await expect(
      useCase.execute({ userId: 'admin-1', role: 'ADMIN' }, 'project-1'),
    ).resolves.toBeDefined();
  });

  it('throws NotFoundException when the project has no analysis yet', async () => {
    analysisRepository.findLatestCompleted.mockResolvedValue(null);

    await expect(
      useCase.execute({ userId: 'leader-1', role: 'LIDER' }, 'project-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException for another leader', async () => {
    await expect(
      useCase.execute({ userId: 'other', role: 'LIDER' }, 'project-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
