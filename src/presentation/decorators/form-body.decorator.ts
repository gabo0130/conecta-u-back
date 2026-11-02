import {
  BadRequestException,
  createParamDecorator,
  type ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { VALIDATION_OPTIONS } from '../validation/validation-options';

const INVALID_DATA = 'El campo data debe ser un JSON válido';

/**
 * Cuerpo que llega como JSON o como `multipart/form-data` con el JSON en el campo `data`
 * (cuando viaja junto a un archivo). En ambos casos se valida con el DTO del parámetro.
 */
const extractFormBody = createParamDecorator(
  (_data: unknown, context: ExecutionContext): unknown => {
    const body = context.switchToHttp().getRequest<Request>().body as unknown;
    const data = (body as { data?: unknown } | undefined)?.data;
    if (typeof data !== 'string') return body;
    try {
      return JSON.parse(data) as unknown;
    } catch {
      throw new BadRequestException({ message: INVALID_DATA });
    }
  },
);

export const FormBody = (): ParameterDecorator =>
  extractFormBody(undefined, new ValidationPipe(VALIDATION_OPTIONS));
