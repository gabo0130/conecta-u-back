import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { DeliverableDto } from './create-project.dto';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsRequiredText } from './validators/text.decorators';
import { PROJECT_TITLE_LENGTH } from '../../domain/entities/field-limits';

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

  // RF10: un proyecto conserva al menos un entregable.
  @IsOptionalNonNull()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DeliverableDto)
  deliverables?: DeliverableDto[];
}
