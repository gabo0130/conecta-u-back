import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import type { ContextLogger } from '../logging/logger.service';

interface ErrorBody {
  statusCode: number;
  message: string;
}

// Red de seguridad: los casos de uso validan antes de escribir, pero si una restricción de
// Postgres salta igual, se responde con un 4xx entendible en vez de un 500 genérico.
const DATABASE_ERRORS: Record<string, ErrorBody> = {
  '23503': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'El registro referenciado no existe',
  },
  '23505': {
    statusCode: HttpStatus.CONFLICT,
    message: 'El registro ya existe',
  },
  '22P02': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Formato de dato inválido',
  },
  '22008': {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Fecha fuera de rango',
  },
};

const INTERNAL_ERROR: ErrorBody = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  message: 'Error interno del servidor',
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger?: ContextLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toErrorBody(exception);

    if (body.statusCode >= 500) {
      this.logger?.error('Error no controlado', exception, { method: 'catch' });
    } else if (!(exception instanceof HttpException)) {
      // Una restricción de BD que llegó hasta aquí delata una validación faltante en un caso de uso.
      this.logger?.warn('Error de base de datos traducido a 4xx', {
        method: 'catch',
        code: this.databaseCodeOf(exception),
      });
    }

    response.status(body.statusCode).json(body);
  }

  private toErrorBody(exception: unknown): ErrorBody {
    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        message: this.messageOf(exception),
      };
    }
    return DATABASE_ERRORS[this.databaseCodeOf(exception)] ?? INTERNAL_ERROR;
  }

  private messageOf(exception: HttpException): string {
    const exceptionResponse = exception.getResponse();
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : typeof exceptionResponse === 'object' &&
            exceptionResponse !== null &&
            'message' in exceptionResponse
          ? (exceptionResponse as { message: string | string[] }).message
          : exception.message;
    return Array.isArray(message) ? message[0] : message;
  }

  /** `QueryFailedError` de TypeORM copia el `code` del driver de Postgres. */
  private databaseCodeOf(exception: unknown): string {
    if (typeof exception === 'object' && exception !== null) {
      const { code } = exception as { code?: unknown };
      return typeof code === 'string' ? code : '';
    }
    return '';
  }
}
