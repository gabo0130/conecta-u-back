import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { SKILL_EXPERIENCE_MONTHS } from '../../domain/entities/collaborator-limits';
import { LEVELS } from '../../domain/entities/level.type';
import type { Level } from '../../domain/entities/level.type';
import { IsValidLastUsedYear } from './validators/is-valid-last-used-year.decorator';

export class CollaboratorSkillDto {
  @IsUUID()
  skillId: string;

  @IsIn(LEVELS)
  level: Level;

  @IsInt()
  @Min(SKILL_EXPERIENCE_MONTHS.min)
  @Max(SKILL_EXPERIENCE_MONTHS.max)
  experienceMonths: number;

  @IsOptional()
  @IsValidLastUsedYear()
  lastUsedYear?: number;
}
