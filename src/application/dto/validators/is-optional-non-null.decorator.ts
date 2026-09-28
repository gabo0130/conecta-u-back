import { applyDecorators } from '@nestjs/common';
import { ValidateBy, ValidateIf } from 'class-validator';

/**
 * Campo opcional que, si llega, no puede ser `null`. `@IsOptional()` deja pasar `null`,
 * y en una columna NOT NULL eso termina en un 500 o, en un id, en una búsqueda que
 * TypeORM ignora. Usar `@IsOptional()` solo donde `null` significa "vaciar el campo".
 */
export function IsOptionalNonNull() {
  return applyDecorators(
    ValidateIf((_object, value) => value !== undefined),
    ValidateBy({
      name: 'isNonNull',
      validator: {
        validate: (value: unknown) => value !== null,
        defaultMessage: (args) =>
          `${args?.property ?? 'El campo'} no puede ser nulo`,
      },
    }),
  );
}
