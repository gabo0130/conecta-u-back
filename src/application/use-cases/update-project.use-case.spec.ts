import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateProjectUseCase } from './update-project.use-case';
import { ProjectEntity } from '../../domain/entities/project.entity';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';

describe('UpdateProjectUseCase', () => {
  const projectRepository: jest.Mocked<
    Pick<ProjectRepository, 'findById' | 'update'>
  > = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const useCase = new UpdateProjectUseCase(projectRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the project when owned by the leader', async () => {
    projectRepository.findById.mockResolvedValue(
      new ProjectEntity(
        'p1',
        'SISGELAB',
        'resumen',
        'objetivos',
        null,
        null,
        null,
        '1',
        'BORRADOR',
      ),
    );
    projectRepository.update.mockResolvedValue(
      new ProjectEntity(
        'p1',
        'SISGELAB v2',
        'resumen',
        'objetivos',
        null,
        null,
        null,
        '1',
        'BORRADOR',
      ),
    );

    const result = await useCase.execute('1', 'p1', {
      title: 'SISGELAB v2',
    });

    expect(result.title).toBe('SISGELAB v2');
  });

  it('throws NotFoundException when project does not exist', async () => {
    projectRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('1', 'p1', { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException when project belongs to another leader', async () => {
    projectRepository.findById.mockResolvedValue(
      new ProjectEntity(
        'p1',
        'SISGELAB',
        'resumen',
        'objetivos',
        null,
        null,
        null,
        '2',
        'BORRADOR',
      ),
    );

    await expect(
      useCase.execute('1', 'p1', { title: 'x' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
