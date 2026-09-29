import { IsArray, IsIn, IsString } from 'class-validator';
import { SKILL_NAME_MAX_LENGTH } from '../../domain/entities/field-limits';
import { SKILL_CATEGORIES } from '../../domain/entities/skill-category.type';
import type { SkillCategory } from '../../domain/entities/skill-category.type';
import { SKILL_STATUSES } from '../../domain/entities/skill-status.type';
import type { SkillStatus } from '../../domain/entities/skill-status.type';
import { SKILL_TYPES } from '../../domain/entities/skill-type.type';
import type { SkillType } from '../../domain/entities/skill-type.type';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsRequiredText } from './validators/text.decorators';

export class UpdateSkillDto {
  @IsOptionalNonNull()
  @IsRequiredText({ max: SKILL_NAME_MAX_LENGTH })
  name?: string;

  @IsOptionalNonNull()
  @IsIn(SKILL_TYPES)
  type?: SkillType;

  @IsOptionalNonNull()
  @IsIn(SKILL_CATEGORIES)
  category?: SkillCategory;

  @IsOptionalNonNull()
  @IsArray()
  @IsString({ each: true })
  synonyms?: string[];

  @IsOptionalNonNull()
  @IsIn(SKILL_STATUSES)
  status?: SkillStatus;
}
