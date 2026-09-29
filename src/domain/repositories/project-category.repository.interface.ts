import { ProjectCategoryEntity } from '../entities/project-category.entity';

export interface CreateProjectCategoryRepositoryDto {
  name: string;
}

export interface UpdateProjectCategoryRepositoryDto {
  name?: string;
  active?: boolean;
}

export interface ProjectCategoryRepository {
  findAll(onlyActive?: boolean): Promise<ProjectCategoryEntity[]>;
  findById(id: string): Promise<ProjectCategoryEntity | null>;
  create(
    data: CreateProjectCategoryRepositoryDto,
  ): Promise<ProjectCategoryEntity>;
  update(
    id: string,
    data: UpdateProjectCategoryRepositoryDto,
  ): Promise<ProjectCategoryEntity | null>;
}
