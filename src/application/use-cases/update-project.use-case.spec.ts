import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateProjectUseCase } from './update-project.use-case';
import { ProjectEntity } from '../../domain/entities/project.entity';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';

function buildProject(
  overrides: Partial<{ title: string; leaderId: string }> = {},
) {
  return new ProjectEntity(
    'p1',
    overrides.title ?? 'SISGELAB',
    'resumen',
    'objetivos',
    't1',
    'c1',
    null,
    {},
    [],
    [],
    overrides.leaderId ?? '1',
    'BORRADOR',
  );
}

describe('UpdateProjectUseCase', () => {
  const projectRepository: jest.Mocked<
    Pick<ProjectRepository, 'findById' | 'update'>
  > = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  const projectTypeRepository: jest.Mocked<
    Pick<ProjectTypeRepository, 'findById'>
  > = {
    findById: jest.fn(),
  };

  const useCase = new UpdateProjectUseCase(
    projectRepository,
    projectTypeRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the project when owned by the leader', async () => {
    projectRepository.findById.mockResolvedValue(buildProject());
    projectRepository.update.mockResolvedValue(
      buildProject({ title: 'SISGELAB v2' }),
    );

    const result = await useCase.execute('1', 'p1', {
      title: 'SISGELAB v2',
    });

    expect(result.title).toBe('SISGELAB v2');
    expect(projectTypeRepository.findById).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when project does not exist', async () => {
    projectRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('1', 'p1', { title: 'x' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws ForbiddenException when project belongs to another leader', async () => {
    projectRepository.findById.mockResolvedValue(
      buildProject({ leaderId: '2' }),
    );

    await expect(
      useCase.execute('1', 'p1', { title: 'x' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
