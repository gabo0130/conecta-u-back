import type { CollaboratorEmbeddingRepository } from '../../domain/repositories/collaborator-embedding.repository.interface';
import type { EmbeddingProvider } from '../../domain/repositories/embedding-provider.interface';
import type { RequiredProfileRepository } from '../../domain/repositories/required-profile.repository.interface';
import type { AppLoggerService } from '../../shared/logging/logger.service';
import {
  buildCollaborator,
  buildRequiredProfile,
  buildCollaboratorSkill,
  buildExperience,
  createMock,
} from '../../testing/test-doubles.testing';
import { collaboratorEmbeddingText } from './collaborator-embedding-text';
import { CollaboratorEmbeddingService } from './collaborator-embedding.service';
import { ProfileEmbedder } from './profile-embedder';

const logger = {
  forContext: () => ({
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    error: jest.fn(),
  }),
} as unknown as AppLoggerService;

const withContent = (id: string) =>
  buildCollaborator({
    id,
    summary: `Resumen de ${id}`,
    skills: [buildCollaboratorSkill({ collaboratorId: id })],
  });

describe('collaboratorEmbeddingText', () => {
  it('joins summary, skills and experiences', () => {
    const text = collaboratorEmbeddingText(
      buildCollaborator({
        summary: 'Desarrolladora web',
        skills: [buildCollaboratorSkill()],
        experiences: [buildExperience({ description: 'Portal académico' })],
      }),
    );

    expect(text).toContain('Desarrolladora web');
    expect(text).toContain('React, nivel Avanzado, 24 meses');
    expect(text).toContain('Desarrolladora en UFPS');
    expect(text).toContain('tecnologías: React');
    expect(text).toContain('Portal académico');
  });

  it('never includes contact data', () => {
    const text = collaboratorEmbeddingText(
      buildCollaborator({
        email: 'secreto@example.com',
        summary: 'Resumen',
        profileUrl: 'https://linkedin.com/in/secreto',
      }),
    );

    expect(text).not.toContain('secreto');
  });

  it('strips emails, links and phone numbers from the free text', () => {
    const text = collaboratorEmbeddingText(
      buildCollaborator({
        summary:
          'Desarrolladora web. Escríbeme a ana.perez@correo.com o al +57 300 123 4567, mi perfil: https://linkedin.com/in/ana',
        experiences: [
          buildExperience({
            role: 'Monitora (ana@ufps.edu.co)',
            organization: 'Laboratorio, ext. 5776655',
            description: 'Llamar al 315-555-0100 o ver www.ana.dev',
          }),
        ],
      }),
    );

    expect(text).toContain('Desarrolladora web');
    expect(text).toContain('Monitora');
    expect(text).not.toMatch(/@|linkedin|www\.|300|315|4567|5776655/);
  });

  it('is empty when there is nothing to represent', () => {
    expect(collaboratorEmbeddingText(buildCollaborator())).toBe('');
  });
});

