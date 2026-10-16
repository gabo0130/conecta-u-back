import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type {
  MailMessage,
  MailSender,
} from '../../domain/repositories/mail-sender.interface';

export interface SmtpMailConfig {
  host: string;
  port: number;
  /** `true` para TLS directo (puerto 465); `false` usa STARTTLS si el servidor lo ofrece (587). */
  secure: boolean;
  user?: string;
  pass?: string;
  /** Remitente, p. ej. `Conecta U <no-reply@conectau.edu.co>`. */
  from: string;
}

/** Adaptador SMTP (nodemailer) del puerto `MailSender`. */
export class SmtpMailSender implements MailSender {
  private readonly transporter: Transporter;

  constructor(
    private readonly config: SmtpMailConfig,
    // Se puede inyectar para probar sin red.
    transporter?: Transporter,
  ) {
    this.transporter =
      transporter ??
      nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth:
          config.user && config.pass
            ? { user: config.user, pass: config.pass }
            : undefined,
      });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}
