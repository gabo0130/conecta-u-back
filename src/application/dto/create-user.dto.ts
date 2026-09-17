import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { USER_ROLES } from '../../domain/entities/user-role.type';
import type { UserRole } from '../../domain/entities/user-role.type';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @IsEmail({}, { message: 'Formato de email inválido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsIn(USER_ROLES)
  role: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  program?: string;
}
