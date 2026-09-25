import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { SKILL_CATEGORIES } from '../../domain/entities/skill-category.type';
import type { SkillCategory } from '../../domain/entities/skill-category.type';
import { SKILL_TYPES } from '../../domain/entities/skill-type.type';
import type { SkillType } from '../../domain/entities/skill-type.type';

export class ProposeSkillDto {
  @IsString()
  @Length(1, 80)
  name: string;

  @IsIn(SKILL_TYPES)
  type: SkillType;

  @IsOptional()
  @IsIn(SKILL_CATEGORIES)
  category?: SkillCategory;
}
