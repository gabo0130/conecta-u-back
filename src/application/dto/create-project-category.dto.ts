import { IsRequiredText } from './validators/text.decorators';
import { PROJECT_CATEGORY_NAME_LENGTH } from '../../domain/entities/field-limits';

export class CreateProjectCategoryDto {
  @IsRequiredText(PROJECT_CATEGORY_NAME_LENGTH)
  name: string;
}
