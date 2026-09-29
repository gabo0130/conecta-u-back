import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import { PROJECT_CATEGORY_REPOSITORY } from '../../shared/interfaces/tokens';
import { UpdateProjectCategoryDto } from '../dto/update-project-category.dto';

/** ADMIN: edita o activa/desactiva una categoría de proyecto (RF22). */
@Injectable()
export class UpdateProjectCategoryUseCase {
  constructor(
    @Inject(PROJECT_CATEGORY_REPOSITORY)
    private readonly projectCategoryRepository: ProjectCategoryRepository,
  ) {}

  async execute(id: string, data: UpdateProjectCategoryDto) {
    const category = await this.projectCategoryRepository.update(id, data);
    if (!category) {
      throw new NotFoundException({ message: 'Recurso no encontrado' });
    }
    return category;
  }
}
