import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '../shared/exceptions/http-exception.filter';
import { AppLoggerService } from '../shared/logging/logger.service';
import { validationExceptionFactory } from './validation/validation-exception.factory';

/**
 * Lo que define el contrato HTTP de la API: prefijo `/api`, validación (422) y forma de los
 * errores. Lo usan `main.ts` y las pruebas de integración, para probar la misma app que se publica.
 */
export function configureApp(app: INestApplication): void {
  const logger = app.get(AppLoggerService);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(
    new HttpExceptionFilter(logger.forContext(HttpExceptionFilter.name)),
  );
}
