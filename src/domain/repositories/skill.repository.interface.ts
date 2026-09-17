import type { SkillType } from '../entities/skill-type.type';
import { SkillEntity } from '../entities/skill.entity';

export interface CreateSkillRepositoryDto {
  collaboratorId: string;
  name: string;
  type: SkillType;
  level?: string | null;
}

export interface UpdateSkillRepositoryDto {
  name?: string;
  type?: SkillType;
  level?: string | null;
}

export interface SkillRepository {
  findById(id: string): Promise<SkillEntity | null>;
  findByCollaboratorId(collaboratorId: string): Promise<SkillEntity[]>;
  create(data: CreateSkillRepositoryDto): Promise<SkillEntity>;
  update(
    id: string,
    data: UpdateSkillRepositoryDto,
  ): Promise<SkillEntity | null>;
  delete(id: string): Promise<boolean>;
}
