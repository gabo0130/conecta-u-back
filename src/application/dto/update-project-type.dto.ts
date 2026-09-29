import { Type } from 'class-transformer';
import { IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { TemplateFieldDto } from './template-field.dto';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsRequiredText } from './validators/text.decorators';
import { PROJECT_TYPE_NAME_LENGTH } from '../../domain/entities/field-limits';

export class UpdateProjectTypeDto {
  @IsOptionalNonNull()
  @IsRequiredText(PROJECT_TYPE_NAME_LENGTH)
  name?: string;

  @IsOptionalNonNull()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateFieldDto)
  templateFields?: TemplateFieldDto[];

  @IsOptionalNonNull()
  @IsBoolean()
  active?: boolean;
}
