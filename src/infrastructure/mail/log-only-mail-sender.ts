import type {
  MailMessage,
  MailSender,
} from '../../domain/repositories/mail-sender.interface';
import type { ContextLogger } from '../../shared/logging/logger.service';

/**
 * Se usa cuando no hay SMTP configurado (desarrollo local): no entrega nada, pero deja
 * constancia en el log de a quién y con qué asunto se habría enviado.
 */
export class LogOnlyMailSender implements MailSender {
  constructor(private readonly logger: ContextLogger) {}

  send(message: MailMessage): Promise<void> {
    this.logger.warn('SMTP no configurado: el correo no se envió', {
      method: 'send',
      to: message.to,
      subject: message.subject,
    });
    return Promise.resolve();
  }
}
