import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectAnalysisEntity } from '../../domain/entities/project-analysis.entity';
import {
  RequiredProfileEntity,
  RequiredProfileSkillEntity,
} from '../../domain/entities/required-profile.entity';
import { SkillEntity } from '../../domain/entities/skill.entity';
import type { ProjectAnalysisRepository } from '../../domain/repositories/project-analysis.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type {
  RecommendationRepository,
  RecommendationView,
} from '../../domain/repositories/recommendation.repository.interface';
import type { RequiredProfileRepository } from '../../domain/repositories/required-profile.repository.interface';
import type { AppLoggerService } from '../../shared/logging/logger.service';
import {
  buildCollaborator,
  buildCollaboratorSkill,
  buildProject,
  buildProjectType,
  createMock,
} from '../../testing/test-doubles.testing';
import type { ProfileEmbedder } from '../analysis/profile-embedder';
import type { CollaboratorEmbeddingService } from '../analysis/collaborator-embedding.service';
import type { MatchSettings } from '../matchmaking/match-settings';
import { GenerateRecommendationsUseCase } from './generate-recommendations.use-case';
import { GetRecommendationDetailUseCase } from './get-recommendation-detail.use-case';
import { ListRecommendationsUseCase } from './list-recommendations.use-case';

const react = new SkillEntity(
  'k-react',
  'React',
  'react',
  'CONOCIMIENTO',
  'FRAMEWORK',
);

const logger = {
  forContext: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    error: jest.fn(),
  }),
} as unknown as AppLoggerService;

const analysis = new ProjectAnalysisEntity({
  id: 'a1',
  projectId: 'project-1',
  requestedById: 'leader-1',
  status: 'COMPLETADO',
  provider: 'fake',
  model: 'fake-1',
  promptVersion: 'v1',
  input: {},
  inputTokens: null,
  outputTokens: null,
  rawOutput: null,
  summary: 'x',
  errorMessage: null,
  durationMs: 1,
  createdAt: new Date(),
  completedAt: new Date(),
});

