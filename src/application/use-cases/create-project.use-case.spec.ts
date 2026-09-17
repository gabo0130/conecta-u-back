import { CreateProjectUseCase } from './create-project.use-case';
import { ProjectEntity } from '../../domain/entities/project.entity';
import type { ProjectRepository } from '../../domain/repositories/project.repository.interface';

describe('CreateProjectUseCase', () => {
  const projectRepository: jest.Mocked<Pick<ProjectRepository, 'create'>> = {
    create: jest.fn(),
  };

  const useCase = new CreateProjectUseCase(projectRepository);

  it('creates a project for the leader', async () => {
    projectRepository.create.mockResolvedValue(
      new ProjectEntity(
        'p1',
        'SISGELAB',
        'resumen',
        'objetivos',
        ['React'],
        'Software',
        'sistemas',
        '1',
        'BORRADOR',
      ),
    );

    const result = await useCase.execute('1', {
      title: 'SISGELAB',
      summary: 'resumen',
      objectives: 'objetivos',
      knownSkills: ['React'],
      semillero: 'Software',
      program: 'sistemas',
    });

    expect(projectRepository.create).toHaveBeenCalledWith({
      title: 'SISGELAB',
      summary: 'resumen',
      objectives: 'objetivos',
      knownSkills: ['React'],
      semillero: 'Software',
      program: 'sistemas',
      leaderId: '1',
    });
    expect(result.status).toBe('BORRADOR');
  });
});
