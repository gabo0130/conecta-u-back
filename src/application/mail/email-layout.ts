/** Piezas comunes de los correos de Conecta U: escape de HTML y el marco sobrio de la marca. */

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

// Paleta de la aplicación (src/app/globals.css del frontend).
export const COLOR = {
  red: '#c8102e',
  redDark: '#9e0c24',
  redSoft: '#fce9ec',
  ink: '#1a1a1a',
  muted: '#6b6f76',
  line: '#e7e8ec',
  bg: '#f5f6f8',
} as const;

export const FONT_STACK =
  "'Sora','Public Sans','Segoe UI',Helvetica,Arial,sans-serif";

/** Todo texto que viene del usuario se escapa para que no inyecte HTML en el correo. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

export function joinUrl(appUrl: string, path: string): string {
  return `${appUrl.replace(/\/+$/, '')}${path}`;
}

/** Botón principal y, debajo, el enlace en texto por si el cliente de correo no lo muestra. */
export function buttonHtml(label: string, url: string): string {
  const safeUrl = escapeHtml(url);
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 0;"><tr><td style="background:${COLOR.red};border-radius:10px;">
  <a href="${safeUrl}" style="display:inline-block;padding:13px 26px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:${FONT_STACK};">${escapeHtml(label)}</a>
</td></tr></table>
<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:${COLOR.muted};">Si el botón no funciona, copia este enlace en tu navegador:<br><a href="${safeUrl}" style="color:${COLOR.red};word-break:break-all;">${safeUrl}</a></p>`;
}

export interface LayoutInput {
  /** Texto corto que algunos clientes muestran junto al asunto. */
  preheader: string;
  title: string;
  /** HTML ya escapado del cuerpo. */
  bodyHtml: string;
  /** Nota final en letra pequeña (texto plano). */
  footnote: string;
}

/** Marco común: franja roja delgada, marca, cuerpo en tarjeta blanca y nota al pie. */
export function renderLayout(input: LayoutInput): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.bg};font-family:${FONT_STACK};color:${COLOR.ink};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.bg};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid ${COLOR.line};">
      <tr><td style="height:6px;background:${COLOR.red};font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:24px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="width:30px;height:30px;background:${COLOR.red};border-radius:8px;text-align:center;vertical-align:middle;font-size:16px;font-weight:800;color:#ffffff;font-family:${FONT_STACK};">C</td>
          <td style="padding-left:10px;font-size:16px;font-weight:700;color:${COLOR.ink};font-family:${FONT_STACK};">Conecta U <span style="font-weight:400;color:${COLOR.muted};">· UFPS</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:20px 32px 32px;">${input.bodyHtml}</td></tr>
      <tr><td style="padding:18px 32px;border-top:1px solid ${COLOR.line};background:#fafafa;">
        <p style="margin:0;font-size:12px;line-height:1.55;color:${COLOR.muted};">${escapeHtml(input.footnote)}</p>
        <p style="margin:8px 0 0;font-size:12px;line-height:1.55;color:${COLOR.muted};">Conecta U · Donde las ideas encuentran a las personas capaces de hacerlas realidad.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
