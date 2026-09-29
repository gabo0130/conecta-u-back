import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { TemplateFieldDto } from './template-field.dto';
import { IsRequiredText } from './validators/text.decorators';
import {
  PROJECT_TYPE_CODE_LENGTH,
  PROJECT_TYPE_NAME_LENGTH,
} from '../../domain/entities/field-limits';

export class CreateProjectTypeDto {
  @IsRequiredText(PROJECT_TYPE_CODE_LENGTH)
  code: string;

  @IsRequiredText(PROJECT_TYPE_NAME_LENGTH)
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateFieldDto)
  templateFields: TemplateFieldDto[];
}
