import { IsBoolean } from 'class-validator';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsRequiredText } from './validators/text.decorators';
import { PROJECT_CATEGORY_NAME_LENGTH } from '../../domain/entities/field-limits';

export class UpdateProjectCategoryDto {
  @IsOptionalNonNull()
  @IsRequiredText(PROJECT_CATEGORY_NAME_LENGTH)
  name?: string;

  @IsOptionalNonNull()
  @IsBoolean()
  active?: boolean;
}