describe('CollaboratorEmbeddingService.rebuildStale', () => {
  const repository = createMock<CollaboratorEmbeddingRepository>();
  const provider = Object.assign(createMock<EmbeddingProvider>(), {
    model: 'gemini/test@768',
  });
  const service = new CollaboratorEmbeddingService(
    repository,
    provider,
    logger,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    repository.countStale.mockResolvedValue(0);
    provider.embed.mockImplementation((texts) =>
      Promise.resolve(texts.map(() => [1, 0])),
    );
  });

  it('embeds and saves each pending person', async () => {
    repository.findStale.mockResolvedValue([
      withContent('a'),
      withContent('b'),
    ]);

    const result = await service.rebuildStale(200);

    expect(result).toMatchObject({ processed: 2, skipped: 0, failed: 0 });
    expect(repository.save).toHaveBeenCalledWith(
      'a',
      [1, 0],
      'gemini/test@768',
    );
    expect(repository.save).toHaveBeenCalledWith(
      'b',
      [1, 0],
      'gemini/test@768',
    );
    // "Desactualizado" incluye los vectores de otro modelo: se piden para el actual.
    expect(repository.findStale).toHaveBeenCalledWith('gemini/test@768', 200);
    expect(repository.countStale).toHaveBeenCalledWith('gemini/test@768');
  });

  it('sends the texts in batches of 50', async () => {
    repository.findStale.mockResolvedValue(
      Array.from({ length: 120 }, (_, i) => withContent(`c${i}`)),
    );

    const result = await service.rebuildStale(200);

    expect(provider.embed).toHaveBeenCalledTimes(3);
    expect(provider.embed.mock.calls.map(([texts]) => texts.length)).toEqual([
      50, 50, 20,
    ]);
    expect(result.processed).toBe(120);
  });

  it('records people without content as up to date, without a vector', async () => {
    repository.findStale.mockResolvedValue([
      withContent('a'),
      buildCollaborator({ id: 'empty' }),
    ]);

    const result = await service.rebuildStale(200);

    expect(repository.save).toHaveBeenCalledWith(
      'empty',
      null,
      'gemini/test@768',
    );
    expect(provider.embed.mock.calls[0][0]).toHaveLength(1);
    expect(result).toMatchObject({ processed: 1, skipped: 1 });
  });

  it('stops at the first failed batch instead of burning time on the rest', async () => {
    repository.findStale.mockResolvedValue(
      Array.from({ length: 120 }, (_, i) => withContent(`c${i}`)),
    );
    provider.embed.mockRejectedValue(new Error('cuota agotada'));
    repository.countStale.mockResolvedValue(120);

    const result = await service.rebuildStale(200);

    expect(provider.embed).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ processed: 0, failed: 50, remaining: 120 });
  });

  it('does not start new batches after the time budget', async () => {
    repository.findStale.mockResolvedValue(
      Array.from({ length: 120 }, (_, i) => withContent(`c${i}`)),
    );
    let now = 0;
    jest.spyOn(Date, 'now').mockImplementation(() => now);
    provider.embed.mockImplementation((texts) => {
      now += 15_000;
      return Promise.resolve(texts.map(() => [1, 0]));
    });

    const result = await service.rebuildStale(200, { maxDurationMs: 20_000 });

    expect(provider.embed).toHaveBeenCalledTimes(2);
    expect(result.processed).toBe(100);
    // Cada lote recibe solo lo que queda del presupuesto.
    expect(provider.embed.mock.calls.map(([, options]) => options)).toEqual([
      { timeoutMs: 20_000 },
      { timeoutMs: 5_000 },
    ]);
    jest.restoreAllMocks();
  });

  it('does not cap the batches when there is no time budget', async () => {
    repository.findStale.mockResolvedValue([withContent('a')]);

    await service.rebuildStale(200);

    expect(provider.embed).toHaveBeenCalledWith(expect.any(Array), {});
  });

  it('shares one run between simultaneous calls', async () => {
    repository.findStale.mockResolvedValue([withContent('a')]);

    const [first, second] = await Promise.all([
      service.rebuildStale(200),
      service.rebuildStale(200),
    ]);

    expect(repository.findStale).toHaveBeenCalledTimes(1);
    expect(provider.embed).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('never waits longer than its own budget when joining a run that is already going', async () => {
    jest.useFakeTimers();
    repository.findStale.mockResolvedValue([withContent('a')]);
    repository.countStale.mockResolvedValue(7);
    let finishEmbed: (vectors: number[][]) => void = () => undefined;
    provider.embed.mockReturnValue(
      new Promise((resolve) => {
        finishEmbed = resolve;
      }),
    );

    const adminRun = service.rebuildStale(500);
    const leaderRun = service.rebuildStale(200, { maxDurationMs: 20_000 });
    await jest.advanceTimersByTimeAsync(20_000);

    await expect(leaderRun).resolves.toEqual({
      processed: 0,
      skipped: 0,
      failed: 0,
      remaining: 7,
    });
    finishEmbed([[1, 0]]);
    await expect(adminRun).resolves.toMatchObject({ processed: 1 });
    expect(repository.findStale).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('does nothing when nobody is pending', async () => {
    repository.findStale.mockResolvedValue([]);

    const result = await service.rebuildStale(200);

    expect(result).toEqual({
      processed: 0,
      skipped: 0,
      failed: 0,
      remaining: 0,
    });
    expect(provider.embed).not.toHaveBeenCalled();
  });
});

describe('ProfileEmbedder', () => {
  const provider = Object.assign(createMock<EmbeddingProvider>(), {
    model: 'gemini/test@768',
  });
  const profiles = createMock<RequiredProfileRepository>();
  const embedder = new ProfileEmbedder(provider, profiles, logger);
  const profile = {
    name: 'Frontend',
    description: 'Interfaz',
    skills: [{ rawName: 'React' }],
  };

  beforeEach(() => jest.resetAllMocks());

  it('returns one vector per profile, tagged with the model that produced it', async () => {
    provider.embed.mockResolvedValue([[1, 0]]);

    await expect(
      embedder.embed([profile], { timeoutMs: 5_000 }),
    ).resolves.toEqual([{ vector: [1, 0], model: 'gemini/test@768' }]);
    expect(provider.embed).toHaveBeenCalledWith(['Frontend. Interfaz. React'], {
      timeoutMs: 5_000,
    });
  });

  it('returns nulls instead of failing when the provider is down', async () => {
    provider.embed.mockRejectedValue(new Error('caído'));

    await expect(embedder.embed([profile, profile])).resolves.toEqual([
      null,
      null,
    ]);
  });

  it('does not call the provider without profiles', async () => {
    await expect(embedder.embed([])).resolves.toEqual([]);
    expect(provider.embed).not.toHaveBeenCalled();
  });

  it('re-embeds stored profiles and saves only the ones that worked', async () => {
    provider.embed.mockResolvedValue([
      [1, 0],
      [0, 1],
    ]);

    const refreshed = await embedder.refreshStored([
      buildRequiredProfile({ id: 'rp1' }),
      buildRequiredProfile({ id: 'rp2' }),
    ]);

    expect(refreshed).toEqual(
      new Map([
        ['rp1', [1, 0]],
        ['rp2', [0, 1]],
      ]),
    );
    expect(profiles.saveEmbedding).toHaveBeenCalledWith('rp1', {
      vector: [1, 0],
      model: 'gemini/test@768',
    });
  });

  it('leaves stored profiles pending when the provider fails', async () => {
    provider.embed.mockRejectedValue(new Error('caído'));

    const refreshed = await embedder.refreshStored([
      buildRequiredProfile({ id: 'rp1' }),
    ]);

    expect(refreshed.size).toBe(0);
    expect(profiles.saveEmbedding).not.toHaveBeenCalled();
  });

  it('rebuilds the profiles whose vector is missing or from another model', async () => {
    profiles.findWithStaleEmbedding.mockResolvedValue([
      buildRequiredProfile({ id: 'rp1' }),
      buildRequiredProfile({ id: 'rp2' }),
    ]);
    provider.embed.mockResolvedValue([
      [1, 0],
      [0, 1],
    ]);
    profiles.countWithStaleEmbedding.mockResolvedValue(0);

    await expect(embedder.rebuildStale(100)).resolves.toEqual({
      processed: 2,
      failed: 0,
      remaining: 0,
    });
    expect(profiles.findWithStaleEmbedding).toHaveBeenCalledWith(
      'gemini/test@768',
      100,
    );
  });

  it('rebuilds in batches of 50 and stops when a whole batch fails', async () => {
    const stale = Array.from({ length: 120 }, (_value, index) =>
      buildRequiredProfile({ id: `rp${index}` }),
    );
    profiles.findWithStaleEmbedding.mockResolvedValue(stale);
    provider.embed
      .mockImplementationOnce((texts: string[]) =>
        Promise.resolve(texts.map(() => [1, 0])),
      )
      .mockRejectedValueOnce(new Error('caído'));
    profiles.countWithStaleEmbedding.mockResolvedValue(70);

    await expect(embedder.rebuildStale(500)).resolves.toEqual({
      processed: 50,
      failed: 70,
      remaining: 70,
    });
    expect(provider.embed).toHaveBeenCalledTimes(2);
    expect(provider.embed.mock.calls[0][0]).toHaveLength(50);
  });

  it('forgets the model of every profile vector when forced', async () => {
    await embedder.markAllStale();

    expect(profiles.markAllEmbeddingsStale).toHaveBeenCalled();
  });
});
