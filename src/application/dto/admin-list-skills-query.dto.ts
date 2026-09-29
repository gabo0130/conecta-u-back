import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';
import { SKILL_NAME_MAX_LENGTH } from '../../domain/entities/field-limits';
import { SKILL_CATEGORIES } from '../../domain/entities/skill-category.type';
import type { SkillCategory } from '../../domain/entities/skill-category.type';
import { SKILL_STATUSES } from '../../domain/entities/skill-status.type';
import type { SkillStatus } from '../../domain/entities/skill-status.type';
import { SKILL_TYPES } from '../../domain/entities/skill-type.type';
import type { SkillType } from '../../domain/entities/skill-type.type';

export class AdminListSkillsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(SKILL_NAME_MAX_LENGTH)
  q?: string;

  @IsOptional()
  @IsIn(SKILL_TYPES)
  type?: SkillType;

  @IsOptional()
  @IsIn(SKILL_CATEGORIES)
  category?: SkillCategory;

  @IsOptional()
  @IsIn(SKILL_STATUSES)
  status?: SkillStatus;
}
