import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsRequiredText } from './validators/text.decorators';
import {
  PROJECT_TITLE_LENGTH,
  DELIVERABLE_NAME_MAX_LENGTH,
} from '../../domain/entities/field-limits';

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
}
