import type { Page, PageParams } from '../../shared/pagination/pagination.util';
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
  createdById: string;
  executingEntity?: string | null;
  sponsorEntity?: string | null;
  durationMonths?: number | null;
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
  executingEntity?: string | null;
  sponsorEntity?: string | null;
  durationMonths?: number | null;
  status?: ProjectStatus;
}

export interface ProjectRepository {
  findById(id: string): Promise<ProjectEntity | null>;
  findByLeaderId(
    leaderId: string,
    params: PageParams,
  ): Promise<Page<ProjectEntity>>;
  /** Todos los proyectos, del más reciente al más antiguo (vista del ADMIN). */
  findAll(params: PageParams): Promise<Page<ProjectEntity>>;
  countByLeaderId(leaderId: string): Promise<number>;
  create(data: CreateProjectRepositoryDto): Promise<ProjectEntity>;
  update(
    id: string,
    data: UpdateProjectRepositoryDto,
  ): Promise<ProjectEntity | null>;
}
