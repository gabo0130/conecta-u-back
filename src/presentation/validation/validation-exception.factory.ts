import { UnprocessableEntityException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

const NON_NULL_CONSTRAINT = 'isNonNull';

/**
 * Convierte los errores de class-validator en un 422 con un mensaje por campo.
 * Si un campo llegó en `null`, se informa solo eso: los demás errores del campo
 * ("debe ser texto", "máximo 80 caracteres") son consecuencia del `null` y confunden.
 */
export function validationExceptionFactory(
  errors: ValidationError[],
): UnprocessableEntityException {
  return new UnprocessableEntityException({
    message: errors.flatMap((error) => messagesOf(error)),
  });
}

/** Los errores anidados llevan la ruta del padre, como en el ValidationPipe de Nest: "deliverables.0.name …". */
function messagesOf(error: ValidationError, parentPath = ''): string[] {
  const constraints = error.constraints ?? {};
  const own =
    NON_NULL_CONSTRAINT in constraints
      ? [constraints[NON_NULL_CONSTRAINT]]
      : Object.values(constraints);
  const childPath = `${parentPath}${error.property}.`;
  return [
    ...own.map((message) => `${parentPath}${message}`),
    ...(error.children ?? []).flatMap((child) => messagesOf(child, childPath)),
  ];
}
