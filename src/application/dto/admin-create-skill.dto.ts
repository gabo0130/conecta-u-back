import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import { SKILL_NAME_MAX_LENGTH } from '../../domain/entities/field-limits';
import { SKILL_CATEGORIES } from '../../domain/entities/skill-category.type';
import type { SkillCategory } from '../../domain/entities/skill-category.type';
import { SKILL_STATUSES } from '../../domain/entities/skill-status.type';
import type { SkillStatus } from '../../domain/entities/skill-status.type';
import { SKILL_TYPES } from '../../domain/entities/skill-type.type';
import type { SkillType } from '../../domain/entities/skill-type.type';
import { IsRequiredText } from './validators/text.decorators';

/** El ADMIN agrega una habilidad directamente al catálogo (a diferencia de "proponer", que siempre queda PENDIENTE). */
export class AdminCreateSkillDto {
  @IsRequiredText({ max: SKILL_NAME_MAX_LENGTH })
  name: string;

  @IsIn(SKILL_TYPES)
  type: SkillType;

  @IsOptional()
  @IsIn(SKILL_CATEGORIES)
  category?: SkillCategory;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  synonyms?: string[];

  @IsOptional()
  @IsIn(SKILL_STATUSES)
  status?: SkillStatus;
}
