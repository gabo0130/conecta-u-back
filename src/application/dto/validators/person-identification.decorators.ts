import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { ValidateBy } from 'class-validator';
import {
  INSTITUTIONAL_CODE_ERROR,
  PHONE_ERROR,
  documentNumberError,
  isDocumentType,
  isValidInstitutionalCode,
  isValidPhone,
  normalizeDocumentNumber,
  normalizePhone,
} from '../../../domain/entities/person-identification';

const normalized = (normalize: (value: string) => string) =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? normalize(value) : value,
  );

/**
 * Número de documento: se normaliza (sin puntos, espacios ni guiones) y se valida según el
 * `documentType` del mismo objeto. Si el tipo es inválido, lo informa su propio validador.
 */
export function IsDocumentNumber() {
  return applyDecorators(
    normalized(normalizeDocumentNumber),
    ValidateBy({
      name: 'isDocumentNumber',
      validator: {
        validate: (value: unknown, args) => {
          const type = (args?.object as { documentType?: unknown })
            .documentType;
          if (typeof value !== 'string') return false;
          return !isDocumentType(type) || !documentNumberError(type, value);
        },
        defaultMessage: (args) => {
          const type = (args?.object as { documentType?: unknown })
            .documentType;
          return typeof args?.value === 'string' && isDocumentType(type)
            ? documentNumberError(type, args.value)!
            : 'El número de documento es obligatorio';
        },
      },
    }),
  );
}

/** Teléfono: se quitan espacios, guiones, puntos y paréntesis antes de validar. */
export function IsPhone() {
  return applyDecorators(
    normalized(normalizePhone),
    ValidateBy({
      name: 'isPhone',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' && isValidPhone(value),
        defaultMessage: () => PHONE_ERROR,
      },
    }),
  );
}

export function IsInstitutionalCode() {
  return ValidateBy({
    name: 'isInstitutionalCode',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' && isValidInstitutionalCode(value),
      defaultMessage: () => INSTITUTIONAL_CODE_ERROR,
    },
  });
}
