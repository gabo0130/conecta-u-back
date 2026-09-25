import type { SkillCategory } from '../entities/skill-category.type';
import type { SkillStatus } from '../entities/skill-status.type';
import type { SkillType } from '../entities/skill-type.type';
import { SkillEntity } from '../entities/skill.entity';

export interface CreateSkillRepositoryDto {
  name: string;
  normalizedName: string;
  type: SkillType;
  category?: SkillCategory;
  synonyms?: string[];
  status?: SkillStatus;
}

export interface SkillSearchFilter {
  query?: string;
  type?: SkillType;
}

export interface SkillRepository {
  findById(id: string): Promise<SkillEntity | null>;
  findByNormalizedNameOrSynonym(
    normalized: string,
  ): Promise<SkillEntity | null>;
  search(filter: SkillSearchFilter): Promise<SkillEntity[]>;
  create(data: CreateSkillRepositoryDto): Promise<SkillEntity>;
}
