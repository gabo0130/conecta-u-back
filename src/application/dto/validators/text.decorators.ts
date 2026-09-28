import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsOptional, ValidateBy } from 'class-validator';
import {
  type TextLength,
  maxLengthError,
  normalizeText,
  requiredTextError,
} from '../../../domain/entities/text-rules';

const trimmed = (value: unknown) =>
  typeof value === 'string' ? normalizeText(value) : value;

/**
 * Texto obligatorio: se recorta antes de validar, así `"   "` cuenta como vacío igual que
 * en la importación Excel, y el caso de uso recibe el valor ya limpio.
 */
export function IsRequiredText(length: TextLength = {}) {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) => trimmed(value)),
    ValidateBy({
      name: 'isRequiredText',
      validator: {
        validate: (value: unknown, args) =>
          typeof value === 'string' &&
          requiredTextError(args?.property ?? '', value, length) === null,
        defaultMessage: (args) => {
          const field = args?.property ?? 'El campo';
          return typeof args?.value === 'string'
            ? requiredTextError(field, args.value, length)!
            : args?.value === undefined || args?.value === null
              ? `${field} es obligatorio`
              : `${field} debe ser texto`;
        },
      },
    }),
  );
}

/** Texto opcional que se puede vaciar: `""` o solo espacios se guardan como `null`. */
export function IsOptionalText(max?: number) {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) => {
      const text = trimmed(value);
      return text === '' ? null : text;
    }),
    IsOptional(),
    ValidateBy({
      name: 'isOptionalText',
      validator: {
        validate: (value: unknown, args) =>
          typeof value === 'string' &&
          maxLengthError(args?.property ?? '', value, max) === null,
        defaultMessage: (args) => {
          const field = args?.property ?? 'El campo';
          return typeof args?.value === 'string'
            ? maxLengthError(field, args.value, max)!
            : `${field} debe ser texto`;
        },
      },
    }),
  );
}
