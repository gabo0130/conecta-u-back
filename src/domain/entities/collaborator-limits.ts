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
