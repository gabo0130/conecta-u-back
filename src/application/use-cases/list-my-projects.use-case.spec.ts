import { ListMyProjectsUseCase } from './list-my-projects.use-case';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';
import { buildProject, createMock } from '../../testing/test-doubles.testing';

describe('ListMyProjectsUseCase', () => {
  const projectRepository = createMock<ProjectRepository>();

  const useCase = new ListMyProjectsUseCase(projectRepository);

  it('returns projects for the leader', async () => {
    projectRepository.findByLeaderId.mockResolvedValue([
      buildProject({ id: 'p1', leaderId: '1' }),
    ]);

    const result = await useCase.execute('1');

    expect(projectRepository.findByLeaderId).toHaveBeenCalledWith('1');
    expect(result.projects).toHaveLength(1);
  });
});
