import type { Repository } from 'typeorm';
import type { CollaboratorOrmEntity } from './collaborator.orm-entity';
import type { RecommendationOrmEntity } from './recommendation.orm-entity';
import { TypeOrmRecommendationRepository } from './typeorm-recommendation.repository';

/** Query builder encadenable que registra cada llamada. */
function chainable(result: { many?: unknown[]; one?: unknown } = {}) {
  const calls: { method: string; args: unknown[] }[] = [];
  const builder: Record<string, unknown> = {};
  for (const method of [
    'innerJoin',
    'innerJoinAndSelect',
    'leftJoinAndSelect',
    'addSelect',
    'where',
    'andWhere',
    'orderBy',
    'addOrderBy',
  ]) {
    builder[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return builder;
    };
  }
  builder.getMany = () => Promise.resolve(result.many ?? []);
  builder.getOne = () => Promise.resolve(result.one ?? null);
  return { builder, calls };
}

function setup(result?: Parameters<typeof chainable>[0]) {
  const { builder, calls } = chainable(result);
  const repository = {
    createQueryBuilder: () => builder,
  } as unknown as Repository<RecommendationOrmEntity>;
  const collaborators = {
    createQueryBuilder: () => builder,
  } as unknown as Repository<CollaboratorOrmEntity>;
  return {
    recommendations: new TypeOrmRecommendationRepository(
      repository,
      collaborators,
    ),
    calls,
  };
}

const joinCondition = (calls: { method: string; args: unknown[] }[]) =>
  calls.find(
    (call) =>
      call.method === 'innerJoinAndSelect' && call.args[1] === 'collaborator',
  )?.args[2];

describe('TypeOrmRecommendationRepository', () => {
  it('only shows people who are active and gave their consent when listing (Ley 1581)', async () => {
    const { recommendations, calls } = setup();

    await recommendations.findByProject('p1', { includeUnavailable: true });

    expect(joinCondition(calls)).toBe(
      'collaborator.active = true AND collaborator.dataConsent = true',
    );
  });

  it('applies the same consent rule to the detail', async () => {
    const { recommendations, calls } = setup();

    await recommendations.findViewById('rec1');

    expect(joinCondition(calls)).toContain('collaborator.dataConsent = true');
  });

  it('hides unavailable people unless asked', async () => {
    const hidden = setup();
    await hidden.recommendations.findByProject('p1', {
      includeUnavailable: false,
    });
    const shown = setup();
    await shown.recommendations.findByProject('p1', {
      includeUnavailable: true,
    });

    const isAvailabilityFilter = (call: { args: unknown[] }) =>
      String(call.args[0]).includes('NO_DISPONIBLE');
    expect(hidden.calls.some(isAvailabilityFilter)).toBe(true);
    expect(shown.calls.some(isAvailabilityFilter)).toBe(false);
  });

  it('filters by profile when asked', async () => {
    const { recommendations, calls } = setup();

    await recommendations.findByProject('p1', {
      profileId: 'rp1',
      includeUnavailable: true,
    });

    expect(
      calls.some((call) =>
        String(call.args[0]).includes('profile.id = :profileId'),
      ),
    ).toBe(true);
  });

  it('returns null when the detail does not exist', async () => {
    const { recommendations } = setup({ one: null });

    await expect(recommendations.findViewById('x')).resolves.toBeNull();
  });
});
