import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetProjectByIdUseCase } from './get-project-by-id.use-case';
import { ProjectEntity } from '../../domain/entities/project.entity';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';

describe('GetProjectByIdUseCase', () => {
  const projectRepository: jest.Mocked<Pick<ProjectRepository, 'findById'>> = {
    findById: jest.fn(),
  };

  const useCase = new GetProjectByIdUseCase(projectRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the project when owned by the leader', async () => {
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

    const result = await useCase.execute('1', 'p1');

    expect(result.id).toBe('p1');
  });

  it('throws NotFoundException when project does not exist', async () => {
    projectRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('1', 'p1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
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

    await expect(useCase.execute('1', 'p1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
