import { Type } from 'class-transformer';
import {
  IsIn,
  IsEmail,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { PERSON_TYPES } from '../../domain/entities/person-type.type';
import type { PersonType } from '../../domain/entities/person-type.type';
import { REGISTERABLE_ROLES } from '../../domain/entities/user-role.type';
import type { RegisterableRole } from '../../domain/entities/user-role.type';

export class RegisterCollaboratorDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
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

  @ValidateIf((dto: RegisterDto) => dto.role === 'COLABORADOR')
  @ValidateNested()
  @Type(() => RegisterCollaboratorDto)
  collaborator?: RegisterCollaboratorDto;
}
