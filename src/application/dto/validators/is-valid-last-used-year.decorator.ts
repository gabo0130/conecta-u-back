import { ValidateBy, type ValidationOptions } from 'class-validator';
import {
  MIN_LAST_USED_YEAR,
  isValidLastUsedYear,
} from '../../../domain/entities/collaborator-limits';

export function IsValidLastUsedYear(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isValidLastUsedYear',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'number' && isValidLastUsedYear(value),
        defaultMessage: () =>
          `El año de último uso debe estar entre ${MIN_LAST_USED_YEAR} y el año en curso`,
      },
    },
    options,
  );
}
