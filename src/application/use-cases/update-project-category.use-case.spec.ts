import { NotFoundException } from '@nestjs/common';
import { UpdateProjectCategoryUseCase } from './update-project-category.use-case';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import {
  buildProjectCategory,
  createMock,
} from '../../testing/test-doubles.testing';

describe('UpdateProjectCategoryUseCase', () => {
  const projectCategoryRepository = createMock<ProjectCategoryRepository>();
  const useCase = new UpdateProjectCategoryUseCase(projectCategoryRepository);

  beforeEach(() => jest.clearAllMocks());

  it('updates the category and returns it', async () => {
    projectCategoryRepository.update.mockResolvedValue(
      buildProjectCategory({ active: false }),
    );

    const result = await useCase.execute('category-1', { active: false });

    expect(projectCategoryRepository.update).toHaveBeenCalledWith(
      'category-1',
      { active: false },
    );
    expect(result.active).toBe(false);
  });

  it('throws 404 when the category does not exist', async () => {
    projectCategoryRepository.update.mockResolvedValue(null);

    await expect(useCase.execute('missing', {})).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
