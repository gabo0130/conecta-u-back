import { IsBoolean } from 'class-validator';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsOptionalText, IsRequiredText } from './validators/text.decorators';
import {
  PROGRAM_FACULTY_MAX_LENGTH,
  PROGRAM_NAME_LENGTH,
} from '../../domain/entities/field-limits';

export class UpdateProgramDto {
  @IsOptionalNonNull()
  @IsRequiredText(PROGRAM_NAME_LENGTH)
  name?: string;

  @IsOptionalText(PROGRAM_FACULTY_MAX_LENGTH)
  faculty?: string | null;

  @IsOptionalNonNull()
  @IsBoolean()
  active?: boolean;
}
