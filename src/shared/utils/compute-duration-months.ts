/**
 * Meses completos entre dos fechas `YYYY-MM-DD` (o hasta hoy si no hay fin).
 * Usa UTC: `new Date('2024-01-01')` es medianoche UTC y en hora local de Colombia
 * caería el 31/12 del año anterior.
 */
export function computeDurationMonths(
  startDate: string,
  endDate: string | null,
  now = new Date(),
): number {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : now;
  const monthChanges =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth());
  // Del 31/01 al 01/02 cambia el mes pero no se completó ninguno.
  const incompleteMonth = end.getUTCDate() < start.getUTCDate() ? 1 : 0;
  return Math.max(monthChanges - incompleteMonth, 0);
}
