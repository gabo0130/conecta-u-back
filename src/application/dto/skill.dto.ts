import { IsIn, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { SKILL_TYPES } from '../../domain/entities/skill-type.type';
import type { SkillType } from '../../domain/entities/skill-type.type';

export class SkillDto {
  @IsString()
  @Length(1, 80)
  name: string;

  @IsIn(SKILL_TYPES)
  type: SkillType;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  level?: string;
}
