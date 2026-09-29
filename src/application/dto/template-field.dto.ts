import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import type { TemplateField } from '../../domain/entities/template-field.type';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsRequiredText } from './validators/text.decorators';
import {
  TEMPLATE_FIELD_KEY_MAX_LENGTH,
  TEMPLATE_FIELD_LABEL_MAX_LENGTH,
  TEMPLATE_FIELD_OPTION_MAX_LENGTH,
} from '../../domain/entities/field-limits';

const TEMPLATE_FIELD_KINDS: TemplateField['kind'][] = [
  'text',
  'textarea',
  'number',
  'date',
  'select',
];

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
}
