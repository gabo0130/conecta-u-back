import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';
import type { Response } from 'express';
import { CERTIFICATE_MAX_SIZE_MB } from '../../domain/entities/experience-certificate';

/** El 413 de Multer llega en inglés; se responde en español con el límite del certificado. */
@Catch(PayloadTooLargeException)
export class CertificateTooLargeFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.PAYLOAD_TOO_LARGE)
      .json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: `El certificado supera el tamaño máximo permitido (${CERTIFICATE_MAX_SIZE_MB} MB)`,
      });
  }
}
