import { ProjectTypeEntity } from '../entities/project-type.entity';
import type { TemplateField } from '../entities/template-field.type';

export interface CreateProjectTypeRepositoryDto {
  code: string;
  name: string;
  templateFields: TemplateField[];
}

export interface UpdateProjectTypeRepositoryDto {
  name?: string;
  templateFields?: TemplateField[];
  active?: boolean;
}

export interface ProjectTypeRepository {
  findAll(onlyActive?: boolean): Promise<ProjectTypeEntity[]>;
  findById(id: string): Promise<ProjectTypeEntity | null>;
  create(data: CreateProjectTypeRepositoryDto): Promise<ProjectTypeEntity>;
  update(
    id: string,
    data: UpdateProjectTypeRepositoryDto,
  ): Promise<ProjectTypeEntity | null>;
}
