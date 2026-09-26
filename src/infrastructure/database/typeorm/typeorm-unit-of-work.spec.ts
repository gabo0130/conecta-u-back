import type { DataSource, EntityManager } from 'typeorm';
import { TypeOrmCollaboratorRepository } from './typeorm-collaborator.repository';
import { TypeOrmUnitOfWork } from './typeorm-unit-of-work';

describe('TypeOrmUnitOfWork', () => {
  it('runs the work inside a transaction with repositories bound to its manager', async () => {
    const manager = {
      getRepository: jest.fn().mockReturnValue({}),
    } as unknown as EntityManager;
    const dataSource = {
      transaction: jest.fn(
        (work: (manager: EntityManager) => Promise<unknown>) => work(manager),
      ),
    } as unknown as DataSource;
    const unitOfWork = new TypeOrmUnitOfWork(dataSource);

    const result = await unitOfWork.run((repositories) => {
      expect(repositories.collaborators).toBeInstanceOf(
        TypeOrmCollaboratorRepository,
      );
      return Promise.resolve('done');
    });

    expect(result).toBe('done');
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(manager.getRepository).toHaveBeenCalledTimes(5);
  });
});
