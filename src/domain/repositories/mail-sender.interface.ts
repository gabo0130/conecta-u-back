/** Un correo ya renderizado, listo para entregarse al proveedor (SMTP). */
export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  /** Versión en texto plano, para clientes que no muestran HTML. */
  text: string;
}

export interface MailSender {
  /** @throws si el proveedor rechaza o no puede entregar el mensaje. */
  send(message: MailMessage): Promise<void>;
}
