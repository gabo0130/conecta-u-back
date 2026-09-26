export interface ExperiencePeriod {
  startDate: string;
  endDate: string | null;
  current: boolean;
}

/** Devuelve el motivo por el que el periodo no es válido, o `null` si lo es. */
export function experiencePeriodError(period: ExperiencePeriod): string | null {
  if (period.current && period.endDate) {
    return 'Una experiencia actual no debe tener fecha de fin';
  }
  if (period.endDate && period.endDate < period.startDate) {
    return 'La fecha de fin no puede ser anterior a la fecha de inicio';
  }
  return null;
}
