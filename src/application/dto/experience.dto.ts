import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  EXPERIENCE_ROLE_MAX_LENGTH,
  EXPERIENCE_WEEKLY_HOURS,
  ORGANIZATION_MAX_LENGTH,
} from '../../domain/entities/collaborator-limits';
import { EXPERIENCE_TYPES } from '../../domain/entities/experience-type.type';
import type { ExperienceType } from '../../domain/entities/experience-type.type';
import { LEVELS } from '../../domain/entities/level.type';
import { IsCalendarDate } from './validators/is-calendar-date.decorator';
import type { Level } from '../../domain/entities/level.type';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsRequiredText, IsOptionalText } from './validators/text.decorators';

export class ExperienceDto {
  @IsIn(EXPERIENCE_TYPES)
  type: ExperienceType;

  @IsRequiredText({ max: EXPERIENCE_ROLE_MAX_LENGTH })
  role: string;

  @IsRequiredText({ max: ORGANIZATION_MAX_LENGTH })
  organization: string;

  @IsCalendarDate()
  startDate: string;

  @IsOptional()
  @IsCalendarDate()
  endDate?: string | null;

  @IsBoolean()
  current: boolean;

  @IsInt()
  @Min(EXPERIENCE_WEEKLY_HOURS.min)
  @Max(EXPERIENCE_WEEKLY_HOURS.max)
  weeklyHours: number;

  @IsIn(LEVELS)
  level: Level;

  @IsOptionalNonNull()
  @IsArray()
  @IsUUID('4', { each: true })
  skillIds?: string[];

  @IsOptionalText()
  description?: string | null;
}
