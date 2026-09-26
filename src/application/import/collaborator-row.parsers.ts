import { isEmail } from 'class-validator';
import type { AvailabilityStatus } from '../../domain/entities/availability-status.type';
import {
  COLLABORATOR_WEEKLY_HOURS,
  EXPERIENCE_ROLE_MAX_LENGTH,
  EXPERIENCE_WEEKLY_HOURS,
  ORGANIZATION_MAX_LENGTH,
  PERSON_NAME_MAX_LENGTH,
  RESEARCH_GROUP_MAX_LENGTH,
  SEMESTER,
  SKILL_EXPERIENCE_MONTHS,
  isIntegerInRange,
  isValidLastUsedYear,
} from '../../domain/entities/collaborator-limits';
import type { ExperienceType } from '../../domain/entities/experience-type.type';
import { experiencePeriodError } from '../../domain/entities/experience-period';
import type { Level } from '../../domain/entities/level.type';
import type { PersonType } from '../../domain/entities/person-type.type';
import type { SkillCategory } from '../../domain/entities/skill-category.type';
import type { SkillType } from '../../domain/entities/skill-type.type';
import type { CellValue } from '../../domain/repositories/collaborator-workbook.interface';
import {
  AVAILABILITY_LABELS,
  EXPERIENCE_TYPE_LABELS,
  LEVEL_LABELS,
  PERSON_TYPE_LABELS,
  SKILL_CATEGORY_LABELS,
  SKILL_TYPE_LABELS,
  YES_LABELS,
  normalizeLabel,
} from '../../shared/constants/import-collaborators.constants';
import {
  dateOf,
  emailOf,
  integerOf,
  labelOf,
  optionalTextOf,
  textOf,
} from './cell-parsers';

// Una función por hoja de la plantilla: convierte la fila en datos del dominio o
// devuelve el motivo del rechazo (RF24). No acceden a la base de datos.

export type ParseResult<T> =
  { ok: true; value: T } | { ok: false; reason: string };

type Row = Record<string, CellValue>;

const reject = (reason: string): { ok: false; reason: string } => ({
  ok: false,
  reason,
});

export interface ParsedCollaborator {
  email: string;
  firstName: string;
  lastName: string;
  personType: PersonType;
  program: string;
  semester: number | null;
  researchGroup: string | null;
  summary: string | null;
  profileUrl: string | null;
  availabilityStatus: AvailabilityStatus;
  weeklyHours: number;
}

export function parseCollaboratorRow(
  values: Row,
): ParseResult<ParsedCollaborator> {
  const email = emailOf(values.correo);
  if (!email) return reject('Correo obligatorio');
  if (!isEmail(email)) return reject('Correo inválido');

  const firstName = textOf(values.nombres);
  const lastName = textOf(values.apellidos);
  if (!firstName || !lastName) {
    return reject('Nombres y apellidos son obligatorios');
  }
  if (
    firstName.length > PERSON_NAME_MAX_LENGTH ||
    lastName.length > PERSON_NAME_MAX_LENGTH
  ) {
    return reject(
      `Nombres y apellidos admiten máximo ${PERSON_NAME_MAX_LENGTH} caracteres`,
    );
  }

  const personType = labelOf(
    PERSON_TYPE_LABELS,
    normalizeLabel(values.tipo_persona),
  );
  if (!personType) return reject('tipo_persona inválido');

  const program = textOf(values.programa);
  if (!program) return reject('Programa obligatorio');

  const semester = integerOf(values.semestre);
  if (textOf(values.semestre) && !isInRange(semester, SEMESTER)) {
    return reject(`semestre debe ser un entero entre ${rangeText(SEMESTER)}`);
  }

  const availabilityStatus = labelOf(
    AVAILABILITY_LABELS,
    normalizeLabel(values.disponibilidad),
  );
  if (!availabilityStatus) return reject('disponibilidad inválida');

  const weeklyHours = integerOf(values.horas_semana);
  if (!isInRange(weeklyHours, COLLABORATOR_WEEKLY_HOURS)) {
    return reject(
      `horas_semana debe ser un entero entre ${rangeText(COLLABORATOR_WEEKLY_HOURS)}`,
    );
  }

  if (!YES_LABELS.has(normalizeLabel(values.autoriza_datos))) {
    return reject('Debe autorizar el tratamiento de datos');
  }

  const researchGroup = optionalTextOf(values.semillero_o_grupo);
  if (researchGroup && researchGroup.length > RESEARCH_GROUP_MAX_LENGTH) {
    return reject(
      `semillero_o_grupo admite máximo ${RESEARCH_GROUP_MAX_LENGTH} caracteres`,
    );
  }

  return {
    ok: true,
    value: {
      email,
      firstName,
      lastName,
      personType,
      program,
      semester,
      researchGroup,
      summary: optionalTextOf(values.resumen),
      profileUrl: optionalTextOf(values.enlace),
      availabilityStatus,
      weeklyHours: weeklyHours!,
    },
  };
}

