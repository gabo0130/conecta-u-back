import { IsIn, IsOptional, IsUUID } from 'class-validator';
import {
  PERSON_TYPES,
  type PersonType,
} from '../../domain/entities/person-type.type';
import { IsCalendarDate } from './validators/is-calendar-date.decorator';

const DATE_MESSAGE = 'debe ser una fecha válida con formato AAAA-MM-DD';

/** Filtros del dashboard del ADMIN (HU-14, RF15). Todos opcionales y combinables. */
export class StatsQueryDto {
  /** Proyectos registrados desde este día (incluido). */
  @IsOptional()
  @IsCalendarDate({ message: `from ${DATE_MESSAGE}` })
  from?: string;

  /** Proyectos registrados hasta este día (incluido). */
  @IsOptional()
  @IsCalendarDate({ message: `to ${DATE_MESSAGE}` })
  to?: string;

  @IsOptional()
  @IsUUID('all', { message: 'projectTypeId no es válido' })
  projectTypeId?: string;

  @IsOptional()
  @IsUUID('all', { message: 'categoryId no es válido' })
  categoryId?: string;

  @IsOptional()
  @IsUUID('all', { message: 'programId no es válido' })
  programId?: string;

  @IsOptional()
  @IsIn(PERSON_TYPES, { message: 'personType debe ser ESTUDIANTE o DOCENTE' })
  personType?: PersonType;
}
