import { IsIn, IsOptional } from 'class-validator';
import { SKILL_CATEGORIES } from '../../domain/entities/skill-category.type';
import type { SkillCategory } from '../../domain/entities/skill-category.type';
import { SKILL_TYPES } from '../../domain/entities/skill-type.type';
import type { SkillType } from '../../domain/entities/skill-type.type';
import { IsRequiredText } from './validators/text.decorators';
import { SKILL_NAME_MAX_LENGTH } from '../../domain/entities/field-limits';

export class ProposeSkillDto {
  @IsRequiredText({ max: SKILL_NAME_MAX_LENGTH })
  name: string;

  @IsIn(SKILL_TYPES)
  type: SkillType;

  @IsOptional()
  @IsIn(SKILL_CATEGORIES)
  category?: SkillCategory;
}
