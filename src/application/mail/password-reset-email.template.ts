import {
  buttonHtml,
  COLOR,
  escapeHtml,
  firstNameOf,
  joinUrl,
  renderLayout,
  type RenderedEmail,
} from './email-layout';

const ALTERNATE_LINE =
  'Te escribimos también a tu correo alterno porque lo registraste como respaldo.';
const NO_REPLY = 'Es un mensaje automático: no lo respondas.';

export interface PasswordResetEmailInput {
  fullName: string;
  /** Enlace completo con el token (en el fragmento `#`, que el navegador no envía a ningún servidor). */
  resetUrl: string;
  ttlMinutes: number;
  toAlternate?: boolean;
}

/** Enlace para crear una contraseña nueva. Sirve una sola vez y vence. */
export function renderPasswordResetEmail(
  input: PasswordResetEmailInput,
): RenderedEmail {
  const firstName = firstNameOf(input.fullName);
  const subject = 'Restablece tu contraseña de Conecta U';
  const validity = `El enlace sirve una sola vez y vence en ${input.ttlMinutes} minutos.`;
  const warning =
    'Si no lo pediste tú, ignora este correo: tu contraseña sigue igual y nadie puede usarla sin este enlace. Conecta U nunca te pedirá tu contraseña por correo.';

  const bodyHtml = `<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:${COLOR.ink};">Hola, ${escapeHtml(firstName)}</h1>
<p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:${COLOR.ink};">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Con el botón creas una contraseña nueva.</p>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${COLOR.muted};">${escapeHtml(validity)}</p>
${buttonHtml('Crear una contraseña nueva', input.resetUrl)}
<p style="margin:22px 0 0;padding:12px 16px;border-left:3px solid ${COLOR.red};background:${COLOR.redSoft};font-size:13px;line-height:1.55;color:${COLOR.ink};">${escapeHtml(warning)}</p>`;

  const footnote = [input.toAlternate ? ALTERNATE_LINE : '', NO_REPLY]
    .filter(Boolean)
    .join(' ');
  return {
    subject,
    html: renderLayout({
      preheader: validity,
      title: subject,
      bodyHtml,
      footnote,
    }),
    text: [
      `Hola, ${firstName}:`,
      '',
      'Recibimos una solicitud para restablecer la contraseña de tu cuenta en Conecta U.',
      `Crea una contraseña nueva aquí: ${input.resetUrl}`,
      validity,
      '',
      warning,
      '',
      footnote,
    ].join('\n'),
  };
}

export interface PasswordChangedEmailInput {
  fullName: string;
  changedAt: Date;
  appUrl: string;
  toAlternate?: boolean;
}

const FORGOT_PATH = '/recuperar-contrasena';

/** Aviso de que la contraseña cambió, por si no fue la propia persona. */
export function renderPasswordChangedEmail(
  input: PasswordChangedEmailInput,
): RenderedEmail {
  const firstName = firstNameOf(input.fullName);
  const subject = 'Tu contraseña de Conecta U cambió';
  const when = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(input.changedAt);
  const sessions =
    'Por seguridad cerramos las sesiones que estaban abiertas en otros dispositivos.';
  const warning =
    'Si no fuiste tú, restablece tu contraseña de inmediato y avísale al administrador de la plataforma.';
  const url = joinUrl(input.appUrl, FORGOT_PATH);

  const bodyHtml = `<h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:${COLOR.ink};">Hola, ${escapeHtml(firstName)}</h1>
<p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:${COLOR.ink};">La contraseña de tu cuenta se cambió el <b>${escapeHtml(when)}</b> (hora de Colombia).</p>
<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${COLOR.muted};">${escapeHtml(sessions)}</p>
<p style="margin:0 0 18px;padding:12px 16px;border-left:3px solid ${COLOR.red};background:${COLOR.redSoft};font-size:13px;line-height:1.55;color:${COLOR.ink};">${escapeHtml(warning)}</p>
${buttonHtml('Restablecer mi contraseña', url)}`;

  const footnote = [input.toAlternate ? ALTERNATE_LINE : '', NO_REPLY]
    .filter(Boolean)
    .join(' ');
  return {
    subject,
    html: renderLayout({
      preheader: `Cambio de contraseña el ${when}.`,
      title: subject,
      bodyHtml,
      footnote,
    }),
    text: [
      `Hola, ${firstName}:`,
      '',
      `La contraseña de tu cuenta en Conecta U se cambió el ${when} (hora de Colombia).`,
      sessions,
      '',
      `${warning} ${url}`,
      '',
      footnote,
    ].join('\n'),
  };
}
