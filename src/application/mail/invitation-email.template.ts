import { escapeHtml, type RenderedEmail } from './email-layout';

export interface InvitationEmailInput {
  recipientFirstName: string;
  leaderName: string;
  projectTitle: string;
  projectSummary: string;
  profileName: string | null;
  /** Mensaje del líder (texto plano; se escapa y se respetan los saltos de línea). */
  message: string;
  hasAccount: boolean;
  /** URL base del frontend, sin barra final. */
  appUrl: string;
}

const COLOR = {
  red: '#c8102e',
  redSoft: '#fce9ec',
  ink: '#1a1a1a',
  muted: '#6b6f76',
  line: '#e7e8ec',
  bg: '#f5f6f8',
} as const;
const FONT_STACK = "'Sora','Public Sans','Segoe UI',Helvetica,Arial,sans-serif";
const SUMMARY_MAX = 400;

function shorten(text: string, max: number): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Convocatoria (RF21). El correo no expone el correo del líder: la persona responde
 * respondiendo el mensaje (Reply-To del líder) o ingresando a la plataforma.
 */
export function renderInvitationEmail(
  input: InvitationEmailInput,
): RenderedEmail {
  const appUrl = input.appUrl.replace(/\/+$/, '');
  const ctaUrl = `${appUrl}/login`;
  const summary = shorten(input.projectSummary, SUMMARY_MAX);
  const role = input.profileName ? ` como ${input.profileName}` : '';
  const subject = `Convocatoria: te invitan a participar en «${shorten(input.projectTitle, 80)}»`;
  const messageHtml = escapeHtml(input.message.trim()).replace(
    /\r?\n/g,
    '<br>',
  );
  const accountLine = input.hasAccount
    ? 'Puedes revisar tu perfil y tu disponibilidad en Conecta U.'
    : 'Si quieres, crea tu cuenta en Conecta U para mantener tu perfil al día.';

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLOR.bg};font-family:${FONT_STACK};color:${COLOR.ink};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.bg};padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${COLOR.line};">
<tr><td style="background:${COLOR.red};padding:24px 32px;font-size:20px;font-weight:700;color:#ffffff;">Conecta U · Convocatoria</td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">Hola, ${escapeHtml(input.recipientFirstName)}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;"><b>${escapeHtml(input.leaderName)}</b> te invita a participar${escapeHtml(role)} en el proyecto <b>${escapeHtml(input.projectTitle)}</b>.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.redSoft};border-radius:12px;margin:0 0 20px;"><tr><td style="padding:16px 20px;font-size:14px;line-height:1.6;">${escapeHtml(summary)}</td></tr></table>
<p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${COLOR.muted};text-transform:uppercase;letter-spacing:0.04em;">Mensaje del líder</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;">${messageHtml}</p>
<p style="margin:0 0 20px;font-size:14px;line-height:1.6;">Para responder, contesta este correo: la respuesta le llega directamente al líder del proyecto. ${escapeHtml(accountLine)}</p>
<a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:${COLOR.red};border-radius:10px;padding:12px 24px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Ir a Conecta U</a>
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid ${COLOR.line};background:#fafafa;font-size:12px;line-height:1.5;color:${COLOR.muted};">Recibes esta convocatoria porque tu perfil coincide con lo que necesita el proyecto y autorizaste el tratamiento de tus datos en Conecta U. La recomendación se basa en la información que declaraste. Participar es voluntario.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `Hola, ${input.recipientFirstName}`,
    '',
    `${input.leaderName} te invita a participar${role} en el proyecto «${input.projectTitle}».`,
    '',
    summary,
    '',
    'Mensaje del líder:',
    input.message.trim(),
    '',
    `Para responder, contesta este correo. ${accountLine}`,
    ctaUrl,
    '',
    'Recibes esta convocatoria porque tu perfil coincide con lo que necesita el proyecto y autorizaste el tratamiento de tus datos en Conecta U. Participar es voluntario.',
  ].join('\n');

  return { subject, html, text };
}
