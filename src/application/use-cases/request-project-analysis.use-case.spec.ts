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
  InvalidAnalysisOutputError,
  TruncatedAnalysisOutputError,
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
    attempts: null,
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

const leader = { userId: 'leader-1', role: 'LIDER' as const };
const intruder = { userId: 'intruder', role: 'LIDER' as const };
const admin = { userId: 'admin-1', role: 'ADMIN' as const };
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
  const UNAVAILABLE =
    'El servicio de análisis no está disponible. Intenta de nuevo en unos minutos.';

  /** Pide el análisis (responde PENDIENTE) y espera a que termine en segundo plano. */
  const analyzeAndWait = async (target = useCase) => {
    const started = await target.execute(leader, 'project-1');
    await target.whenIdle();
    return started;
  };
  const failureMessage = () =>
    analysisRepository.fail.mock.calls[0]?.[1].errorMessage;

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
          durationMonths: null,
          deliverables: [],
          knownSkills: [],
        },
        catalog: [],
      },
      catalog: [buildSkill({ id: 's1', name: 'React' })],
      fingerprint: 'huella-original',
      catalogFingerprint: 'catalogo-original',
    });
    analysisRepository.findLatestCompleted.mockResolvedValue(null);
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

  it('answers right away with the PENDING analysis, before the AI finishes (202)', async () => {
    let finishAi!: () => void;
    analyzer.analyze.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishAi = () =>
            resolve({
              output: validOutput,
              usage: { inputTokens: 1, outputTokens: 1 },
            });
        }),
    );

    const started = await useCase.execute(leader, 'project-1');

    expect(started).toMatchObject({ id: 'a1', status: 'PENDIENTE' });
    expect(analysisRepository.complete).not.toHaveBeenCalled();
    finishAi();
    await useCase.whenIdle();
    expect(analysisRepository.complete).toHaveBeenCalledTimes(1);
  });

  it('analyzes the project and saves the analysis with its profiles', async () => {
    await analyzeAndWait();

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

    await analyzeAndWait();

    expect(analysisRepository.complete.mock.calls[0][1].model).toBe(
      'gemini-3.5-flash',
    );
  });

  it('links the profile skills to the catalog', async () => {
    await analyzeAndWait();

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

    await analyzeAndWait();

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

    await analyzeAndWait();

    expect(analyzer.analyze).toHaveBeenCalledTimes(2);
    expect(analysisRepository.complete.mock.calls[0][1]).toMatchObject({
      inputTokens: 200,
      outputTokens: 60,
    });
  });

  it('records the failure after two invalid outputs and restores the status', async () => {
    analyzer.analyze.mockResolvedValue({
      output: { resumen: 'x' },
      usage: { inputTokens: null, outputTokens: null },
    });

    await analyzeAndWait();

    expect(analyzer.analyze).toHaveBeenCalledTimes(2);
    expect(analysisRepository.fail).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({
        errorMessage: expect.any(String),
        durationMs: expect.any(Number),
      }),
    );
    // Devolver el proyecto a su estado lo hace `fail` en su transacción, no el caso de uso.
    expect(projectRepository.update).toHaveBeenCalledTimes(1);
    expect(analysisRepository.complete).not.toHaveBeenCalled();
  });

  it('keeps the tokens of two invalid outputs when the analysis fails (RT12)', async () => {
    analyzer.analyze.mockResolvedValue({
      output: { resumen: 'x' },
      usage: { inputTokens: 900, outputTokens: 300 },
    });

    await analyzeAndWait();

    expect(analysisRepository.fail.mock.calls[0][1]).toMatchObject({
      inputTokens: 1800,
      outputTokens: 600,
      attempts: [
        { provider: 'fake', model: 'fake-1', outcome: 'answered' },
        { provider: 'fake', model: 'fake-1', outcome: 'answered' },
      ],
    });
  });

  it('records every call the analyzer reports, failed ones included, without counting them twice', async () => {
    analyzer.analyze.mockImplementation((_input, options) => {
      options.onAttempt?.({
        provider: 'claude',
        model: 'claude-haiku-5-5',
        outcome: 'rate_limited',
        durationMs: 200,
        inputTokens: null,
        outputTokens: null,
        httpStatus: 429,
      });
      options.onAttempt?.({
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        outcome: 'answered',
        durationMs: 9000,
        inputTokens: 2000,
        outputTokens: 800,
      });
      return Promise.resolve({
        output: validOutput,
        usage: { inputTokens: 2000, outputTokens: 800 },
        provider: 'gemini',
        model: 'gemini-3.8-flash',
      });
    });

    await analyzeAndWait();

    const saved = analysisRepository.complete.mock.calls[0][1];
    expect(saved).toMatchObject({
      provider: 'gemini',
      model: 'gemini-3.8-flash',
      inputTokens: 2000,
      outputTokens: 800,
    });
    expect(saved.attempts.map((attempt) => attempt.outcome)).toEqual([
      'rate_limited',
      'answered',
    ]);
  });

  it('retries once when the adapter itself finds the JSON unreadable', async () => {
    analyzer.analyze
      .mockRejectedValueOnce(
        new InvalidAnalysisOutputError('Claude no devolvió un JSON válido'),
      )
      .mockResolvedValueOnce({
        output: validOutput,
        usage: { inputTokens: 100, outputTokens: 50 },
      });

    await analyzeAndWait();

    expect(analyzer.analyze).toHaveBeenCalledTimes(2);
    expect(analysisRepository.complete).toHaveBeenCalled();
  });

  it('does not repeat an answer cut by length: it would be cut again (IA-03)', async () => {
    analyzer.analyze.mockRejectedValue(
      new TruncatedAnalysisOutputError(
        'Gemini cortó la respuesta por longitud',
      ),
    );

    await analyzeAndWait();

    expect(analyzer.analyze).toHaveBeenCalledTimes(1);
    expect(analysisRepository.fail).toHaveBeenCalled();
  });

  it('keeps what was spent even when the recovery already closed the analysis', async () => {
    analysisRepository.complete.mockResolvedValue(null);

    await analyzeAndWait();

    expect(analysisRepository.recordUsage).toHaveBeenCalledWith('a1', {
      inputTokens: 100,
      outputTokens: 50,
      attempts: [expect.objectContaining({ outcome: 'answered' })],
    });
  });

  it('records the contract message when the AI service is unavailable', async () => {
    analyzer.analyze.mockRejectedValue(new AnalyzerUnavailableError('timeout'));

    await expect(analyzeAndWait()).resolves.toMatchObject({
      status: 'PENDIENTE',
    });

    expect(failureMessage()).toBe(UNAVAILABLE);
    expect(analyzer.analyze).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundException when the project does not exist', async () => {
    projectRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(leader, 'project-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  describe('nothing changed since the last analysis (IA-11)', () => {
    const lastCompleted = (
      input: Record<string, unknown>,
      promptVersion = 'v1',
    ) =>
      new ProjectAnalysisEntity({
        ...analysisOf('COMPLETADO'),
        promptVersion,
        input,
      });
    const sameAsNow = {
      fingerprint: 'huella-original',
      catalogFingerprint: 'catalogo-original',
    };

    it('answers 409 without calling the AI nor using a turn of the day', async () => {
      analysisRepository.findLatestCompleted.mockResolvedValue(
        lastCompleted(sameAsNow),
      );

      const error: unknown = await useCase
        .execute(leader, 'project-1')
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).message).toMatch(
        /no cambió desde el último análisis/,
      );
      expect(analysisRepository.claim).not.toHaveBeenCalled();
      expect(analyzer.analyze).not.toHaveBeenCalled();
    });

    it('analyzes anyway with force', async () => {
      analysisRepository.findLatestCompleted.mockResolvedValue(
        lastCompleted(sameAsNow),
      );

      await useCase.execute(leader, 'project-1', { force: true });
      await useCase.whenIdle();

      expect(analyzer.analyze).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['the project', { ...sameAsNow, fingerprint: 'otra' }, 'v1'],
      ['the catalog', { ...sameAsNow, catalogFingerprint: 'otro' }, 'v1'],
      ['the prompt', sameAsNow, 'v0'],
      [
        'an older analysis without catalog fingerprint',
        { fingerprint: 'huella-original' },
        'v1',
      ],
    ])(
      'analyzes again when %s changed',
      async (_what, input, promptVersion) => {
        analysisRepository.findLatestCompleted.mockResolvedValue(
          lastCompleted(input, promptVersion),
        );

        await useCase.execute(leader, 'project-1');
        await useCase.whenIdle();

        expect(analyzer.analyze).toHaveBeenCalledTimes(1);
      },
    );

    it('stores both fingerprints with the new analysis', async () => {
      await useCase.execute(leader, 'project-1');

      expect(analysisRepository.claim.mock.calls[0][0].input).toMatchObject(
        sameAsNow,
      );
    });
  });

  it('lets the ADMIN analyze a project registered for a leader, recording who asked', async () => {
    const started = await useCase.execute(admin, 'project-1');
    await useCase.whenIdle();

    expect(started).toMatchObject({ status: 'PENDIENTE' });
    expect(analysisRepository.claim.mock.calls[0][0]).toMatchObject({
      requestedById: 'admin-1',
    });
  });

  it('throws ForbiddenException when the project belongs to another leader', async () => {
    await expect(useCase.execute(intruder, 'project-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it('throws UnprocessableEntityException when the project lacks objectives', async () => {
    projectRepository.findById.mockResolvedValue(
      buildProject({ objectives: '  ' }),
    );

    await expect(useCase.execute(leader, 'project-1')).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(analysisRepository.claim).not.toHaveBeenCalled();
  });

  it('throws ConflictException when an analysis is already in progress', async () => {
    analysisRepository.claim.mockResolvedValue({ status: 'IN_PROGRESS' });

    await expect(useCase.execute(leader, 'project-1')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it('answers 503 without claiming a turn when the AI quota is exhausted', async () => {
    analyzer.isAvailable.mockReturnValue(false);

    const error: unknown = await useCase
      .execute(leader, 'project-1')
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

    await expect(useCase.execute(leader, 'project-1')).rejects.toThrow(
      /máximo de 5 análisis/,
    );
    expect(analyzer.analyze).not.toHaveBeenCalled();
  });

  it('asks the repository to claim the turn with the contract limits', async () => {
    await useCase.execute(leader, 'project-1');

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
    await useCase.execute(leader, 'project-1');

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

    await analyzeAndWait();

    expect(failureMessage()).toBe(UNAVAILABLE);
    expect(failureMessage()).not.toContain('secreto');
  });

  it('hides unexpected errors behind a generic message', async () => {
    analysisRepository.complete.mockRejectedValue(
      new Error('duplicate key value violates…'),
    );

    await analyzeAndWait();

    expect(failureMessage()).toBe(
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
      await analyzeAndWait();

      expect(analyzer.analyze).toHaveBeenCalledWith(expect.anything(), {
        timeoutMs: 55_000,
        onAttempt: expect.any(Function),
      });
    });

    it('caps the embeddings with their own short timeout', async () => {
      await analyzeAndWait();

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

      await analyzeAndWait();

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

      await analyzeAndWait();

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

      await analyzeAndWait();

      expect(analyzer.analyze).toHaveBeenCalledTimes(1);
      expect(analysisRepository.fail).toHaveBeenCalled();
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

      await analyzeAndWait();

      expect(analyzer.analyze).toHaveBeenNthCalledWith(2, expect.anything(), {
        timeoutMs: 35_000,
        onAttempt: expect.any(Function),
      });
    });
  });

  it('does not touch the project when the analysis was closed while the AI answered', async () => {
    analysisRepository.complete.mockResolvedValue(null);
    analysisRepository.fail.mockResolvedValue(false);

    await analyzeAndWait();

    expect(analysisRepository.fail).not.toHaveBeenCalled();
    // Solo el paso a EN_ANALISIS: la recuperación ya dejó el proyecto en su estado.
    expect(projectRepository.update).toHaveBeenCalledTimes(1);
  });

  it('records the failure and restores the status when marking EN_ANALISIS fails', async () => {
    projectRepository.update.mockRejectedValueOnce(new Error('db caída'));

    await expect(useCase.execute(leader, 'project-1')).rejects.toThrow();

    expect(analyzer.analyze).not.toHaveBeenCalled();
    expect(analysisRepository.fail).toHaveBeenCalled();
  });
});
