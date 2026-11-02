// Rangos del perfil técnico (RF3–RF5). Única fuente para los DTO de la API y la importación Excel.

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
export const PROFILE_URL_MAX_LENGTH = 300;

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

// Tesis (D5, T6): intereses del perfil, texto corto y libre ("IA aplicada a la salud").
export const INTERESTS_MAX = 10;
export const INTEREST_LENGTH = { min: 2, max: 60 } as const;

/** Recorta, quita vacíos y repetidos (sin distinguir mayúsculas ni tildes), en el orden dado. */
export function normalizeInterests(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const value = raw.trim().replace(/\s+/g, ' ');
    const key = value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

/** Motivo por el que una lista ya normalizada no es válida, o `null`. */
export function interestsError(values: readonly string[]): string | null {
  if (values.length > INTERESTS_MAX) {
    return `Puedes registrar hasta ${INTERESTS_MAX} intereses`;
  }
  const invalid = values.find(
    (value) =>
      value.length < INTEREST_LENGTH.min || value.length > INTEREST_LENGTH.max,
  );
  return invalid === undefined
    ? null
    : `Cada interés debe tener entre ${INTEREST_LENGTH.min} y ${INTEREST_LENGTH.max} caracteres`;
}
