import { Inject, Injectable } from '@nestjs/common';
import type { UserRole } from '../../domain/entities/user-role.type';
import { APP_URL } from '../../shared/interfaces/tokens';
import { renderWelcomeEmail } from '../mail/welcome-email.template';
import { AccountMailer } from '../support/account-mailer';

export interface WelcomeRecipient {
  fullName: string;
  email: string;
  /** v2.2, E3: si la persona tiene correo alterno, la notificación también le llega ahí. */
  alternateEmail?: string | null;
  role: UserRole;
}

/**
 * Notifica por correo que la cuenta fue creada, al correo principal y al alterno si existe.
 * Nunca lanza: un fallo del proveedor de correo no debe deshacer un registro ya guardado.
 */
@Injectable()
export class SendWelcomeEmailUseCase {
  constructor(
    private readonly accountMailer: AccountMailer,
    @Inject(APP_URL) private readonly appUrl: string,
  ) {}

  execute(recipient: WelcomeRecipient): Promise<void> {
    return this.accountMailer.send(
      recipient,
      (toAlternate) =>
        renderWelcomeEmail({
          fullName: recipient.fullName,
          role: recipient.role,
          appUrl: this.appUrl,
          toAlternate,
        }),
      { purpose: 'bienvenida', role: recipient.role },
    );
  }
}
