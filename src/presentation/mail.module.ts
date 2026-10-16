import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendWelcomeEmailUseCase } from '../application/use-cases/send-welcome-email.use-case';
import { LogOnlyMailSender } from '../infrastructure/mail/log-only-mail-sender';
import { SmtpMailSender } from '../infrastructure/mail/smtp-mail-sender';
import { APP_URL, MAIL_SENDER } from '../shared/interfaces/tokens';
import { AppLoggerService } from '../shared/logging/logger.service';

const DEFAULT_APP_URL = 'http://localhost:3000';
const DEFAULT_SMTP_PORT = 587;

/**
 * Correo transaccional (notificación de cuenta creada). Con `SMTP_HOST` definido se envía
 * por SMTP; sin él, el sistema funciona igual y solo deja el aviso en el log.
 */
@Module({
  providers: [
    {
      provide: APP_URL,
      inject: [ConfigService],
      useFactory: (config: ConfigService): string =>
        config.get<string>('APP_URL') ?? DEFAULT_APP_URL,
    },
    {
      provide: MAIL_SENDER,
      inject: [ConfigService, AppLoggerService],
      useFactory: (config: ConfigService, appLogger: AppLoggerService) => {
        const host = config.get<string>('SMTP_HOST');
        if (!host) {
          return new LogOnlyMailSender(appLogger.forContext('MailSender'));
        }
        const port =
          Number(config.get<string>('SMTP_PORT')) || DEFAULT_SMTP_PORT;
        const user = config.get<string>('SMTP_USER');
        return new SmtpMailSender({
          host,
          port,
          secure:
            config.get<string>('SMTP_SECURE') !== undefined
              ? config.get<string>('SMTP_SECURE') === 'true'
              : port === 465,
          user,
          pass: config.get<string>('SMTP_PASS'),
          from:
            config.get<string>('MAIL_FROM') ?? user ?? 'no-reply@conectau.test',
        });
      },
    },
    SendWelcomeEmailUseCase,
  ],
  exports: [SendWelcomeEmailUseCase],
})
export class MailModule {}
