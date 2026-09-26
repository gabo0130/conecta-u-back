// Rangos del perfil técnico (RF4–RF6). Única fuente para los DTO de la API y la importación Excel.

export interface NumericRange {
  readonly min: number;
  readonly max: number;
}

export const COLLABORATOR_WEEKLY_HOURS: NumericRange = { min: 0, max: 60 };
export const EXPERIENCE_WEEKLY_HOURS: NumericRange = { min: 1, max: 60 };
export const SKILL_EXPERIENCE_MONTHS: NumericRange = { min: 0, max: 600 };
export const SEMESTER: NumericRange = { min: 1, max: 12 };
export const MIN_LAST_USED_YEAR = 1970;

// Longitudes máximas: coinciden con las columnas de `collaborators` y `experiences`.
export const PERSON_NAME_MAX_LENGTH = 80;
export const RESEARCH_GROUP_MAX_LENGTH = 160;
export const EXPERIENCE_ROLE_MAX_LENGTH = 120;
export const ORGANIZATION_MAX_LENGTH = 160;

export function isIntegerInRange(value: number, range: NumericRange): boolean {
  return Number.isInteger(value) && value >= range.min && value <= range.max;
}

/** Año de último uso de una habilidad: entero entre 1970 y el año en curso. */
export function isValidLastUsedYear(year: number, now = new Date()): boolean {
  return isIntegerInRange(year, {
    min: MIN_LAST_USED_YEAR,
    max: now.getUTCFullYear(),
  });
}
