import { ListProjectCategoriesUseCase } from './list-project-categories.use-case';
import { ProjectCategoryEntity } from '../../domain/entities/project-category.entity';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';

describe('ListProjectCategoriesUseCase', () => {
  const projectCategoryRepository: jest.Mocked<
    Pick<ProjectCategoryRepository, 'findAll'>
  > = {
    findAll: jest.fn(),
  };

  const useCase = new ListProjectCategoriesUseCase(projectCategoryRepository);

  it('returns the project categories', async () => {
    projectCategoryRepository.findAll.mockResolvedValue([
      new ProjectCategoryEntity('c1', 'Desarrollo de software'),
    ]);

    const result = await useCase.execute();

    expect(result.projectCategories).toHaveLength(1);
  });
});
