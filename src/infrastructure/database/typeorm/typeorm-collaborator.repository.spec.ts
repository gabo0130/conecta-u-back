import type { EntityManager, Repository } from 'typeorm';
import { OrmUtils } from 'typeorm/util/OrmUtils';
import type { CollaboratorOrmEntity } from './collaborator.orm-entity';
import { RecommendationOrmEntity } from './recommendation.orm-entity';
import { TypeOrmCollaboratorRepository } from './typeorm-collaborator.repository';

function setup(overrides: Partial<CollaboratorOrmEntity> = {}) {
  const loaded = {
    id: 'c1',
    summary: 'Resumen original',
    firstName: 'Ana',
    dataConsent: true,
    active: true,
    profileEmbedding: [0.1, 0.2],
    embeddingModel: 'fake/hash-v1@64',
    embeddingUpdatedAt: new Date('2026-01-01'),
    ...overrides,
  };
  const save = jest.fn((entity: CollaboratorOrmEntity) =>
    Promise.resolve(entity),
  );
  const remove = jest.fn().mockResolvedValue({ affected: 2 });
  const transactionManager = { save, delete: remove };
  const repository = {
    findOne: jest.fn().mockResolvedValue(loaded),
    merge: jest.fn((target: object, ...sources: object[]) =>
      OrmUtils.mergeDeep(target, ...sources),
    ),
    manager: {
      transaction: jest.fn((work: (manager: EntityManager) => unknown) =>
        work(transactionManager as unknown as EntityManager),
      ),
    },
  } as unknown as Repository<CollaboratorOrmEntity>;
  const collaborators = new TypeOrmCollaboratorRepository(repository);
  jest.spyOn(collaborators, 'findById').mockResolvedValue(null);
  return { collaborators, remove, saved: () => save.mock.calls[0][0] };
}

describe('TypeOrmCollaboratorRepository.update embedding invalidation', () => {
  it('marks the embedding stale when the summary changes', async () => {
    const { collaborators, saved } = setup();

    await collaborators.update('c1', { summary: 'Resumen nuevo' });

    expect(saved().embeddingUpdatedAt).toBeNull();
  });

  it('keeps the embedding when the summary stays the same', async () => {
    const { collaborators, saved } = setup();

    await collaborators.update('c1', { summary: 'Resumen original' });

    expect(saved().embeddingUpdatedAt).toEqual(new Date('2026-01-01'));
  });

  it('keeps the embedding when only unrelated fields change', async () => {
    const { collaborators, saved, remove } = setup();

    await collaborators.update('c1', { firstName: 'Ana María' });

    expect(saved().embeddingUpdatedAt).toEqual(new Date('2026-01-01'));
    expect(saved().profileEmbedding).toEqual([0.1, 0.2]);
    expect(remove).not.toHaveBeenCalled();
  });
});

describe('TypeOrmCollaboratorRepository.update consent withdrawal (Ley 1581)', () => {
  it.each([
    ['withdraws data consent', { dataConsent: false }],
    ['is deactivated', { active: false }],
  ])(
    'deletes the embedding and the stored recommendations when the person %s',
    async (_case, change) => {
      const { collaborators, saved, remove } = setup();

      await collaborators.update('c1', change);

      expect(saved()).toMatchObject({
        profileEmbedding: null,
        embeddingModel: null,
        embeddingUpdatedAt: null,
      });
      expect(remove).toHaveBeenCalledWith(RecommendationOrmEntity, {
        collaboratorId: 'c1',
      });
    },
  );

  it('keeps nothing derived for someone who never consented, even on unrelated edits', async () => {
    const { collaborators, saved, remove } = setup({ dataConsent: false });

    await collaborators.update('c1', { firstName: 'Ana María' });

    expect(saved().profileEmbedding).toBeNull();
    expect(remove).toHaveBeenCalled();
  });
});
