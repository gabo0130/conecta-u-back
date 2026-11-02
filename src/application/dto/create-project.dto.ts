import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  Max,
  Min,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsOptionalText, IsRequiredText } from './validators/text.decorators';
import {
  PROJECT_TITLE_LENGTH,
  DELIVERABLE_NAME_MAX_LENGTH,
  PROJECT_DURATION_MONTHS,
  PROJECT_ENTITY_MAX_LENGTH,
} from '../../domain/entities/field-limits';

export const DURATION_MESSAGE = `La duración debe ser un número entero de meses entre ${PROJECT_DURATION_MONTHS.min} y ${PROJECT_DURATION_MONTHS.max}`;

export class DeliverableDto {
  @IsRequiredText({ max: DELIVERABLE_NAME_MAX_LENGTH })
  name: string;

  @IsRequiredText()
  scope: string;
}

export class CreateProjectDto {
  @IsRequiredText(PROJECT_TITLE_LENGTH)
  title: string;

  @IsRequiredText()
  summary: string;

  @IsRequiredText()
  objectives: string;

  // v2.2, E5: quién ejecuta el proyecto, quién lo patrocina (opcional) y cuánto dura.
  @IsRequiredText({ max: PROJECT_ENTITY_MAX_LENGTH })
  executingEntity: string;

  @IsOptionalText(PROJECT_ENTITY_MAX_LENGTH)
  sponsorEntity?: string | null;

  @IsInt({ message: DURATION_MESSAGE })
  @Min(PROJECT_DURATION_MONTHS.min, { message: DURATION_MESSAGE })
  @Max(PROJECT_DURATION_MONTHS.max, { message: DURATION_MESSAGE })
  durationMonths: number;

  @IsUUID()
  typeId: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsUUID()
  programId?: string | null;

  @IsOptionalNonNull()
  @IsObject()
  typeData?: Record<string, unknown>;

  @IsOptionalNonNull()
  @IsArray()
  @IsUUID('4', { each: true })
  knownSkillIds?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DeliverableDto)
  deliverables: DeliverableDto[];

  // v2.1 (A5): solo lo usa el ADMIN, que registra el proyecto a nombre de un líder.
  // Si lo envía un LIDER se ignora: el proyecto siempre es suyo.
  @IsOptional()
  @IsUUID()
  leaderId?: string;
}
