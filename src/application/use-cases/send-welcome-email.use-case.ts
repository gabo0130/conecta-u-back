import { Inject, Injectable } from '@nestjs/common';
import type { UserRole } from '../../domain/entities/user-role.type';
import type { MailSender } from '../../domain/repositories/mail-sender.interface';
import { APP_URL, MAIL_SENDER } from '../../shared/interfaces/tokens';
import { AppLoggerService } from '../../shared/logging/logger.service';
import { renderWelcomeEmail } from '../mail/welcome-email.template';

export interface WelcomeRecipient {
  fullName: string;
  email: string;
  role: UserRole;
}

/**
 * Notifica por correo que la cuenta fue creada. Nunca lanza: un fallo del proveedor de
 * correo no debe deshacer ni hacer fallar un registro que ya quedó guardado.
 */
@Injectable()
export class SendWelcomeEmailUseCase {
  private readonly logger: ReturnType<AppLoggerService['forContext']>;

  constructor(
    @Inject(MAIL_SENDER) private readonly mailSender: MailSender,
    @Inject(APP_URL) private readonly appUrl: string,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(SendWelcomeEmailUseCase.name);
  }

  async execute(recipient: WelcomeRecipient): Promise<void> {
    try {
      const { subject, html, text } = renderWelcomeEmail({
        fullName: recipient.fullName,
        role: recipient.role,
        appUrl: this.appUrl,
      });
      await this.mailSender.send({
        to: recipient.email,
        subject,
        html,
        text,
      });
      this.logger.info('Correo de bienvenida enviado', {
        method: 'execute',
        role: recipient.role,
      });
    } catch (error) {
      this.logger.error('No se pudo enviar el correo de bienvenida', error, {
        method: 'execute',
        role: recipient.role,
      });
    }
  }
}
