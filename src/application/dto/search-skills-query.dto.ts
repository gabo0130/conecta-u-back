import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { SKILL_NAME_MAX_LENGTH } from '../../domain/entities/field-limits';
import { SKILL_TYPES } from '../../domain/entities/skill-type.type';
import type { SkillType } from '../../domain/entities/skill-type.type';

export class SearchSkillsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(SKILL_NAME_MAX_LENGTH)
  q?: string;

  @IsOptional()
  @IsIn(SKILL_TYPES)
  type?: SkillType;
}
