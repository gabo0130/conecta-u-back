import { ValidateBy, type ValidationOptions } from 'class-validator';
import {
  PROFILE_URL_ERROR,
  isProfileUrl,
} from '../../../domain/entities/profile-url';

export function IsProfileUrl(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isProfileUrl',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isProfileUrl(value),
        defaultMessage: () => PROFILE_URL_ERROR,
      },
    },
    options,
  );
}
