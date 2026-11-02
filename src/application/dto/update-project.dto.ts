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
import { DURATION_MESSAGE, DeliverableDto } from './create-project.dto';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsOptionalText, IsRequiredText } from './validators/text.decorators';
import {
  PROJECT_DURATION_MONTHS,
  PROJECT_ENTITY_MAX_LENGTH,
  PROJECT_TITLE_LENGTH,
} from '../../domain/entities/field-limits';

export class UpdateProjectDto {
  @IsOptionalNonNull()
  @IsRequiredText(PROJECT_TITLE_LENGTH)
  title?: string;

  @IsOptionalNonNull()
  @IsRequiredText()
  summary?: string;

  @IsOptionalNonNull()
  @IsRequiredText()
  objectives?: string;

  // v2.2, E5: una vez registrados, ejecutora y duración no se pueden vaciar.
  @IsOptionalNonNull()
  @IsRequiredText({ max: PROJECT_ENTITY_MAX_LENGTH })
  executingEntity?: string;

  @IsOptionalText(PROJECT_ENTITY_MAX_LENGTH)
  sponsorEntity?: string | null;

  @IsOptionalNonNull()
  @IsInt({ message: DURATION_MESSAGE })
  @Min(PROJECT_DURATION_MONTHS.min, { message: DURATION_MESSAGE })
  @Max(PROJECT_DURATION_MONTHS.max, { message: DURATION_MESSAGE })
  durationMonths?: number;

  @IsOptionalNonNull()
  @IsUUID()
  typeId?: string;

  @IsOptionalNonNull()
  @IsUUID()
  categoryId?: string;

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

  // RF6: un proyecto conserva al menos un entregable.
  @IsOptionalNonNull()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DeliverableDto)
  deliverables?: DeliverableDto[];
}
