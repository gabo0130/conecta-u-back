import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ProjectAnalysisEntity } from '../../domain/entities/project-analysis.entity';
import { RequiredProfileEntity } from '../../domain/entities/required-profile.entity';
import type { ProjectAnalysisRepository } from '../../domain/repositories/project-analysis.repository.interface';
import {
  AnalyzerUnavailableError,
  type ProjectAnalyzer,
} from '../../domain/repositories/project-analyzer.interface';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { AppLoggerService } from '../../shared/logging/logger.service';
import {
  buildProject,
  buildSkill,
  createMock,
} from '../../testing/test-doubles.testing';
import type { AnalysisInputBuilder } from '../analysis/analysis-input.builder';
import type { AnalysisRecoveryService } from '../analysis/analysis-recovery.service';
import type { AnalysisTimeouts } from '../analysis/analysis-timeouts';
import type { ProfileEmbedder } from '../analysis/profile-embedder';
import { RequestProjectAnalysisUseCase } from './request-project-analysis.use-case';

const validOutput = {
  resumen: 'Se necesita un equipo web.',
  perfiles: [
    {
      nombre: 'Frontend',
      descripcion: 'Interfaz',
      justificacion: 'El entregable es una aplicación web.',
      cantidad: 1,
      prioridad: 'ALTA',
      horasSemanaSugeridas: 8,
      habilidades: [
        {
          nombre: 'React',
          tipo: 'CONOCIMIENTO',
          nivelMinimo: 'INTERMEDIO',
          importancia: 'ALTA',
        },
        {
          nombre: 'Comunicación',
          tipo: 'HABILIDAD_BLANDA',
          nivelMinimo: 'BASICO',
          importancia: 'MEDIA',
        },
      ],
    },
  ],
};

const analysisOf = (status: 'PENDIENTE' | 'COMPLETADO' = 'PENDIENTE') =>
  new ProjectAnalysisEntity({
    id: 'a1',
    projectId: 'project-1',
    requestedById: 'leader-1',
    status,
    provider: 'fake',
    model: 'fake-1',
    promptVersion: 'v1',
    input: {},
    inputTokens: null,
    outputTokens: null,
    rawOutput: null,
    summary: null,
    errorMessage: null,
    durationMs: null,
    createdAt: new Date(),
    completedAt: null,
  });

const logger = {
  forContext: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    error: jest.fn(),
  }),
} as unknown as AppLoggerService;

