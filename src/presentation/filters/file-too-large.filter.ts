import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Response } from 'express';
import { MAX_IMPORT_FILE_SIZE_MB } from '../../shared/constants/import-collaborators.constants';

/** Multer corta la subida al pasar el límite con un 413 en inglés; aquí se responde en español. */
@Catch(PayloadTooLargeException)
export class FileTooLargeFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.PAYLOAD_TOO_LARGE)
      .json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: `El archivo supera el tamaño máximo permitido (${MAX_IMPORT_FILE_SIZE_MB} MB)`,
      });
  }
}
