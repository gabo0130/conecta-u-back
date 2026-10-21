import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDefined,
  IsIn,
  IsEmail,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PERSON_NAME_MAX_LENGTH } from '../../domain/entities/collaborator-limits';
import { PERSON_TYPES } from '../../domain/entities/person-type.type';
import type { PersonType } from '../../domain/entities/person-type.type';
import { REGISTERABLE_ROLES } from '../../domain/entities/user-role.type';
import type { RegisterableRole } from '../../domain/entities/user-role.type';
import { PersonIdentificationDto } from './person-identification.dto';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsRequiredText } from './validators/text.decorators';
import { USER_FULL_NAME_LENGTH } from '../../domain/entities/field-limits';

/** La persona de la cuenta (v2.1: toda cuenta queda vinculada a una persona con su documento). */
export class RegisterCollaboratorDto extends PersonIdentificationDto {
  @IsRequiredText({ max: PERSON_NAME_MAX_LENGTH })
  firstName: string;

  @IsRequiredText({ max: PERSON_NAME_MAX_LENGTH })
  lastName: string;

  @IsIn(PERSON_TYPES)
  personType: PersonType;

  @IsUUID()
  programId: string;

  // Autorización de tratamiento de datos (Ley 1581): se guarda con su fecha en el perfil.
  @IsOptionalNonNull()
  @IsBoolean({ message: 'La autorización de datos debe ser verdadero o falso' })
  dataConsent?: boolean;
}

export class RegisterDto {
  @IsRequiredText(USER_FULL_NAME_LENGTH)
  fullName: string;

  @IsEmail({}, { message: 'Formato de email inválido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  // Solo LIDER o COLABORADOR: el registro público no puede crear cuentas ADMIN.
  @IsIn(REGISTERABLE_ROLES)
  role: RegisterableRole;

  // Obligatorio para todo rol (v2.1, A1–A4): la cuenta se vincula a una persona identificada.
  @IsDefined({ message: 'Los datos de la persona son obligatorios' })
  @ValidateNested()
  @Type(() => RegisterCollaboratorDto)
  collaborator: RegisterCollaboratorDto;
}
