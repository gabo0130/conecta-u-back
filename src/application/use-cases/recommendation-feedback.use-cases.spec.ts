import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { RecommendationFeedbackEntity } from '../../domain/entities/recommendation-feedback';
import { acceptanceRate } from '../../domain/entities/recommendation-feedback';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { RecommendationFeedbackRepository } from '../../domain/repositories/recommendation-feedback.repository.interface';
import type {
  RecommendationRepository,
  RecommendationView,
} from '../../domain/repositories/recommendation.repository.interface';
import type { RequiredProfileRepository } from '../../domain/repositories/required-profile.repository.interface';
import {
  buildProject,
  buildRequiredProfile,
  createMock,
} from '../../testing/test-doubles.testing';
import { GetEvaluationSummaryUseCase } from './get-evaluation-summary.use-case';
import { RecordRecommendationFeedbackUseCase } from './record-recommendation-feedback.use-case';

const view = {
  id: 'rec1',
  requiredProfileId: 'rp1',
  rank: 3,
  score: 71.5,
  collaborator: { id: 'c1' },
} as RecommendationView;

const saved = (
  overrides: Partial<RecommendationFeedbackEntity> = {},
): RecommendationFeedbackEntity => ({
  id: 'f1',
  projectId: 'project-1',
  requiredProfileId: 'rp1',
  collaboratorId: 'c1',
  decision: 'DESCARTADA',
  reason: 'No tiene la disponibilidad',
  rankAtDecision: 3,
  scoreAtDecision: 71.5,
  decidedById: 'leader-1',
  decidedAt: new Date('2026-11-02'),
  ...overrides,
});

describe('RecordRecommendationFeedbackUseCase (T7)', () => {
  const projectRepository = createMock<ProjectRepository>();
  const profileRepository = createMock<RequiredProfileRepository>();
  const recommendationRepository = createMock<RecommendationRepository>();
  const feedbackRepository = createMock<RecommendationFeedbackRepository>();
  const useCase = new RecordRecommendationFeedbackUseCase(
    projectRepository,
    profileRepository,
    recommendationRepository,
    feedbackRepository,
  );
  const dto = {
    decision: 'DESCARTADA' as const,
    reason: 'No tiene la disponibilidad',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    projectRepository.findById.mockResolvedValue(
      buildProject({ id: 'project-1', leaderId: 'leader-1' }),
    );
    recommendationRepository.findViewById.mockResolvedValue(view);
    profileRepository.findById.mockResolvedValue(
      buildRequiredProfile({ id: 'rp1', projectId: 'project-1' }),
    );
    feedbackRepository.upsert.mockResolvedValue(saved());
  });

  it('guarda la decisión con el puesto y el puntaje del momento', async () => {
    const result = await useCase.execute('leader-1', 'project-1', 'rec1', dto);

    expect(feedbackRepository.upsert).toHaveBeenCalledWith({
      projectId: 'project-1',
      requiredProfileId: 'rp1',
      collaboratorId: 'c1',
      decision: 'DESCARTADA',
      reason: 'No tiene la disponibilidad',
      rankAtDecision: 3,
      scoreAtDecision: 71.5,
      decidedById: 'leader-1',
    });
    expect(result).toEqual({
      recommendationId: 'rec1',
      decision: 'DESCARTADA',
      reason: 'No tiene la disponibilidad',
      rankAtDecision: 3,
      scoreAtDecision: 71.5,
      decidedAt: new Date('2026-11-02'),
    });
  });

  it('404 si la recomendación no existe o es de otro proyecto', async () => {
    recommendationRepository.findViewById.mockResolvedValue(null);
    await expect(
      useCase.execute('leader-1', 'project-1', 'x', dto),
    ).rejects.toThrow(NotFoundException);

    recommendationRepository.findViewById.mockResolvedValue(view);
    profileRepository.findById.mockResolvedValue(
      buildRequiredProfile({ id: 'rp1', projectId: 'otro' }),
    );
    await expect(
      useCase.execute('leader-1', 'project-1', 'rec1', dto),
    ).rejects.toThrow(NotFoundException);
    expect(feedbackRepository.upsert).not.toHaveBeenCalled();
  });

  it('solo el líder dueño decide (403)', async () => {
    await expect(
      useCase.execute('otro', 'project-1', 'rec1', dto),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('GetEvaluationSummaryUseCase (T7)', () => {
  it('calcula la tasa de aceptación global y por proyecto', async () => {
    const feedbackRepository = createMock<RecommendationFeedbackRepository>();
    feedbackRepository.countGlobal.mockResolvedValue({
      accepted: 3,
      discarded: 1,
    });
    feedbackRepository.countByProject.mockResolvedValue([
      { projectId: 'p1', projectTitle: 'Huerta', accepted: 3, discarded: 0 },
      { projectId: 'p2', projectTitle: 'Citas', accepted: 0, discarded: 1 },
    ]);

    await expect(
      new GetEvaluationSummaryUseCase(feedbackRepository).execute(),
    ).resolves.toEqual({
      acceptance: {
        accepted: 3,
        discarded: 1,
        decided: 4,
        acceptanceRate: 0.75,
      },
      byProject: [
        {
          projectId: 'p1',
          projectTitle: 'Huerta',
          accepted: 3,
          discarded: 0,
          decided: 3,
          acceptanceRate: 1,
        },
        {
          projectId: 'p2',
          projectTitle: 'Citas',
          accepted: 0,
          discarded: 1,
          decided: 1,
          acceptanceRate: 0,
        },
      ],
    });
  });

  it('sin decisiones la tasa es null (no 0)', () => {
    expect(acceptanceRate(0, 0)).toBeNull();
    expect(acceptanceRate(1, 2)).toBe(0.3333);
  });
});
