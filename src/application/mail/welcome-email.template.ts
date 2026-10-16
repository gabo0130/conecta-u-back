import type { UserRole } from '../../domain/entities/user-role.type';

export interface WelcomeEmailInput {
  fullName: string;
  role: UserRole;
  /** URL base del frontend, sin barra final (p. ej. `https://conectau.example`). */
  appUrl: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

interface RoleContent {
  roleLabel: string;
  intro: string;
  highlights: string[];
  ctaLabel: string;
  ctaPath: string;
}

const ROLE_CONTENT: Record<UserRole, RoleContent> = {
  LIDER: {
    roleLabel: 'Líder de proyecto',
    intro:
      'Registra tus proyectos e investigaciones y deja que la plataforma identifique los perfiles que necesitas y te recomiende a las personas indicadas para hacerlos realidad.',
    highlights: [
      'Registra tu proyecto con su resumen, objetivos, habilidades y entregables.',
      'Recibe el análisis de perfiles requeridos y colaboradores recomendados.',
      'Convoca a las personas que mejor encajan con tu proyecto.',
    ],
    ctaLabel: 'Registrar mi primer proyecto',
    ctaPath: '/login',
  },
  COLABORADOR: {
    roleLabel: 'Colaborador',
    intro:
      'Cuéntanos qué sabes hacer. Mientras más completo esté tu perfil técnico, más fácil será que los líderes de proyecto te encuentren y te inviten a participar.',
    highlights: [
      'Agrega tus conocimientos, competencias y habilidades blandas.',
      'Registra tu experiencia y los proyectos en los que has participado.',
      'Mantén al día tu disponibilidad para aparecer en las recomendaciones.',
    ],
    ctaLabel: 'Completar mi perfil',
    ctaPath: '/login',
  },
  ADMIN: {
    roleLabel: 'Administrador',
    intro:
      'Tienes acceso al panel de administración para mantener la plataforma en orden: personas, proyectos, catálogos y cargas masivas.',
    highlights: [
      'Gestiona cuentas de usuario y sus roles.',
      'Consulta proyectos y perfiles técnicos de toda la plataforma.',
      'Administra catálogos e importa colaboradores desde Excel.',
    ],
    ctaLabel: 'Ir al panel',
    ctaPath: '/login',
  },
};

// Paleta de la aplicación (src/app/globals.css del frontend).
const COLOR = {
  red: '#c8102e',
  redDark: '#9e0c24',
  redSoft: '#fce9ec',
  ink: '#1a1a1a',
  muted: '#6b6f76',
  line: '#e7e8ec',
  bg: '#f5f6f8',
  green: '#1f9d57',
  greenSoft: '#e7f6ed',
} as const;

const FONT_STACK = "'Sora','Public Sans','Segoe UI',Helvetica,Arial,sans-serif";

/** El nombre llega del usuario: se escapa para que no inyecte HTML en el correo. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

/** Correo de bienvenida al crear una cuenta, con el contenido según el rol. */
export function renderWelcomeEmail(input: WelcomeEmailInput): RenderedEmail {
  const content = ROLE_CONTENT[input.role];
  const firstName = firstNameOf(input.fullName);
  const appUrl = input.appUrl.replace(/\/+$/, '');
  const ctaUrl = `${appUrl}${content.ctaPath}`;
  const safeName = escapeHtml(firstName);
  const subject = 'Te damos la bienvenida a Conecta U: tu cuenta está lista';

  const highlightsHtml = content.highlights
    .map(
      (item) =>
        `<tr><td style="padding:6px 0;font-size:14px;line-height:1.5;color:${COLOR.ink};"><span style="color:${COLOR.red};font-weight:700;">&#10003;</span>&nbsp; ${escapeHtml(item)}</td></tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${COLOR.bg};font-family:${FONT_STACK};color:${COLOR.ink};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Tu cuenta de ${escapeHtml(content.roleLabel.toLowerCase())} en Conecta U fue creada exitosamente.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.bg};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${COLOR.line};">
      <tr><td style="background:${COLOR.red};padding:28px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="width:40px;height:40px;background:#ffffff;border-radius:10px;text-align:center;vertical-align:middle;font-size:22px;font-weight:800;color:${COLOR.red};font-family:${FONT_STACK};">C</td>
          <td style="padding-left:12px;font-size:20px;font-weight:700;color:#ffffff;font-family:${FONT_STACK};">Conecta U</td>
        </tr></table>
        <p style="margin:18px 0 0;font-size:14px;line-height:1.5;color:#fbd5db;">Donde las ideas encuentran a las personas capaces de hacerlas realidad.</p>
      </td></tr>
      <tr><td style="padding:32px;">
        <span style="display:inline-block;background:${COLOR.greenSoft};color:${COLOR.green};font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;">Cuenta creada exitosamente</span>
        <h1 style="margin:16px 0 8px;font-size:24px;line-height:1.25;color:${COLOR.ink};">¡Hola, ${safeName}! Te damos la bienvenida</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${COLOR.muted};">Tu cuenta en <b style="color:${COLOR.ink};">Conecta U</b> ya está lista. Entras como <b style="color:${COLOR.red};">${escapeHtml(content.roleLabel)}</b>.</p>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${COLOR.ink};">${escapeHtml(content.intro)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.redSoft};border-radius:12px;margin:0 0 24px;"><tr><td style="padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:${COLOR.redDark};text-transform:uppercase;letter-spacing:0.04em;">Por dónde empezar</p>
          <table role="presentation" cellpadding="0" cellspacing="0">${highlightsHtml}</table>
        </td></tr></table>
        <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:${COLOR.red};border-radius:10px;">
          <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;font-family:${FONT_STACK};">${escapeHtml(content.ctaLabel)}</a>
        </td></tr></table>
        <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:${COLOR.muted};">Si el botón no funciona, copia y pega este enlace en tu navegador:<br><a href="${escapeHtml(ctaUrl)}" style="color:${COLOR.red};word-break:break-all;">${escapeHtml(ctaUrl)}</a></p>
      </td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid ${COLOR.line};background:#fafafa;">
        <p style="margin:0;font-size:12px;line-height:1.5;color:${COLOR.muted};">Si tú no creaste esta cuenta, puedes ignorar este mensaje. Es una notificación automática de Conecta U; por favor no respondas a este correo.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const text = [
    `¡Hola, ${firstName}! Te damos la bienvenida a Conecta U.`,
    '',
    `Tu cuenta fue creada exitosamente. Entras como ${content.roleLabel}.`,
    '',
    content.intro,
    '',
    'Por dónde empezar:',
    ...content.highlights.map((item) => `- ${item}`),
    '',
    `${content.ctaLabel}: ${ctaUrl}`,
    '',
    'Si tú no creaste esta cuenta, puedes ignorar este mensaje.',
  ].join('\n');

  return { subject, html, text };
}
