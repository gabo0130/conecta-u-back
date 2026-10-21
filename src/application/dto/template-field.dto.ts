import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';
import {
  TAGS_LIMITS,
  TEMPLATE_FIELD_KINDS,
  type TemplateField,
} from '../../domain/entities/template-field.type';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsRequiredText } from './validators/text.decorators';
import {
  TEMPLATE_FIELD_KEY_MAX_LENGTH,
  TEMPLATE_FIELD_LABEL_MAX_LENGTH,
  TEMPLATE_FIELD_OPTION_MAX_LENGTH,
} from '../../domain/entities/field-limits';

/** Un campo de la plantilla de un tipo de proyecto, definido por el ADMIN (RF7/RF22). */
export class TemplateFieldDto {
  @Matches(/^[a-zA-Z][a-zA-Z0-9]*$/, {
    message:
      'key solo puede tener letras y números, sin espacios, y empezar con una letra',
  })
  @IsRequiredText({ max: TEMPLATE_FIELD_KEY_MAX_LENGTH })
  key: string;

  @IsRequiredText({ max: TEMPLATE_FIELD_LABEL_MAX_LENGTH })
  label: string;

  @IsIn(TEMPLATE_FIELD_KINDS)
  kind: TemplateField['kind'];

  @IsBoolean()
  required: boolean;

  @IsOptionalNonNull()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(TEMPLATE_FIELD_OPTION_MAX_LENGTH, { each: true })
  options?: string[];

  @IsOptionalNonNull()
  @IsInt()
  @Min(TAGS_LIMITS.min)
  @Max(TAGS_LIMITS.max)
  minItems?: number;

  @IsOptionalNonNull()
  @IsInt()
  @Min(TAGS_LIMITS.min)
  @Max(TAGS_LIMITS.max)
  maxItems?: number;
}
