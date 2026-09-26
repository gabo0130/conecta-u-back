/**
 * Fecha `YYYY-MM-DD` que existe en el calendario: rechaza `2024-02-30` o `1`,
 * que `Date.parse` y `isDateString` aceptan.
 */
export function isCalendarDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(text);
}
