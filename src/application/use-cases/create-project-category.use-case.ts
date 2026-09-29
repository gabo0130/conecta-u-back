import { Inject, Injectable } from '@nestjs/common';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import { PROJECT_CATEGORY_REPOSITORY } from '../../shared/interfaces/tokens';
import { CreateProjectCategoryDto } from '../dto/create-project-category.dto';

/** ADMIN: crea una categoría de proyecto (RF22). */
@Injectable()
export class CreateProjectCategoryUseCase {
  constructor(
    @Inject(PROJECT_CATEGORY_REPOSITORY)
    private readonly projectCategoryRepository: ProjectCategoryRepository,
  ) {}

  async execute(data: CreateProjectCategoryDto) {
    return this.projectCategoryRepository.create({ name: data.name });
  }
}
