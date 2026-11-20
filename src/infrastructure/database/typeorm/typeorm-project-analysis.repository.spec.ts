import type { DataSource, EntityManager, Repository } from 'typeorm';
import type { CreateProjectAnalysisDto } from '../../../domain/repositories/project-analysis.repository.interface';
import { ProjectAnalysisOrmEntity } from './project-analysis.orm-entity';
import { TypeOrmProjectAnalysisRepository } from './typeorm-project-analysis.repository';

const dto: CreateProjectAnalysisDto = {
  projectId: 'p1',
  requestedById: 'u1',
  provider: 'gemini',
  model: 'gemini-3.8-flash',
  promptVersion: 'v1',
  input: {},
};
const limits = {
  dailySince: new Date('2026-10-15T10:00:00Z'),
  maxPerDay: 5,
};

function setup(counts: { pending: number; today: number }) {
  const order: string[] = [];
  const manager = {
    query: jest.fn(() => {
      order.push('lock');
      return Promise.resolve([]);
    }),
    update: jest.fn(() => {
      order.push('expire-stale');
      return Promise.resolve({ affected: 0 });
    }),
    count: jest.fn(
      (_entity: unknown, options: { where: { status?: unknown } }) => {
        order.push('count');
        return Promise.resolve(
          options.where.status === 'PENDIENTE' ? counts.pending : counts.today,
        );
      },
    ),
    create: jest.fn((_entity: unknown, data: object) => ({ ...data })),
    save: jest.fn((entity: object) => {
      order.push('insert');
      return Promise.resolve({
        id: 'a1',
        createdAt: new Date(),
        completedAt: null,
        ...entity,
      });
    }),
  };
  const dataSource = {
    transaction: (work: (m: EntityManager) => Promise<unknown>) =>
      work(manager as unknown as EntityManager),
  } as unknown as DataSource;
  const repository = {} as Repository<ProjectAnalysisOrmEntity>;
  return {
    analyses: new TypeOrmProjectAnalysisRepository(repository, dataSource),
    manager,
    order,
  };
}

