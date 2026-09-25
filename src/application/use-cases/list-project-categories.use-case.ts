import { Inject, Injectable } from '@nestjs/common';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import { PROJECT_CATEGORY_REPOSITORY } from '../../shared/interfaces/tokens';

@Injectable()
export class ListProjectCategoriesUseCase {
  constructor(
    @Inject(PROJECT_CATEGORY_REPOSITORY)
    private readonly projectCategoryRepository: ProjectCategoryRepository,
  ) {}

  async execute() {
    return {
      projectCategories: await this.projectCategoryRepository.findAll(),
    };
  }
}
