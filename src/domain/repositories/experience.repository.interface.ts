import { ExperienceEntity } from '../entities/experience.entity';

export interface CreateExperienceRepositoryDto {
  collaboratorId: string;
  title: string;
  organization?: string | null;
  period?: string | null;
  description?: string | null;
}

export interface UpdateExperienceRepositoryDto {
  title?: string;
  organization?: string | null;
  period?: string | null;
  description?: string | null;
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
