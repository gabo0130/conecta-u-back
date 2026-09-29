import { IsOptionalText, IsRequiredText } from './validators/text.decorators';
import {
  PROGRAM_CODE_LENGTH,
  PROGRAM_FACULTY_MAX_LENGTH,
  PROGRAM_NAME_LENGTH,
} from '../../domain/entities/field-limits';

export class CreateProgramDto {
  @IsRequiredText(PROGRAM_CODE_LENGTH)
  code: string;

  @IsRequiredText(PROGRAM_NAME_LENGTH)
  name: string;

  @IsOptionalText(PROGRAM_FACULTY_MAX_LENGTH)
  faculty?: string | null;
}
