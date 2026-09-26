import { ListProjectTypesUseCase } from './list-project-types.use-case';
import { ProjectTypeEntity } from '../../domain/entities/project-type.entity';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import { createMock } from '../../testing/test-doubles.testing';

describe('ListProjectTypesUseCase', () => {
  const projectTypeRepository = createMock<ProjectTypeRepository>();

  const useCase = new ListProjectTypesUseCase(projectTypeRepository);

  it('returns the project types', async () => {
    projectTypeRepository.findAll.mockResolvedValue([
      new ProjectTypeEntity('t1', 'CURSO', 'Curso'),
    ]);

    const result = await useCase.execute();

    expect(result.projectTypes).toHaveLength(1);
  });
});
