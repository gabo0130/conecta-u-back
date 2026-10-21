import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  MANUAL_SKILLS_PER_PROFILE,
  PROFILE_NAME_MAX_LENGTH,
  PROFILE_QUANTITY,
  PROFILE_TEXT_MAX_LENGTH,
  PROFILE_WEEKLY_HOURS,
} from '../../domain/entities/analysis-limits';
import { LEVELS } from '../../domain/entities/level.type';
import type { Level } from '../../domain/entities/level.type';
import { PRIORITIES } from '../../domain/entities/priority.type';
import type { Priority } from '../../domain/entities/priority.type';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsOptionalText, IsRequiredText } from './validators/text.decorators';

export class RequiredProfileSkillDto {
  @IsUUID()
  skillId: string;

  @IsIn(LEVELS)
  minLevel: Level;

  @IsIn(PRIORITIES)
  importance: Priority;
}

/** RF13: perfil que el líder agrega a mano, con habilidades del catálogo. */
export class CreateRequiredProfileDto {
  @IsRequiredText({ max: PROFILE_NAME_MAX_LENGTH })
  name: string;

  @IsOptionalText(PROFILE_TEXT_MAX_LENGTH)
  description?: string | null;

  @IsOptionalText(PROFILE_TEXT_MAX_LENGTH)
  justification?: string | null;

  @IsInt()
  @Min(PROFILE_QUANTITY.min)
  @Max(PROFILE_QUANTITY.max)
  quantity: number;

  @IsIn(PRIORITIES)
  priority: Priority;

  @IsOptional()
  @IsInt()
  @Min(PROFILE_WEEKLY_HOURS.min)
  @Max(PROFILE_WEEKLY_HOURS.max)
  minWeeklyHours?: number | null;

  @IsArray()
  @ArrayMinSize(MANUAL_SKILLS_PER_PROFILE.min)
  @ArrayMaxSize(MANUAL_SKILLS_PER_PROFILE.max)
  @ValidateNested({ each: true })
  @Type(() => RequiredProfileSkillDto)
  skills: RequiredProfileSkillDto[];
}

/** Edita un perfil (de la IA o manual); `active: false` lo descarta. */
export class UpdateRequiredProfileDto {
  @IsOptionalNonNull()
  @IsRequiredText({ max: PROFILE_NAME_MAX_LENGTH })
  name?: string;

  @IsOptionalText(PROFILE_TEXT_MAX_LENGTH)
  description?: string | null;

  @IsOptionalText(PROFILE_TEXT_MAX_LENGTH)
  justification?: string | null;

  @IsOptionalNonNull()
  @IsInt()
  @Min(PROFILE_QUANTITY.min)
  @Max(PROFILE_QUANTITY.max)
  quantity?: number;

  @IsOptionalNonNull()
  @IsIn(PRIORITIES)
  priority?: Priority;

  @IsOptional()
  @IsInt()
  @Min(PROFILE_WEEKLY_HOURS.min)
  @Max(PROFILE_WEEKLY_HOURS.max)
  minWeeklyHours?: number | null;

  @IsOptionalNonNull()
  @IsBoolean()
  active?: boolean;

  @IsOptionalNonNull()
  @IsArray()
  @ArrayMinSize(MANUAL_SKILLS_PER_PROFILE.min)
  @ArrayMaxSize(MANUAL_SKILLS_PER_PROFILE.max)
  @ValidateNested({ each: true })
  @Type(() => RequiredProfileSkillDto)
  skills?: RequiredProfileSkillDto[];
}
