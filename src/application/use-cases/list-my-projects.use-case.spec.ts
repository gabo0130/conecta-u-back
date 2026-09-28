import { ListMyProjectsUseCase } from './list-my-projects.use-case';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import { buildProject, createMock } from '../../testing/test-doubles.testing';

describe('ListMyProjectsUseCase', () => {
  const projectRepository = createMock<ProjectRepository>();

  const useCase = new ListMyProjectsUseCase(projectRepository);

  it('returns projects for the leader with pagination meta', async () => {
    projectRepository.findByLeaderId.mockResolvedValue({
      items: [buildProject({ id: 'p1', leaderId: '1' })],
      total: 1,
    });

    const result = await useCase.execute('1', { page: 1, pageSize: 20 });

    expect(projectRepository.findByLeaderId).toHaveBeenCalledWith('1', {
      page: 1,
      pageSize: 20,
    });
    expect(result.projects).toHaveLength(1);
    expect(result.meta).toEqual({
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    });
  });
});
