import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsIn,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { USER_ROLES } from '../../domain/entities/user-role.type';
import type { UserRole } from '../../domain/entities/user-role.type';
import { RegisterCollaboratorDto } from './register.dto';
import { IsRequiredText } from './validators/text.decorators';
import { USER_FULL_NAME_LENGTH } from '../../domain/entities/field-limits';

export class CreateUserDto {
  @IsRequiredText(USER_FULL_NAME_LENGTH)
  fullName: string;

  @IsEmail({}, { message: 'Formato de email inválido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsIn(USER_ROLES)
  role: UserRole;

  // v2.1: toda cuenta, también la de un ADMIN, queda vinculada a una persona identificada.
  @IsDefined({ message: 'Los datos de la persona son obligatorios' })
  @ValidateNested()
  @Type(() => RegisterCollaboratorDto)
  collaborator: RegisterCollaboratorDto;
}
