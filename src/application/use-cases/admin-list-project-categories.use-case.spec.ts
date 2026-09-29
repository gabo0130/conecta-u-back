import { AdminListProjectCategoriesUseCase } from './admin-list-project-categories.use-case';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import {
  buildProjectCategory,
  createMock,
} from '../../testing/test-doubles.testing';

describe('AdminListProjectCategoriesUseCase', () => {
  const projectCategoryRepository = createMock<ProjectCategoryRepository>();
  const useCase = new AdminListProjectCategoriesUseCase(
    projectCategoryRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it('lists all project categories, including inactive ones', async () => {
    projectCategoryRepository.findAll.mockResolvedValue([
      buildProjectCategory({ active: false }),
    ]);

    const result = await useCase.execute();

    expect(projectCategoryRepository.findAll).toHaveBeenCalledWith(false);
    expect(result.projectCategories).toHaveLength(1);
  });
});
