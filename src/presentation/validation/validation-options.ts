import type { ValidationPipeOptions } from '@nestjs/common';
import { validationExceptionFactory } from './validation-exception.factory';

/** Reglas de validación de toda la API (también las usa `@FormBody`). */
export const VALIDATION_OPTIONS: ValidationPipeOptions = {
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  exceptionFactory: validationExceptionFactory,
};
