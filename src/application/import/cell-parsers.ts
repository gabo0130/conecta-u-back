import { isCalendarDate } from '../../domain/entities/calendar-date';
import type { CellValue } from '../../domain/repositories/collaborator-workbook.interface';

// Conversión de celdas del Excel a tipos del dominio. `null` significa "vacía o inválida".

export function textOf(value: CellValue): string {
  if (value === null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

export function optionalTextOf(value: CellValue): string | null {
  return textOf(value) || null;
}

export function emailOf(value: CellValue): string {
  return textOf(value).toLowerCase();
}

export function integerOf(value: CellValue): number | null {
  const text = textOf(value);
  if (text === '') return null;
  const number = Number(text);
  return Number.isInteger(number) ? number : null;
}

/** Fecha `YYYY-MM-DD`; Excel entrega las fechas como `Date` en UTC. */
export function dateOf(value: CellValue): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = textOf(value);
  return isCalendarDate(text) ? text : null;
}

export function labelOf<T>(
  labels: Record<string, T>,
  key: string,
): T | undefined {
  return Object.prototype.hasOwnProperty.call(labels, key)
    ? labels[key]
    : undefined;
}
