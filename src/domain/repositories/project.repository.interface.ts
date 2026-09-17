import type { ProjectStatus } from '../entities/project-status.type';
import { ProjectEntity } from '../entities/project.entity';

export interface CreateProjectRepositoryDto {
  title: string;
  summary: string;
  objectives: string;
  knownSkills?: string[] | null;
  semillero?: string | null;
  program?: string | null;
  leaderId: string;
}

export interface UpdateProjectRepositoryDto {
  title?: string;
  summary?: string;
  objectives?: string;
  knownSkills?: string[] | null;
  semillero?: string | null;
  program?: string | null;
  status?: ProjectStatus;
}

export interface ProjectRepository {
  findById(id: string): Promise<ProjectEntity | null>;
  findByLeaderId(leaderId: string): Promise<ProjectEntity[]>;
  create(data: CreateProjectRepositoryDto): Promise<ProjectEntity>;
  update(
    id: string,
    data: UpdateProjectRepositoryDto,
  ): Promise<ProjectEntity | null>;
}
