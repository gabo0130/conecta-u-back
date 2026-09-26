import type { ProjectStatus } from '../entities/project-status.type';
import { ProjectEntity } from '../entities/project.entity';

export interface DeliverableInput {
  name: string;
  scope: string;
}

export interface CreateProjectRepositoryDto {
  title: string;
  summary: string;
  objectives: string;
  typeId: string;
  categoryId: string;
  programId?: string | null;
  typeData?: Record<string, unknown>;
  knownSkillIds?: string[];
  deliverables: DeliverableInput[];
  leaderId: string;
}

export interface UpdateProjectRepositoryDto {
  title?: string;
  summary?: string;
  objectives?: string;
  typeId?: string;
  categoryId?: string;
  programId?: string | null;
  typeData?: Record<string, unknown>;
  knownSkillIds?: string[];
  deliverables?: DeliverableInput[];
  status?: ProjectStatus;
}

export interface ProjectRepository {
  findById(id: string): Promise<ProjectEntity | null>;
  findByLeaderId(leaderId: string): Promise<ProjectEntity[]>;
  /** Todos los proyectos, del más reciente al más antiguo (vista del ADMIN). */
  findAll(): Promise<ProjectEntity[]>;
  create(data: CreateProjectRepositoryDto): Promise<ProjectEntity>;
  update(
    id: string,
    data: UpdateProjectRepositoryDto,
  ): Promise<ProjectEntity | null>;
}
