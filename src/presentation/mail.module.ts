import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountMailer } from '../application/support/account-mailer';
import { SendWelcomeEmailUseCase } from '../application/use-cases/send-welcome-email.use-case';
import { GmailApiMailSender } from '../infrastructure/mail/gmail-api-mail-sender';
import { LogOnlyMailSender } from '../infrastructure/mail/log-only-mail-sender';
import { SmtpMailSender } from '../infrastructure/mail/smtp-mail-sender';
import { APP_URL, MAIL_SENDER } from '../shared/interfaces/tokens';
import { AppLoggerService } from '../shared/logging/logger.service';

const DEFAULT_APP_URL = 'http://localhost:3000';
const DEFAULT_SMTP_PORT = 587;

const GMAIL_REQUIRED = [
  'GMAIL_CLIENT_ID',
  'GMAIL_CLIENT_SECRET',
  'GMAIL_REFRESH_TOKEN',
  'MAIL_FROM',
] as const;

/** `MAIL_PROVIDER=gmail-api`: envío por la API de Gmail (HTTPS), sin puertos SMTP. */
export function createGmailApiSender(
  config: ConfigService,
): GmailApiMailSender {
  const missing = GMAIL_REQUIRED.filter((name) => !config.get<string>(name));
  if (missing.length > 0) {
    throw new Error(
      `MAIL_PROVIDER=gmail-api requiere las variables: ${missing.join(', ')}`,
    );
  }
  return new GmailApiMailSender({
    clientId: config.get<string>('GMAIL_CLIENT_ID')!,
    clientSecret: config.get<string>('GMAIL_CLIENT_SECRET')!,
    refreshToken: config.get<string>('GMAIL_REFRESH_TOKEN')!,
    from: config.get<string>('MAIL_FROM')!,
  });
}

/**
 * Correo transaccional (cuenta creada, recuperación de contraseña, convocatorias). Con
 * `MAIL_PROVIDER=gmail-api` se envía por la API de Gmail; con `SMTP_HOST` por SMTP (también
 * Gmail: smtp.gmail.com con una contraseña de aplicación); sin ninguno, solo queda el aviso en el log.
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
        if (config.get<string>('MAIL_PROVIDER') === 'gmail-api') {
          return createGmailApiSender(config);
        }
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
    AccountMailer,
    SendWelcomeEmailUseCase,
  ],
  exports: [SendWelcomeEmailUseCase, AccountMailer, MAIL_SENDER, APP_URL],
})
export class MailModule {}
