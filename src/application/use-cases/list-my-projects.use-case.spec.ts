import { ListMyProjectsUseCase } from './list-my-projects.use-case';
import { ProjectEntity } from '../../domain/entities/project.entity';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';

describe('ListMyProjectsUseCase', () => {
  const projectRepository: jest.Mocked<
    Pick<ProjectRepository, 'findByLeaderId'>
  > = {
    findByLeaderId: jest.fn(),
  };

  const useCase = new ListMyProjectsUseCase(projectRepository);

  it('returns projects for the leader', async () => {
    projectRepository.findByLeaderId.mockResolvedValue([
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
    ]);

    const result = await useCase.execute('1');

    expect(projectRepository.findByLeaderId).toHaveBeenCalledWith('1');
    expect(result.projects).toHaveLength(1);
  });
});
