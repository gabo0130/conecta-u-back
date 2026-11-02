import * as nodemailer from 'nodemailer';
import type {
  MailMessage,
  MailSender,
} from '../../domain/repositories/mail-sender.interface';

export interface GmailApiConfig {
  clientId: string;
  clientSecret: string;
  /** Token de actualización OAuth de la cuenta de Gmail que envía (alcance gmail.send). */
  refreshToken: string;
  /** Remitente; debe ser la cuenta autorizada o un alias verificado de ella. */
  from: string;
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
// Se renueva un minuto antes de vencer para no enviar con un token a punto de caducar.
const TOKEN_MARGIN_MS = 60_000;

type Fetch = typeof fetch;

/**
 * Adaptador del puerto `MailSender` con la API de Gmail (HTTPS, puerto 443). Sirve donde el
 * proveedor bloquea los puertos SMTP salientes. Arma el MIME con nodemailer y lo envía con un
 * token de acceso que se renueva solo con el token de actualización.
 */
export class GmailApiMailSender implements MailSender {
  private accessToken: { value: string; expiresAt: number } | null = null;
  private readonly composer = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'unix',
  });

  constructor(
    private readonly config: GmailApiConfig,
    // Se puede inyectar para probar sin red.
    private readonly fetchImpl: Fetch = fetch,
  ) {}

  async send(message: MailMessage): Promise<void> {
    const raw = await this.compose(message);
    const response = await this.fetchImpl(SEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await this.token()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: raw.toString('base64url') }),
    });
    if (!response.ok) {
      throw new Error(`La API de Gmail rechazó el correo (${response.status})`);
    }
  }

  private async compose(message: MailMessage): Promise<Buffer> {
    const info = (await this.composer.sendMail({
      from: this.config.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    })) as { message: Buffer };
    return info.message;
  }

  private async token(): Promise<string> {
    const now = Date.now();
    if (
      this.accessToken &&
      this.accessToken.expiresAt - TOKEN_MARGIN_MS > now
    ) {
      return this.accessToken.value;
    }
    const response = await this.fetchImpl(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: this.config.refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });
    if (!response.ok) {
      // Sin el cuerpo: puede traer detalles de la cuenta.
      throw new Error(
        `No se pudo obtener el token de Gmail (${response.status})`,
      );
    }
    const body = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.accessToken = {
      value: body.access_token,
      expiresAt: now + body.expires_in * 1000,
    };
    return body.access_token;
  }
}
