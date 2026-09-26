import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import type { ContextLogger } from '../logging/logger.service';

describe('HttpExceptionFilter', () => {
  const logger: jest.Mocked<Pick<ContextLogger, 'error' | 'warn'>> = {
    error: jest.fn(),
    warn: jest.fn(),
  };
  const filter = new HttpExceptionFilter(logger as unknown as ContextLogger);

  const respond = (exception: unknown) => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = {
      switchToHttp: () => ({ getResponse: () => response }),
    } as unknown as ArgumentsHost;
    filter.catch(exception, host);
    return response;
  };

  beforeEach(() => jest.clearAllMocks());

  it('sends the first message of an HttpException with its status', () => {
    const response = respond(
      new BadRequestException({ message: ['campo inválido', 'otro'] }),
    );

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'campo inválido',
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('supports string exception responses', () => {
    const response = respond(new BadRequestException('texto plano'));

    expect(response.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'texto plano',
    });
  });

  it.each([
    ['23503', 400, 'El registro referenciado no existe'],
    ['23505', 409, 'El registro ya existe'],
    ['22P02', 400, 'Formato de dato inválido'],
    ['22008', 400, 'Fecha fuera de rango'],
  ])(
    'translates Postgres error %s into %i and warns about it',
    (code, statusCode, message) => {
      const response = respond(
        Object.assign(new Error('query failed'), { code }),
      );

      expect(response.json).toHaveBeenCalledWith({ statusCode, message });
      expect(logger.warn).toHaveBeenCalledWith(
        'Error de base de datos traducido a 4xx',
        expect.objectContaining({ code }),
      );
    },
  );

  it('answers unknown errors with a generic 500 and logs them', () => {
    const error = new Error('boom');
    const response = respond(error);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Error interno del servidor',
    });
    expect(logger.error).toHaveBeenCalledWith(
      'Error no controlado',
      error,
      expect.anything(),
    );
  });

  it('handles non-object throwables', () => {
    expect(respond('boom').status).toHaveBeenCalledWith(500);
  });
});
