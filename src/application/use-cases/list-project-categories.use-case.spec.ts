import { ListProjectCategoriesUseCase } from './list-project-categories.use-case';
import { ProjectCategoryEntity } from '../../domain/entities/project-category.entity';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import { createMock } from '../../testing/test-doubles.testing';

describe('ListProjectCategoriesUseCase', () => {
  const projectCategoryRepository = createMock<ProjectCategoryRepository>();

  const useCase = new ListProjectCategoriesUseCase(projectCategoryRepository);

  it('returns the project categories', async () => {
    projectCategoryRepository.findAll.mockResolvedValue([
      new ProjectCategoryEntity('c1', 'Desarrollo de software'),
    ]);

    const result = await useCase.execute();

    expect(result.projectCategories).toHaveLength(1);
  });
});
