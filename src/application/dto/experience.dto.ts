import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { EXPERIENCE_TYPES } from '../../domain/entities/experience-type.type';
import type { ExperienceType } from '../../domain/entities/experience-type.type';
import { LEVELS } from '../../domain/entities/level.type';
import type { Level } from '../../domain/entities/level.type';

export class ExperienceDto {
  @IsIn(EXPERIENCE_TYPES)
  type: ExperienceType;

  @IsString()
  @MaxLength(120)
  role: string;

  @IsString()
  @MaxLength(160)
  organization: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsBoolean()
  current: boolean;

  @IsInt()
  @Min(1)
  @Max(60)
  weeklyHours: number;

  @IsIn(LEVELS)
  level: Level;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  skillIds?: string[];

  @IsOptional()
  @IsString()
  description?: string;
}
