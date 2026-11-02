import { Inject, Injectable } from '@nestjs/common';
import { isSameEmail } from '../../domain/entities/person-identification';
import type { MailSender } from '../../domain/repositories/mail-sender.interface';
import { MAIL_SENDER } from '../../shared/interfaces/tokens';
import { AppLoggerService } from '../../shared/logging/logger.service';
import type { RenderedEmail } from '../mail/email-layout';

export interface AccountAddresses {
  email: string;
  /** v2.2, E3: las notificaciones de la cuenta también llegan al correo alterno. */
  alternateEmail?: string | null;
}

/**
 * Envía una notificación de la cuenta al correo principal y, si existe y es distinto, al
 * alterno. Un envío por destinatario: si uno falla, el otro sale igual. Nunca lanza; los fallos
 * quedan en el log sin la dirección (Ley 1581).
 */
@Injectable()
export class AccountMailer {
  private readonly logger: ReturnType<AppLoggerService['forContext']>;

  constructor(
    @Inject(MAIL_SENDER) private readonly mailSender: MailSender,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(AccountMailer.name);
  }

  async send(
    addresses: AccountAddresses,
    render: (toAlternate: boolean) => RenderedEmail,
    log: { purpose: string; [key: string]: unknown },
  ): Promise<void> {
    const targets = [{ to: addresses.email, toAlternate: false }];
    if (
      addresses.alternateEmail &&
      !isSameEmail(addresses.alternateEmail, addresses.email)
    ) {
      targets.push({ to: addresses.alternateEmail, toAlternate: true });
    }
    await Promise.all(
      targets.map(async ({ to, toAlternate }) => {
        const context = {
          method: 'send',
          ...log,
          kind: toAlternate ? 'alterno' : 'principal',
        };
        try {
          await this.mailSender.send({ to, ...render(toAlternate) });
          this.logger.info('Correo de la cuenta enviado', context);
        } catch (error) {
          this.logger.error(
            'No se pudo enviar el correo de la cuenta',
            error,
            context,
          );
        }
      }),
    );
  }
}
