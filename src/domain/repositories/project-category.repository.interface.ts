import { ProjectCategoryEntity } from '../entities/project-category.entity';

export interface ProjectCategoryRepository {
  findAll(onlyActive?: boolean): Promise<ProjectCategoryEntity[]>;
  findById(id: string): Promise<ProjectCategoryEntity | null>;
}
