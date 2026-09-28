// Texto libre que llega del usuario (formulario o plantilla Excel): una sola definición
// de "limpio" y de "obligatorio" para que la API y la importación decidan lo mismo.

export interface TextLength {
  readonly min?: number;
  readonly max?: number;
}

/** Quita los espacios de los extremos: `"  Ana "` y `"Ana"` son el mismo valor. */
export function normalizeText(value: string): string {
  return value.trim();
}

/** Motivo por el que un texto obligatorio ya normalizado no es válido, o `null`. */
export function requiredTextError(
  field: string,
  value: string,
  { min = 1, max }: TextLength = {},
): string | null {
  if (value.length === 0) return `${field} es obligatorio`;
  if (value.length < min) {
    return `${field} debe tener al menos ${min} caracteres`;
  }
  return maxLengthError(field, value, max);
}

/** Motivo por el que un texto supera su longitud máxima, o `null`. */
export function maxLengthError(
  field: string,
  value: string,
  max: number | undefined,
): string | null {
  return max !== undefined && value.length > max
    ? `${field} admite máximo ${max} caracteres`
    : null;
}