describe('RequestProjectAnalysisUseCase', () => {
  const projectRepository = createMock<ProjectRepository>();
  const analysisRepository = createMock<ProjectAnalysisRepository>();
  const analyzer = createMock<ProjectAnalyzer>();
  const profileEmbedder = createMock<ProfileEmbedder>();
  const inputBuilder = createMock<AnalysisInputBuilder>();
  const recovery = createMock<AnalysisRecoveryService>();
  const timeouts: AnalysisTimeouts = {
    totalMs: 55_000,
    embeddingMs: 10_000,
    staleAfterMs: 115_000,
  };

  const useCaseWith = (budget: AnalysisTimeouts) =>
    new RequestProjectAnalysisUseCase(
      projectRepository,
      analysisRepository,
      analyzer,
      budget,
      profileEmbedder,
      inputBuilder,
      recovery,
      logger,
    );
  const useCase = useCaseWith(timeouts);

  const completedProfiles = [] as RequiredProfileEntity[];

  beforeEach(() => {
    jest.resetAllMocks();
    projectRepository.findById.mockResolvedValue(buildProject());
    analysisRepository.claim.mockResolvedValue({
      status: 'CLAIMED',
      analysis: analysisOf(),
    });
    analysisRepository.fail.mockResolvedValue(true);
    analysisRepository.complete.mockResolvedValue({
      analysis: analysisOf('COMPLETADO'),
      profiles: completedProfiles,
    });
    inputBuilder.build.mockResolvedValue({
      input: {
        project: {
          title: 'Conecta U',
          summary: 'Resumen',
          objectives: 'Objetivos',
          type: { name: 'Curso', fields: [] },
          category: 'Desarrollo',
          program: null,
          deliverables: [],
          knownSkills: [],
        },
        catalog: [],
      },
      catalog: [buildSkill({ id: 's1', name: 'React' })],
      fingerprint: 'huella-original',
    });
    analyzer.analyze.mockResolvedValue({
      output: validOutput,
      usage: { inputTokens: 100, outputTokens: 50 },
    });
    profileEmbedder.embed.mockImplementation((profiles) =>
      Promise.resolve(profiles.map(() => ({ vector: [1, 0], model: 'm' }))),
    );
    analyzer.isAvailable.mockReturnValue(true);
    Object.assign(analyzer, {
      provider: 'fake',
      model: 'fake-1',
      promptVersion: 'v1',
    });
  });

  it('analyzes the project and saves the analysis with its profiles', async () => {
    await useCase.execute('leader-1', 'project-1');

    expect(projectRepository.update).toHaveBeenNthCalledWith(1, 'project-1', {
      status: 'EN_ANALISIS',
    });
    const completeCall = analysisRepository.complete.mock.calls[0];
    expect(completeCall[1].profiles).toHaveLength(1);
    expect(completeCall[1].profiles[0].embedding).toEqual({
      vector: [1, 0],
      model: 'm',
    });
    expect(completeCall[1]).toMatchObject({
      inputTokens: 100,
      outputTokens: 50,
    });
    // El paso a ANALIZADO lo hace `complete` dentro de su transacción, no el caso de uso.
    expect(projectRepository.update).toHaveBeenCalledTimes(1);
  });

  it('saves the model that actually answered when the analyzer reports one', async () => {
    analyzer.analyze.mockResolvedValue({
      output: validOutput,
      usage: { inputTokens: 100, outputTokens: 50 },
      model: 'gemini-3.5-flash',
    });

    await useCase.execute('leader-1', 'project-1');

    expect(analysisRepository.complete.mock.calls[0][1].model).toBe(
      'gemini-3.5-flash',
    );
  });

  it('links the profile skills to the catalog', async () => {
    await useCase.execute('leader-1', 'project-1');

    const [profile] = analysisRepository.complete.mock.calls[0][1].profiles;
    expect(profile.skills[0]).toMatchObject({
      skillId: 's1',
      rawName: 'React',
    });
    expect(profile.skills[1].skillId).toBeNull();
  });

  it('saves the analysis without embeddings when none could be computed', async () => {
    profileEmbedder.embed.mockImplementation((profiles) =>
      Promise.resolve(profiles.map(() => null)),
    );

    await useCase.execute('leader-1', 'project-1');

    const [profile] = analysisRepository.complete.mock.calls[0][1].profiles;
    expect(profile.embedding).toBeNull();
  });

  it('retries once when the output is invalid and sums the tokens', async () => {
    analyzer.analyze
      .mockResolvedValueOnce({
        output: { resumen: 'x' },
        usage: { inputTokens: 100, outputTokens: 10 },
      })
      .mockResolvedValueOnce({
        output: validOutput,
        usage: { inputTokens: 100, outputTokens: 50 },
      });

    await useCase.execute('leader-1', 'project-1');

    expect(analyzer.analyze).toHaveBeenCalledTimes(2);
    expect(analysisRepository.complete.mock.calls[0][1]).toMatchObject({
      inputTokens: 200,
      outputTokens: 60,
    });
  });

  it('fails with 503 after two invalid outputs and restores the status', async () => {
    analyzer.analyze.mockResolvedValue({
      output: { resumen: 'x' },
      usage: { inputTokens: null, outputTokens: null },
    });

    await expect(
      useCase.execute('leader-1', 'project-1'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    expect(analyzer.analyze).toHaveBeenCalledTimes(2);
    expect(analysisRepository.fail).toHaveBeenCalledWith(
      'a1',
      expect.any(String),
      expect.any(Number),
    );
    // Devolver el proyecto a su estado lo hace `fail` en su transacción, no el caso de uso.
    expect(projectRepository.update).toHaveBeenCalledTimes(1);
    expect(analysisRepository.complete).not.toHaveBeenCalled();
  });

  it('fails with the contract 503 message when the AI service is unavailable', async () => {
    analyzer.analyze.mockRejectedValue(new AnalyzerUnavailableError('timeout'));

    const error = await useCase
      .execute('leader-1', 'project-1')
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
      message:
        'El servicio de análisis no está disponible. Intenta de nuevo en unos minutos.',
    });
    expect(analyzer.analyze).toHaveBeenCalledTimes(1);
    expect(analysisRepository.fail).toHaveBeenCalled();
  });

  it('throws NotFoundException when the project does not exist', async () => {
    projectRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('leader-1', 'project-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException when the project belongs to another leader', async () => {
    await expect(
      useCase.execute('intruder', 'project-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it('throws UnprocessableEntityException when the project lacks objectives', async () => {
    projectRepository.findById.mockResolvedValue(
      buildProject({ objectives: '  ' }),
    );

    await expect(
      useCase.execute('leader-1', 'project-1'),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(analysisRepository.claim).not.toHaveBeenCalled();
  });

  it('throws ConflictException when an analysis is already in progress', async () => {
    analysisRepository.claim.mockResolvedValue({ status: 'IN_PROGRESS' });

    await expect(
      useCase.execute('leader-1', 'project-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it('answers 503 without claiming a turn when the AI quota is exhausted', async () => {
    analyzer.isAvailable.mockReturnValue(false);

    const error: unknown = await useCase
      .execute('leader-1', 'project-1')
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect((error as ServiceUnavailableException).message).toMatch(
      /límite de uso por hoy/,
    );
    expect(analysisRepository.claim).not.toHaveBeenCalled();
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it('throws ConflictException when the daily limit is reached', async () => {
    analysisRepository.claim.mockResolvedValue({ status: 'DAILY_LIMIT' });

    await expect(useCase.execute('leader-1', 'project-1')).rejects.toThrow(
      /máximo de 5 análisis/,
    );
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it('asks the repository to claim the turn with the contract limits', async () => {
    await useCase.execute('leader-1', 'project-1');

    const [data, limits] = analysisRepository.claim.mock.calls[0];
    expect(data).toMatchObject({
      projectId: 'project-1',
      requestedById: 'leader-1',
      // La huella del texto original (no del redactado): así GET …/analysis la compara bien.
      input: { fingerprint: 'huella-original' },
    });
    expect(limits.maxPerDay).toBe(5);
    expect(Date.now() - limits.dailySince.getTime()).toBeGreaterThanOrEqual(
      24 * 60 * 60 * 1000,
    );
  });

  it('recovers an interrupted analysis of the project before claiming the turn', async () => {
    await useCase.execute('leader-1', 'project-1');

    expect(recovery.recover).toHaveBeenCalledWith('project-1');
    expect(recovery.recover.mock.invocationCallOrder[0]).toBeLessThan(
      analysisRepository.claim.mock.invocationCallOrder[0],
    );
  });

  it('stores a safe message instead of the raw provider error', async () => {
    analyzer.analyze.mockRejectedValue(
      new AnalyzerUnavailableError(
        'Gemini respondió con error 429: {"quota":"proyecto-secreto"}',
      ),
    );

    await expect(
      useCase.execute('leader-1', 'project-1'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);

    const [, message] = analysisRepository.fail.mock.calls[0];
    expect(message).toBe(
      'El servicio de análisis no está disponible. Intenta de nuevo en unos minutos.',
    );
    expect(message).not.toContain('secreto');
  });

  it('hides unexpected errors behind a generic message', async () => {
    analysisRepository.complete.mockRejectedValue(
      new Error('duplicate key value violates…'),
    );

    await expect(useCase.execute('leader-1', 'project-1')).rejects.toThrow();

    expect(analysisRepository.fail.mock.calls[0][1]).toBe(
      'Ocurrió un error inesperado durante el análisis.',
    );
  });

  describe('total time budget', () => {
    let clock: number;

    beforeEach(() => {
      clock = 1_000_000;
      jest.spyOn(Date, 'now').mockImplementation(() => clock);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('gives the analyzer only the time left in the budget', async () => {
      await useCase.execute('leader-1', 'project-1');

      expect(analyzer.analyze).toHaveBeenCalledWith(expect.anything(), {
        timeoutMs: 55_000,
      });
    });

    it('caps the embeddings with their own short timeout', async () => {
      await useCase.execute('leader-1', 'project-1');

      expect(profileEmbedder.embed).toHaveBeenCalledWith(expect.any(Array), {
        timeoutMs: 10_000,
      });
    });

    it('gives the embeddings what is left when that is less than their timeout', async () => {
      analyzer.analyze.mockImplementation(() => {
        clock += 50_000;
        return Promise.resolve({
          output: validOutput,
          usage: { inputTokens: 1, outputTokens: 1 },
        });
      });

      await useCase.execute('leader-1', 'project-1');

      expect(profileEmbedder.embed).toHaveBeenCalledWith(expect.any(Array), {
        timeoutMs: 5_000,
      });
    });

    it('saves the profiles without embeddings when the budget ran out', async () => {
      analyzer.analyze.mockImplementation(() => {
        clock += 55_000;
        return Promise.resolve({
          output: validOutput,
          usage: { inputTokens: 1, outputTokens: 1 },
        });
      });

      await useCase.execute('leader-1', 'project-1');

      expect(profileEmbedder.embed).not.toHaveBeenCalled();
      const [, completed] = analysisRepository.complete.mock.calls[0];
      expect(completed.profiles[0].embedding).toBeNull();
    });

    it('does not retry an invalid output when less than 10 s remain', async () => {
      analyzer.analyze.mockImplementation(() => {
        clock += 50_000;
        return Promise.resolve({
          output: { perfiles: 'no es una lista' },
          usage: { inputTokens: 1, outputTokens: 1 },
        });
      });

      await expect(
        useCase.execute('leader-1', 'project-1'),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(analyzer.analyze).toHaveBeenCalledTimes(1);
    });

    it('splits the budget between the first call and the retry', async () => {
      analyzer.analyze
        .mockImplementationOnce(() => {
          clock += 20_000;
          return Promise.resolve({
            output: { perfiles: 'no es una lista' },
            usage: { inputTokens: 1, outputTokens: 1 },
          });
        })
        .mockResolvedValueOnce({
          output: validOutput,
          usage: { inputTokens: 1, outputTokens: 1 },
        });

      await useCase.execute('leader-1', 'project-1');

      expect(analyzer.analyze).toHaveBeenNthCalledWith(2, expect.anything(), {
        timeoutMs: 35_000,
      });
    });
  });

  it('answers 503 without touching the project when the analysis was closed while the AI answered', async () => {
    analysisRepository.complete.mockResolvedValue(null);
    analysisRepository.fail.mockResolvedValue(false);

    await expect(useCase.execute('leader-1', 'project-1')).rejects.toThrow(
      'El análisis tardó demasiado y se canceló. Intenta de nuevo.',
    );
    // Solo el paso a EN_ANALISIS: la recuperación ya dejó el proyecto en su estado.
    expect(projectRepository.update).toHaveBeenCalledTimes(1);
  });

  it('records the failure and restores the status when marking EN_ANALISIS fails', async () => {
    projectRepository.update.mockRejectedValueOnce(new Error('db caída'));

    await expect(useCase.execute('leader-1', 'project-1')).rejects.toThrow();

    expect(analyzer.analyze).not.toHaveBeenCalled();
    expect(analysisRepository.fail).toHaveBeenCalled();
  });
});
