import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { ValidateBy, ValidateIf } from 'class-validator';
import {
  interestsError,
  normalizeInterests,
} from '../../../domain/entities/collaborator-limits';

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

/**
 * Intereses del perfil (tesis, T6): lista opcional de textos cortos. Se normaliza antes de
 * validar (recorte, sin vacíos ni repetidos) con la misma regla que la importación Excel.
 * `[]` borra los intereses; `null` no se admite.
 */
export function IsInterestList() {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      isStringList(value) ? normalizeInterests(value) : value,
    ),
    ValidateIf((_object, value) => value !== undefined),
    ValidateBy({
      name: 'isInterestList',
      validator: {
        validate: (value: unknown) =>
          isStringList(value) && interestsError(value) === null,
        defaultMessage: (args) =>
          isStringList(args?.value)
            ? interestsError(args.value)!
            : 'interests debe ser una lista de textos',
      },
    }),
  );
}
