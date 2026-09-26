import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetProjectByIdUseCase } from './get-project-by-id.use-case';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import { buildProject, createMock } from '../../testing/test-doubles.testing';

const projectOf = (leaderId: string) => buildProject({ id: 'p1', leaderId });

describe('GetProjectByIdUseCase', () => {
  const projectRepository = createMock<ProjectRepository>();

  const useCase = new GetProjectByIdUseCase(projectRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the project when owned by the leader', async () => {
    projectRepository.findById.mockResolvedValue(projectOf('1'));

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
    projectRepository.findById.mockResolvedValue(projectOf('2'));

    await expect(useCase.execute('1', 'p1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
