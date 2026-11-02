import { IsIn, IsOptional, IsUUID, Matches } from 'class-validator';
import {
  PERSON_TYPES,
  type PersonType,
} from '../../domain/entities/person-type.type';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = 'debe tener el formato AAAA-MM-DD';

/** Filtros del dashboard del ADMIN (HU-14, RF15). Todos opcionales y combinables. */
export class StatsQueryDto {
  /** Proyectos registrados desde este día (incluido). */
  @IsOptional()
  @Matches(ISO_DATE, { message: `from ${DATE_MESSAGE}` })
  from?: string;

  /** Proyectos registrados hasta este día (incluido). */
  @IsOptional()
  @Matches(ISO_DATE, { message: `to ${DATE_MESSAGE}` })
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
