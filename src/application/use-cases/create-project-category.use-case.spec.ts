import { CreateProjectCategoryUseCase } from './create-project-category.use-case';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import {
  buildProjectCategory,
  createMock,
} from '../../testing/test-doubles.testing';

describe('CreateProjectCategoryUseCase', () => {
  const projectCategoryRepository = createMock<ProjectCategoryRepository>();
  const useCase = new CreateProjectCategoryUseCase(projectCategoryRepository);

  beforeEach(() => jest.clearAllMocks());

  it('creates a project category with the given name', async () => {
    projectCategoryRepository.create.mockResolvedValue(buildProjectCategory());

    await useCase.execute({ name: 'Desarrollo de software' });

    expect(projectCategoryRepository.create).toHaveBeenCalledWith({
      name: 'Desarrollo de software',
    });
  });
});
