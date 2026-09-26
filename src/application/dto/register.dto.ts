import { Type } from 'class-transformer';
import {
  IsDefined,
  IsIn,
  IsEmail,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PERSON_NAME_MAX_LENGTH } from '../../domain/entities/collaborator-limits';
import { PERSON_TYPES } from '../../domain/entities/person-type.type';
import type { PersonType } from '../../domain/entities/person-type.type';
import { REGISTERABLE_ROLES } from '../../domain/entities/user-role.type';
import type { RegisterableRole } from '../../domain/entities/user-role.type';

export class RegisterCollaboratorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(PERSON_NAME_MAX_LENGTH)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(PERSON_NAME_MAX_LENGTH)
  lastName: string;

  @IsIn(PERSON_TYPES)
  personType: PersonType;

  @IsUUID()
  programId: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName: string;

  @IsEmail({}, { message: 'Formato de email inválido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  // Solo LIDER o COLABORADOR: el registro público no puede crear cuentas ADMIN.
  @IsIn(REGISTERABLE_ROLES)
  role: RegisterableRole;

  // Obligatorio para COLABORADOR (RF1: la cuenta se vincula a un perfil técnico).
  @ValidateIf((dto: RegisterDto) => dto.role === 'COLABORADOR')
  @IsDefined({ message: 'Los datos del colaborador son obligatorios' })
  @ValidateNested()
  @Type(() => RegisterCollaboratorDto)
  collaborator?: RegisterCollaboratorDto;
}
