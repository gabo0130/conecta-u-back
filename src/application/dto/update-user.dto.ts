import { IsBoolean, IsEmail, IsIn } from 'class-validator';
import { USER_ROLES } from '../../domain/entities/user-role.type';
import type { UserRole } from '../../domain/entities/user-role.type';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsRequiredText } from './validators/text.decorators';
import { USER_FULL_NAME_LENGTH } from '../../domain/entities/field-limits';

export class UpdateUserDto {
  @IsOptionalNonNull()
  @IsRequiredText(USER_FULL_NAME_LENGTH)
  fullName?: string;

  @IsOptionalNonNull()
  @IsEmail({}, { message: 'Formato de email inválido' })
  email?: string;

  @IsOptionalNonNull()
  @IsIn(USER_ROLES)
  role?: UserRole;

  @IsOptionalNonNull()
  @IsBoolean()
  active?: boolean;
}
