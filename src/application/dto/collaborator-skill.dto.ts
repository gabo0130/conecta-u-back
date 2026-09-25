import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { LEVELS } from '../../domain/entities/level.type';
import type { Level } from '../../domain/entities/level.type';

export class CollaboratorSkillDto {
  @IsUUID()
  skillId: string;

  @IsIn(LEVELS)
  level: Level;

  @IsInt()
  @Min(0)
  @Max(600)
  experienceMonths: number;

  @IsOptional()
  @IsInt()
  lastUsedYear?: number;
}
