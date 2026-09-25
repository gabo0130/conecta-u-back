import type { ExperienceType } from '../entities/experience-type.type';
import { ExperienceEntity } from '../entities/experience.entity';
import type { Level } from '../entities/level.type';

export interface CreateExperienceRepositoryDto {
  collaboratorId: string;
  type: ExperienceType;
  role: string;
  organization: string;
  startDate: string;
  endDate?: string | null;
  current?: boolean;
  weeklyHours: number;
  level: Level;
  description?: string | null;
  skillIds?: string[];
}

export interface UpdateExperienceRepositoryDto {
  type?: ExperienceType;
  role?: string;
  organization?: string;
  startDate?: string;
  endDate?: string | null;
  current?: boolean;
  weeklyHours?: number;
  level?: Level;
  description?: string | null;
  skillIds?: string[];
}

export interface ExperienceRepository {
  findById(id: string): Promise<ExperienceEntity | null>;
  findByCollaboratorId(collaboratorId: string): Promise<ExperienceEntity[]>;
  create(data: CreateExperienceRepositoryDto): Promise<ExperienceEntity>;
  update(
    id: string,
    data: UpdateExperienceRepositoryDto,
  ): Promise<ExperienceEntity | null>;
  delete(id: string): Promise<boolean>;
}
