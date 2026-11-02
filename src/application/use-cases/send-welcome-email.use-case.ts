import { Inject, Injectable } from '@nestjs/common';
import type { UserRole } from '../../domain/entities/user-role.type';
import type { MailSender } from '../../domain/repositories/mail-sender.interface';
import { APP_URL, MAIL_SENDER } from '../../shared/interfaces/tokens';
import { AppLoggerService } from '../../shared/logging/logger.service';
import { renderWelcomeEmail } from '../mail/welcome-email.template';
import { isSameEmail } from '../../domain/entities/person-identification';

export interface WelcomeRecipient {
  fullName: string;
  email: string;
  /** v2.2, E3: si la persona tiene correo alterno, la notificación también le llega ahí. */
  alternateEmail?: string | null;
  role: UserRole;
}

/**
 * Notifica por correo que la cuenta fue creada, al correo principal y al alterno si existe.
 * Un envío por destinatario: si uno falla, el otro sale igual. Nunca lanza: un fallo del
 * proveedor de correo no debe deshacer ni hacer fallar un registro que ya quedó guardado.
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
    const { subject, html, text } = renderWelcomeEmail({
      fullName: recipient.fullName,
      role: recipient.role,
      appUrl: this.appUrl,
    });
    const addresses: { to: string; kind: 'principal' | 'alterno' }[] = [
      { to: recipient.email, kind: 'principal' },
    ];
    if (
      recipient.alternateEmail &&
      !isSameEmail(recipient.alternateEmail, recipient.email)
    ) {
      addresses.push({ to: recipient.alternateEmail, kind: 'alterno' });
    }

    await Promise.all(
      addresses.map(async ({ to, kind }) => {
        // El log dice a qué correo (principal o alterno), nunca la dirección (Ley 1581).
        const context = { method: 'execute', role: recipient.role, kind };
        try {
          await this.mailSender.send({ to, subject, html, text });
          this.logger.info('Correo de bienvenida enviado', context);
        } catch (error) {
          this.logger.error(
            'No se pudo enviar el correo de bienvenida',
            error,
            context,
          );
        }
      }),
    );
  }
}