export interface ParsedSkill {
  name: string;
  type: SkillType;
  /** Categoría para proponerla si la habilidad no existe en el catálogo. */
  category: SkillCategory | undefined;
  level: Level;
  experienceMonths: number;
  lastUsedYear: number | null;
}

export function parseSkillRow(values: Row): ParseResult<ParsedSkill> {
  const name = textOf(values.habilidad);
  if (!name) return reject('habilidad obligatoria');

  const type = labelOf(SKILL_TYPE_LABELS, normalizeLabel(values.tipo));
  if (!type) return reject('tipo de habilidad inválido');

  const category = labelOf(
    SKILL_CATEGORY_LABELS,
    normalizeLabel(values.categoria),
  );
  if (textOf(values.categoria) && !category) {
    return reject('categoria inválida');
  }

  const level = labelOf(LEVEL_LABELS, normalizeLabel(values.nivel));
  if (!level) return reject('nivel inválido');

  const experienceMonths = integerOf(values.meses_experiencia);
  if (!isInRange(experienceMonths, SKILL_EXPERIENCE_MONTHS)) {
    return reject(
      `meses_experiencia debe ser un entero entre ${rangeText(SKILL_EXPERIENCE_MONTHS)}`,
    );
  }

  const lastUsedYear = integerOf(values.ultimo_uso);
  if (
    textOf(values.ultimo_uso) &&
    (lastUsedYear === null || !isValidLastUsedYear(lastUsedYear))
  ) {
    return reject('ultimo_uso debe ser un año entre 1970 y el año en curso');
  }

  return {
    ok: true,
    value: {
      name,
      type,
      category,
      level,
      experienceMonths: experienceMonths!,
      lastUsedYear,
    },
  };
}

export interface ParsedExperience {
  type: ExperienceType;
  role: string;
  organization: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  weeklyHours: number;
  level: Level;
  technologies: string[];
  description: string | null;
}

export function parseExperienceRow(values: Row): ParseResult<ParsedExperience> {
  const type = labelOf(EXPERIENCE_TYPE_LABELS, normalizeLabel(values.tipo));
  if (!type) return reject('tipo de experiencia inválido');

  const role = textOf(values.rol);
  const organization = textOf(values.organizacion);
  if (!role || !organization) {
    return reject('rol y organización son obligatorios');
  }
  if (
    role.length > EXPERIENCE_ROLE_MAX_LENGTH ||
    organization.length > ORGANIZATION_MAX_LENGTH
  ) {
    return reject(
      `rol admite ${EXPERIENCE_ROLE_MAX_LENGTH} caracteres y organización ${ORGANIZATION_MAX_LENGTH}`,
    );
  }

  const startDate = dateOf(values.fecha_inicio);
  if (!startDate) return reject('fecha_inicio inválida (formato AAAA-MM-DD)');

  const endDate = dateOf(values.fecha_fin);
  if (textOf(values.fecha_fin) && !endDate) {
    return reject('fecha_fin inválida (formato AAAA-MM-DD)');
  }

  const current = YES_LABELS.has(normalizeLabel(values.actual));
  const periodError = experiencePeriodError({ startDate, endDate, current });
  if (periodError) return reject(periodError);

  const weeklyHours = integerOf(values.horas_semana);
  if (!isInRange(weeklyHours, EXPERIENCE_WEEKLY_HOURS)) {
    return reject(
      `horas_semana debe ser un entero entre ${rangeText(EXPERIENCE_WEEKLY_HOURS)}`,
    );
  }

  const level = labelOf(LEVEL_LABELS, normalizeLabel(values.nivel));
  if (!level) return reject('nivel inválido');

  return {
    ok: true,
    value: {
      type,
      role,
      organization,
      startDate,
      endDate,
      current,
      weeklyHours: weeklyHours!,
      level,
      technologies: textOf(values.tecnologias)
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean),
      description: optionalTextOf(values.descripcion),
    },
  };
}

function isInRange(
  value: number | null,
  range: { min: number; max: number },
): boolean {
  return value !== null && isIntegerInRange(value, range);
}

function rangeText(range: { min: number; max: number }): string {
  return `${range.min} y ${range.max}`;
}