const profile = (id = 'rp1', projectId = 'project-1') =>
  new RequiredProfileEntity({
    id,
    projectId,
    analysisId: 'a1',
    source: 'IA',
    name: 'Frontend',
    description: '',
    justification: '',
    quantity: 1,
    priority: 'ALTA',
    minWeeklyHours: null,
    position: 0,
    active: true,
    skills: [
      new RequiredProfileSkillEntity(
        's1',
        id,
        'k-react',
        'React',
        'CONOCIMIENTO',
        'INTERMEDIO',
        'ALTA',
        'React',
      ),
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

const view = (
  overrides: Partial<RecommendationView> = {},
): RecommendationView => ({
  id: 'rec1',
  requiredProfileId: 'rp1',
  rank: 1,
  score: 80,
  skillScore: 1,
  semanticScore: 0.5,
  experienceScore: 0,
  availabilityScore: 1,
  breakdown: {
    matchedSkills: [],
    missingSkills: [],
    experience: { relevantMonths: 0, items: [] },
    availability: {
      status: 'DISPONIBLE',
      weeklyHours: 10,
      requiredHours: null,
    },
    semantic: { similarity: 0.7 },
    weights: {
      skills: 0.5,
      semantic: 0.2,
      experience: 0.15,
      availability: 0.15,
    },
  },
  generatedAt: new Date('2026-10-16'),
  collaborator: {
    id: 'c1',
    fullName: 'Ana Pérez',
    personType: 'ESTUDIANTE',
    programName: 'Ingeniería de Sistemas',
    researchGroup: null,
    availabilityStatus: 'DISPONIBLE',
    weeklyHours: 10,
    hasUser: true,
  },
  ...overrides,
});

const settings: MatchSettings = {
  weights: { skills: 0.5, semantic: 0.2, experience: 0.15, availability: 0.15 },
  topN: 2,
};

const withReact = (id: string, lastName: string, extra = {}) =>
  buildCollaborator({
    id,
    userId: null,
    firstName: 'Persona',
    lastName,
    skills: [buildCollaboratorSkill({ collaboratorId: id, skill: react })],
    ...extra,
  });

describe('GenerateRecommendationsUseCase', () => {
  const projectRepository = createMock<ProjectRepository>();
  const analysisRepository = createMock<ProjectAnalysisRepository>();
  const profileRepository = createMock<RequiredProfileRepository>();
  const typeRepository = createMock<ProjectTypeRepository>();
  const recommendationRepository = createMock<RecommendationRepository>();
  const embeddings = createMock<CollaboratorEmbeddingService>();
  const profileEmbedder = Object.assign(createMock<ProfileEmbedder>(), {
    model: 'gemini/test@768',
  });

  const useCase = new GenerateRecommendationsUseCase(
    projectRepository,
    analysisRepository,
    profileRepository,
    typeRepository,
    recommendationRepository,
    settings,
    embeddings,
    profileEmbedder,
    logger,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    projectRepository.findById.mockResolvedValue(
      buildProject({ id: 'project-1', leaderId: 'leader-1' }),
    );
    analysisRepository.findLatestCompleted.mockResolvedValue(analysis);
    profileRepository.findActiveForProject.mockResolvedValue([profile()]);
    profileRepository.findEmbeddings.mockResolvedValue(
      new Map([['rp1', [1, 0]]]),
    );
    profileEmbedder.refreshStored.mockResolvedValue(new Map());
    typeRepository.findById.mockResolvedValue(buildProjectType());
    embeddings.rebuildStale.mockResolvedValue({
      processed: 0,
      skipped: 0,
      failed: 0,
      remaining: 0,
    });
    recommendationRepository.findCandidates.mockResolvedValue([
      { collaborator: withReact('c1', 'Alfa'), embedding: null },
      { collaborator: withReact('c2', 'Beta'), embedding: null },
      { collaborator: withReact('c3', 'Gamma'), embedding: null },
    ]);
    recommendationRepository.findByProject.mockResolvedValue([view()]);
  });

  it('ranks candidates, keeps the top N per profile and replaces the previous ones', async () => {
    const result = await useCase.execute('leader-1', 'project-1');

    const [projectId, rows] =
      recommendationRepository.replaceForProject.mock.calls[0];
    expect(projectId).toBe('project-1');
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.rank)).toEqual([1, 2]);
    expect(rows[0].requiredProfileId).toBe('rp1');
    expect(result.profiles[0].recommendations).toHaveLength(1);
    expect(result.includeUnavailable).toBe(false);
  });

  it('compares only vectors generated by the current embedding model', async () => {
    await useCase.execute('leader-1', 'project-1');

    expect(recommendationRepository.findCandidates).toHaveBeenCalledWith(
      'gemini/test@768',
    );
    expect(profileRepository.findEmbeddings).toHaveBeenCalledWith(
      ['rp1'],
      'gemini/test@768',
    );
    expect(profileEmbedder.refreshStored).not.toHaveBeenCalled();
  });

  it('re-embeds the profiles whose vector is from another model before comparing', async () => {
    profileRepository.findEmbeddings.mockResolvedValue(new Map());
    profileEmbedder.refreshStored.mockResolvedValue(new Map([['rp1', [1, 0]]]));
    recommendationRepository.findCandidates.mockResolvedValue([
      { collaborator: withReact('c1', 'Alfa'), embedding: [1, 0] },
    ]);

    await useCase.execute('leader-1', 'project-1');

    const [outdated, options] = profileEmbedder.refreshStored.mock.calls[0];
    expect(outdated.map((profile) => profile.id)).toEqual(['rp1']);
    expect(options).toEqual({ timeoutMs: 10_000 });
    const [row] = recommendationRepository.replaceForProject.mock.calls[0][1];
    expect(row.semanticScore).toBeGreaterThan(0);
  });

  it('breaks ties by last name so the order is deterministic', async () => {
    await useCase.execute('leader-1', 'project-1');

    const rows = recommendationRepository.replaceForProject.mock.calls[0][1];
    expect(rows.map((row) => row.collaboratorId)).toEqual(['c1', 'c2']);
  });

  it('puts the strongest candidate first', async () => {
    recommendationRepository.findCandidates.mockResolvedValue([
      {
        collaborator: withReact('weak', 'Aaa', {
          availabilityStatus: 'PARCIAL',
        }),
        embedding: null,
      },
      { collaborator: withReact('strong', 'Zzz'), embedding: null },
    ]);

    await useCase.execute('leader-1', 'project-1');

    const rows = recommendationRepository.replaceForProject.mock.calls[0][1];
    expect(rows[0].collaboratorId).toBe('strong');
  });

  it('never recommends the leader to their own project', async () => {
    recommendationRepository.findCandidates.mockResolvedValue([
      {
        collaborator: withReact('self', 'Propio', { userId: 'leader-1' }),
        embedding: null,
      },
      { collaborator: withReact('c2', 'Beta'), embedding: null },
    ]);

    await useCase.execute('leader-1', 'project-1');

    const rows = recommendationRepository.replaceForProject.mock.calls[0][1];
    expect(rows.map((row) => row.collaboratorId)).toEqual(['c2']);
  });

  it('excludes unavailable people unless asked', async () => {
    const unavailable = withReact('off', 'Aaa', {
      availabilityStatus: 'NO_DISPONIBLE',
    });
    recommendationRepository.findCandidates.mockResolvedValue([
      { collaborator: unavailable, embedding: null },
      { collaborator: withReact('c2', 'Beta'), embedding: null },
    ]);

    await useCase.execute('leader-1', 'project-1');
    expect(
      recommendationRepository.replaceForProject.mock.calls[0][1].map(
        (r) => r.collaboratorId,
      ),
    ).toEqual(['c2']);

    await useCase.execute('leader-1', 'project-1', {
      includeUnavailable: true,
    });
    expect(
      recommendationRepository.replaceForProject.mock.calls[1][1].map(
        (r) => r.collaboratorId,
      ),
    ).toContain('off');
    expect(recommendationRepository.findByProject).toHaveBeenLastCalledWith(
      'project-1',
      {
        includeUnavailable: true,
      },
    );
  });

  it('skips people with nothing in common with the profile', async () => {
    recommendationRepository.findCandidates.mockResolvedValue([
      {
        collaborator: buildCollaborator({ id: 'nothing', userId: null }),
        embedding: null,
      },
    ]);

    await useCase.execute('leader-1', 'project-1');

    expect(recommendationRepository.replaceForProject.mock.calls[0][1]).toEqual(
      [],
    );
  });

  it('still recommends when refreshing the embeddings fails', async () => {
    embeddings.rebuildStale.mockRejectedValue(new Error('sin red'));

    await expect(
      useCase.execute('leader-1', 'project-1'),
    ).resolves.toBeDefined();
    expect(recommendationRepository.replaceForProject).toHaveBeenCalled();
  });

  it('throws ConflictException when the project has no analysis', async () => {
    analysisRepository.findLatestCompleted.mockResolvedValue(null);

    await expect(
      useCase.execute('leader-1', 'project-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(recommendationRepository.replaceForProject).not.toHaveBeenCalled();
  });

  it('throws ConflictException when every profile was discarded', async () => {
    profileRepository.findActiveForProject.mockResolvedValue([]);

    await expect(
      useCase.execute('leader-1', 'project-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws ForbiddenException for a project of another leader', async () => {
    await expect(
      useCase.execute('intruder', 'project-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('ListRecommendationsUseCase', () => {
  const projectRepository = createMock<ProjectRepository>();
  const analysisRepository = createMock<ProjectAnalysisRepository>();
  const profileRepository = createMock<RequiredProfileRepository>();
  const recommendationRepository = createMock<RecommendationRepository>();
  const useCase = new ListRecommendationsUseCase(
    projectRepository,
    analysisRepository,
    profileRepository,
    recommendationRepository,
  );
  const leader = { userId: 'leader-1', role: 'LIDER' as const };

  beforeEach(() => {
    jest.resetAllMocks();
    projectRepository.findById.mockResolvedValue(
      buildProject({ id: 'project-1', leaderId: 'leader-1' }),
    );
    analysisRepository.findLatestCompleted.mockResolvedValue(analysis);
    profileRepository.findActiveForProject.mockResolvedValue([profile()]);
    recommendationRepository.findByProject.mockResolvedValue([view()]);
  });

  it('groups the recommendations by profile without exposing contact data', async () => {
    const result = await useCase.execute(leader, 'project-1');

    expect(result.profiles).toHaveLength(1);
    const item = result.profiles[0].recommendations[0];
    expect(item).toMatchObject({ rank: 1, score: 80 });
    expect(Object.keys(item.collaborator)).not.toEqual(
      expect.arrayContaining(['email', 'profileUrl']),
    );
    expect(result.generatedAt).toEqual(new Date('2026-10-16'));
  });

  it('lets an ADMIN read them', async () => {
    await expect(
      useCase.execute({ userId: 'admin-1', role: 'ADMIN' }, 'project-1'),
    ).resolves.toBeDefined();
  });

  it('passes the filters to the repository', async () => {
    await useCase.execute(leader, 'project-1', {
      profileId: 'rp1',
      includeUnavailable: true,
    });

    expect(recommendationRepository.findByProject).toHaveBeenCalledWith(
      'project-1',
      {
        profileId: 'rp1',
        includeUnavailable: true,
      },
    );
  });

  it('throws NotFoundException for a profile that is not active in the project', async () => {
    await expect(
      useCase.execute(leader, 'project-1', { profileId: 'otro' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns empty lists before generating', async () => {
    recommendationRepository.findByProject.mockResolvedValue([]);

    const result = await useCase.execute(leader, 'project-1');

    expect(result.generatedAt).toBeNull();
    expect(result.profiles[0].recommendations).toEqual([]);
  });

  it('throws ForbiddenException for another leader', async () => {
    await expect(
      useCase.execute({ userId: 'other', role: 'LIDER' }, 'project-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('GetRecommendationDetailUseCase', () => {
  const projectRepository = createMock<ProjectRepository>();
  const profileRepository = createMock<RequiredProfileRepository>();
  const recommendationRepository = createMock<RecommendationRepository>();
  const useCase = new GetRecommendationDetailUseCase(
    projectRepository,
    profileRepository,
    recommendationRepository,
  );
  const leader = { userId: 'leader-1', role: 'LIDER' as const };

  beforeEach(() => {
    jest.resetAllMocks();
    projectRepository.findById.mockResolvedValue(
      buildProject({ id: 'project-1', leaderId: 'leader-1' }),
    );
    recommendationRepository.findViewById.mockResolvedValue(view());
    profileRepository.findById.mockResolvedValue(profile());
  });

  it('returns the breakdown with the profile and the person', async () => {
    const result = await useCase.execute(leader, 'project-1', 'rec1');

    expect(result.breakdown.semantic.similarity).toBe(0.7);
    expect(result.profile).toMatchObject({ id: 'rp1', name: 'Frontend' });
    expect(result.collaborator.fullName).toBe('Ana Pérez');
    expect(result.components.skills).toBe(1);
  });

  it('treats a recommendation of another project as not found', async () => {
    profileRepository.findById.mockResolvedValue(
      profile('rp1', 'otro-proyecto'),
    );

    await expect(
      useCase.execute(leader, 'project-1', 'rec1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException when it does not exist', async () => {
    recommendationRepository.findViewById.mockResolvedValue(null);

    await expect(
      useCase.execute(leader, 'project-1', 'x'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
