import { ProjectTypeEntity } from '../entities/project-type.entity';

export interface ProjectTypeRepository {
  findAll(onlyActive?: boolean): Promise<ProjectTypeEntity[]>;
  findById(id: string): Promise<ProjectTypeEntity | null>;
}
