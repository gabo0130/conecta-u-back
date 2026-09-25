import type { Level } from '../entities/level.type';
import { CollaboratorSkillEntity } from '../entities/collaborator-skill.entity';

export interface CreateCollaboratorSkillRepositoryDto {
  collaboratorId: string;
  skillId: string;
  level: Level;
  experienceMonths: number;
  lastUsedYear?: number | null;
}

export interface UpdateCollaboratorSkillRepositoryDto {
  skillId?: string;
  level?: Level;
  experienceMonths?: number;
  lastUsedYear?: number | null;
}

export interface CollaboratorSkillRepository {
  findById(id: string): Promise<CollaboratorSkillEntity | null>;
  findByCollaboratorId(
    collaboratorId: string,
  ): Promise<CollaboratorSkillEntity[]>;
  create(
    data: CreateCollaboratorSkillRepositoryDto,
  ): Promise<CollaboratorSkillEntity>;
  update(
    id: string,
    data: UpdateCollaboratorSkillRepositoryDto,
  ): Promise<CollaboratorSkillEntity | null>;
  delete(id: string): Promise<boolean>;
}
