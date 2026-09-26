import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { SKILL_TYPES } from '../../domain/entities/skill-type.type';
import type { SkillType } from '../../domain/entities/skill-type.type';

export class SearchSkillsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @IsIn(SKILL_TYPES)
  type?: SkillType;
}
