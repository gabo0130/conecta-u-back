import { ValidateBy, type ValidationOptions } from 'class-validator';
import { isCalendarDate } from '../../../domain/entities/calendar-date';

export function IsCalendarDate(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isCalendarDate',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isCalendarDate(value),
        defaultMessage: (args) =>
          `${args?.property ?? 'La fecha'} debe ser una fecha válida con formato AAAA-MM-DD`,
      },
    },
    options,
  );
}
