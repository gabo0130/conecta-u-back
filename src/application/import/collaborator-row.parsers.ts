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
import {
  PROFILE_URL_ERROR,
  isProfileUrl,
} from '../../domain/entities/profile-url';
import type { Level } from '../../domain/entities/level.type';
import type { PersonType } from '../../domain/entities/person-type.type';
import type { SkillCategory } from '../../domain/entities/skill-category.type';
import { SKILL_NAME_MAX_LENGTH } from '../../domain/entities/field-limits';
import type { SkillType } from '../../domain/entities/skill-type.type';
import {
  type TextLength,
  maxLengthError,
  requiredTextError,
} from '../../domain/entities/text-rules';
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

  const firstName = requiredCell(values, 'nombres', {
    max: PERSON_NAME_MAX_LENGTH,
  });
  if (!firstName.ok) return firstName;
  const lastName = requiredCell(values, 'apellidos', {
    max: PERSON_NAME_MAX_LENGTH,
  });
  if (!lastName.ok) return lastName;

  const personType = labelOf(
    PERSON_TYPE_LABELS,
    normalizeLabel(values.tipo_persona),
  );
  if (!personType) return reject('tipo_persona inválido');

  const program = requiredCell(values, 'programa');
  if (!program.ok) return program;

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

  const profileUrl = optionalTextOf(values.enlace);
  if (profileUrl && !isProfileUrl(profileUrl)) {
    return reject(`enlace inválido: ${PROFILE_URL_ERROR}`);
  }

  const researchGroup = optionalCell(
    values,
    'semillero_o_grupo',
    RESEARCH_GROUP_MAX_LENGTH,
  );
  if (!researchGroup.ok) return researchGroup;

  return {
    ok: true,
    value: {
      email,
      firstName: firstName.value,
      lastName: lastName.value,
      personType,
      program: program.value,
      semester,
      researchGroup: researchGroup.value,
      summary: optionalTextOf(values.resumen),
      profileUrl,
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
  const name = requiredCell(values, 'habilidad', {
    max: SKILL_NAME_MAX_LENGTH,
  });
  if (!name.ok) return name;

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
      name: name.value,
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

  const role = requiredCell(values, 'rol', {
    max: EXPERIENCE_ROLE_MAX_LENGTH,
  });
  if (!role.ok) return role;
  const organization = requiredCell(values, 'organizacion', {
    max: ORGANIZATION_MAX_LENGTH,
  });
  if (!organization.ok) return organization;

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

  const technologies = textOf(values.tecnologias)
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  // Cada tecnología puede proponerse como habilidad nueva: mismo límite que su nombre.
  const technologyError = technologies
    .map((name) => maxLengthError('tecnologias', name, SKILL_NAME_MAX_LENGTH))
    .find(Boolean);
  if (technologyError) return reject(technologyError);

  return {
    ok: true,
    value: {
      type,
      role: role.value,
      organization: organization.value,
      startDate,
      endDate,
      current,
      weeklyHours: weeklyHours!,
      level,
      technologies,
      description: optionalTextOf(values.descripcion),
    },
  };
}

/** Texto obligatorio de una columna, con la misma regla y mensaje que la API. */
function requiredCell(
  values: Row,
  column: string,
  length?: TextLength,
): ParseResult<string> {
  const text = textOf(values[column]);
  const error = requiredTextError(column, text, length);
  return error ? reject(error) : { ok: true, value: text };
}

/** Texto opcional de una columna: vacío es `null`. */
function optionalCell(
  values: Row,
  column: string,
  max?: number,
): ParseResult<string | null> {
  const text = optionalTextOf(values[column]);
  const error = text && maxLengthError(column, text, max);
  return error ? reject(error) : { ok: true, value: text };
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