describe('TypeOrmProjectAnalysisRepository.claim', () => {
  it('takes the project lock before checking limits and inserting', async () => {
    const { analyses, order } = setup({ pending: 0, today: 0 });

    const result = await analyses.claim(dto, limits);

    expect(result.status).toBe('CLAIMED');
    expect(order).toEqual(['lock', 'count', 'count', 'insert']);
  });

  it('leaves interrupted analyses to recoverInterrupted instead of expiring them here', async () => {
    const { analyses, manager } = setup({ pending: 0, today: 0 });

    await analyses.claim(dto, limits);

    expect(manager.update).not.toHaveBeenCalled();
  });

  it('reports IN_PROGRESS without inserting when one is still running', async () => {
    const { analyses, manager } = setup({ pending: 1, today: 0 });

    await expect(analyses.claim(dto, limits)).resolves.toEqual({
      status: 'IN_PROGRESS',
    });
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('counts every attempt of the day toward the cap, failed ones included', async () => {
    const { analyses, manager } = setup({ pending: 0, today: 0 });

    await analyses.claim(dto, limits);

    const [, dailyCount] = manager.count.mock.calls as unknown as [
      unknown,
      [unknown, { where: object }],
    ];
    expect(dailyCount[1].where).toEqual({
      projectId: 'p1',
      createdAt: expect.anything(),
    });
  });

  it('reports DAILY_LIMIT without inserting when the cap is reached', async () => {
    const { analyses, manager } = setup({ pending: 0, today: 5 });

    await expect(analyses.claim(dto, limits)).resolves.toEqual({
      status: 'DAILY_LIMIT',
    });
    expect(manager.save).not.toHaveBeenCalled();
  });
});

describe('TypeOrmProjectAnalysisRepository.complete', () => {
  const completeDto = {
    rawOutput: {},
    summary: 'x',
    inputTokens: 1,
    outputTokens: 1,
    attempts: [],
    durationMs: 10,
    profiles: [],
  };

  const managerWith = (status: string | null) => ({
    findOne: jest.fn(() =>
      Promise.resolve(
        status === null
          ? null
          : { id: 'a1', projectId: 'p1', status, createdAt: new Date() },
      ),
    ),
    save: jest.fn((entity: object) => Promise.resolve(entity)),
    update: jest.fn(),
    create: jest.fn(),
    find: jest.fn(() => Promise.resolve([])),
  });

  const analysesWith = (manager: object) =>
    new TypeOrmProjectAnalysisRepository(
      {} as Repository<ProjectAnalysisOrmEntity>,
      {
        transaction: (work: (m: EntityManager) => Promise<unknown>) =>
          work(manager as unknown as EntityManager),
      } as unknown as DataSource,
    );

  it('locks the row and completes an analysis that is still PENDIENTE', async () => {
    const manager = managerWith('PENDIENTE');

    const result = await analysesWith(manager).complete('a1', completeDto);

    expect(manager.findOne).toHaveBeenCalledWith(ProjectAnalysisOrmEntity, {
      where: { id: 'a1' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(result?.analysis.status).toBe('COMPLETADO');
    expect(manager.update).toHaveBeenCalled();
  });

  it('records the provider and model that actually answered, and every attempt', async () => {
    const manager = managerWith('PENDIENTE');
    const attempts = [
      {
        provider: 'claude',
        model: 'claude-haiku-5-5',
        outcome: 'rate_limited' as const,
        durationMs: 300,
        inputTokens: null,
        outputTokens: null,
        httpStatus: 429,
      },
    ];

    await analysesWith(manager).complete('a1', {
      ...completeDto,
      provider: 'gemini',
      model: 'gemini-3.8-flash',
      attempts,
    });

    expect(manager.save).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'gemini',
        model: 'gemini-3.8-flash',
        attempts,
      }),
    );
  });

  it('keeps the provider and model reserved with the turn when the analyzer reports none', async () => {
    const manager = managerWith('PENDIENTE');

    await analysesWith(manager).complete('a1', completeDto);

    const saved = manager.save.mock.calls[0][0];
    expect(saved).not.toHaveProperty('provider');
    expect(saved).not.toHaveProperty('model');
  });

  it.each(['ERROR', 'COMPLETADO', null])(
    'writes nothing when the analysis is %p (closed while the AI answered)',
    async (status) => {
      const manager = managerWith(status);

      await expect(
        analysesWith(manager).complete('a1', completeDto),
      ).resolves.toBeNull();
      expect(manager.save).not.toHaveBeenCalled();
      expect(manager.update).not.toHaveBeenCalled();
    },
  );
});

describe('TypeOrmProjectAnalysisRepository.fail', () => {
  const setup = (raw: { projectId: string }[]) => {
    const queries: { set?: unknown; where?: string; params?: unknown }[] = [];
    const builder = () => {
      const query: Record<string, jest.Mock> & {
        recorded: (typeof queries)[0];
      } = {
        recorded: {},
      } as never;
      queries.push(query.recorded);
      const chain = (key: string) =>
        jest.fn((...args: unknown[]) => {
          if (key === 'set') query.recorded.set = args[0];
          if (key === 'where') {
            query.recorded.where = args[0] as string;
            query.recorded.params = args[1];
          }
          return query;
        });
      for (const key of ['update', 'set', 'where', 'andWhere', 'returning'])
        query[key] = chain(key);
      query.execute = jest.fn(() =>
        Promise.resolve({ raw, affected: raw.length }),
      );
      return query;
    };
    const manager = { createQueryBuilder: jest.fn(builder) };
    const analyses = new TypeOrmProjectAnalysisRepository(
      {} as Repository<ProjectAnalysisOrmEntity>,
      {
        transaction: (work: (m: EntityManager) => Promise<unknown>) =>
          work(manager as unknown as EntityManager),
      } as unknown as DataSource,
    );
    return { analyses, queries };
  };

  const failure = {
    errorMessage: 'caída',
    durationMs: 100,
    inputTokens: 1800,
    outputTokens: 600,
    attempts: [],
  };

  it('marks ERROR only a PENDIENTE analysis and restores its project in the same transaction', async () => {
    const { analyses, queries } = setup([{ projectId: 'p1' }]);

    await expect(analyses.fail('a1', failure)).resolves.toBe(true);

    expect(queries[0]).toMatchObject({
      set: expect.objectContaining({
        status: 'ERROR',
        errorMessage: 'caída',
        // Lo que se alcanzó a consumir antes de fallar también se guarda (RT12).
        inputTokens: 1800,
        outputTokens: 600,
        attempts: [],
      }),
      params: { id: 'a1', pending: 'PENDIENTE' },
    });
    // Mismas dos sentencias que la recuperación: ANALIZADO y BORRADOR.
    expect(queries.slice(1).map((query) => query.set)).toEqual([
      { status: 'ANALIZADO' },
      { status: 'BORRADOR' },
    ]);
  });

  it('writes nothing else when the analysis had already finished', async () => {
    const { analyses, queries } = setup([]);

    await expect(analyses.fail('a1', failure)).resolves.toBe(false);
    expect(queries).toHaveLength(1);
  });
});

describe('TypeOrmProjectAnalysisRepository.recordUsage', () => {
  it('stores the usage of a closed analysis only if it had none, without touching its status', async () => {
    const recorded: { set?: unknown; where?: string; params?: unknown } = {};
    const query = {
      update: jest.fn(() => query),
      set: jest.fn((values: unknown) => {
        recorded.set = values;
        return query;
      }),
      where: jest.fn((where: string, params: unknown) => {
        recorded.where = where;
        recorded.params = params;
        return query;
      }),
      execute: jest.fn(() => Promise.resolve({ affected: 1 })),
    };
    const analyses = new TypeOrmProjectAnalysisRepository(
      {} as Repository<ProjectAnalysisOrmEntity>,
      { createQueryBuilder: () => query } as unknown as DataSource,
    );

    await analyses.recordUsage('a1', {
      inputTokens: 10,
      outputTokens: 5,
      attempts: [],
    });

    expect(recorded.set).toEqual({
      inputTokens: 10,
      outputTokens: 5,
      attempts: [],
    });
    expect(recorded.set).not.toHaveProperty('status');
    expect(recorded.where).toContain('attempts IS NULL');
    expect(recorded.params).toEqual({ id: 'a1' });
  });
});
