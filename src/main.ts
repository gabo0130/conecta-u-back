import type { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './presentation/configure-app';
import { AppLoggerService } from './shared/logging/logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(AppLoggerService));
  // Detrás del proxy de Render, `request.ip` debe ser la IP del cliente (límite por IP).
  if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);
  }
  configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Conecta U API')
    .setDescription(
      'API de Conecta U — Iteraciones 1 y 2 (requisitos con la numeración v2.2)',
    )
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

  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
