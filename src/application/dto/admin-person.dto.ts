import { IsInterestList } from './validators/interests.decorator';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  AVAILABILITY_STATUSES,
  type AvailabilityStatus,
} from '../../domain/entities/availability-status.type';
import {
  COLLABORATOR_WEEKLY_HOURS,
  PERSON_NAME_MAX_LENGTH,
  RESEARCH_GROUP_MAX_LENGTH,
  SEMESTER,
} from '../../domain/entities/collaborator-limits';
import {
  PERSON_TYPES,
  type PersonType,
} from '../../domain/entities/person-type.type';
import { AccountPersonDto } from './register.dto';
import { IsOptionalNonNull } from './validators/is-optional-non-null.decorator';
import { IsOptionalText, IsRequiredText } from './validators/text.decorators';

const EMAIL_MAX_LENGTH = 254;
const toLowerEmail = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  );

/**
 * RF17 (HU-15): el ADMIN registra una persona sin cuenta (p. ej. un docente que no usará la
 * plataforma pero puede ser recomendado). Documento y contacto obligatorios como en v2.1.
 */
export class AdminCreatePersonDto extends AccountPersonDto {
  @toLowerEmail()
  @IsEmail({}, { message: 'Formato de email inválido' })
  @MaxLength(EMAIL_MAX_LENGTH)
  email: string;

  @IsOptional()
  @IsInt()
  @Min(SEMESTER.min)
  @Max(SEMESTER.max)
  semester?: number | null;

  @IsOptionalText(RESEARCH_GROUP_MAX_LENGTH)
  researchGroup?: string | null;

  @IsOptionalText()
  summary?: string | null;

  @IsInterestList()
  interests?: string[];

  @IsOptionalNonNull()
  @IsIn(AVAILABILITY_STATUSES)
  availabilityStatus?: AvailabilityStatus;

  @IsOptionalNonNull()
  @IsInt()
  @Min(COLLABORATOR_WEEKLY_HOURS.min)
  @Max(COLLABORATOR_WEEKLY_HOURS.max)
  weeklyHours?: number;
}

/** RF17: datos de perfil que el ADMIN puede corregir (la identificación va por su propia ruta). */
export class AdminUpdatePersonProfileDto {
  @IsOptionalNonNull()
  @IsRequiredText({ max: PERSON_NAME_MAX_LENGTH })
  firstName?: string;

  @IsOptionalNonNull()
  @IsRequiredText({ max: PERSON_NAME_MAX_LENGTH })
  lastName?: string;

  @IsOptionalNonNull()
  @IsIn(PERSON_TYPES)
  personType?: PersonType;

  @IsOptionalNonNull()
  @IsUUID()
  programId?: string;

  @IsOptional()
  @IsInt()
  @Min(SEMESTER.min)
  @Max(SEMESTER.max)
  semester?: number | null;

  @IsOptionalText(RESEARCH_GROUP_MAX_LENGTH)
  researchGroup?: string | null;

  @IsOptionalText()
  summary?: string | null;

  @IsInterestList()
  interests?: string[];

  @IsOptionalNonNull()
  @IsIn(AVAILABILITY_STATUSES)
  availabilityStatus?: AvailabilityStatus;

  @IsOptionalNonNull()
  @IsInt()
  @Min(COLLABORATOR_WEEKLY_HOURS.min)
  @Max(COLLABORATOR_WEEKLY_HOURS.max)
  weeklyHours?: number;
}

/** RF17: dar de baja (o reactivar) a una persona. Inactiva no se recomienda ni se convoca. */
export class AdminPersonStatusDto {
  @IsBoolean({ message: 'active debe ser verdadero o falso' })
  active: boolean;
}
