import { NestFactory } from '@nestjs/core';
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './shared/exceptions/http-exception.filter';
import { AppLoggerService } from './shared/logging/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(AppLoggerService);
  app.useLogger(logger);
  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Conecta U API')
    .setDescription('API de Conecta U — Iteración 1 (RF1-RF11, RF23-RF24)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((origin) =>
    origin.trim(),
  );

  app.enableCors({
    origin: corsOrigin ?? true,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    }),
  );

  app.useGlobalFilters(
    new HttpExceptionFilter(logger.forContext(HttpExceptionFilter.name)),
  );

  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
