import type { UserRole } from '../../domain/entities/user-role.type';
import {
  buttonHtml,
  COLOR,
  escapeHtml,
  firstNameOf,
  joinUrl,
  renderLayout,
  type RenderedEmail,
} from './email-layout';

export { escapeHtml, type RenderedEmail } from './email-layout';

export interface WelcomeEmailInput {
  fullName: string;
  role: UserRole;
  /** URL base del frontend, sin barra final (p. ej. `https://conectau.example`). */
  appUrl: string;
  /** v2.2, E3: la copia que llega al correo alterno lo dice, para que no parezca un error. */
  toAlternate?: boolean;
}

interface Step {
  title: string;
  detail: string;
}

interface RoleContent {
  roleLabel: string;
  subject: (firstName: string) => string;
  lead: string;
  steps: Step[];
  note: string;
  ctaLabel: string;
}

const ROLE_CONTENT: Record<UserRole, RoleContent> = {
  COLABORADOR: {
    roleLabel: 'Colaborador',
    subject: (name) => `${name}, tu talento ya tiene dónde mostrarse`,
    lead: 'En la UFPS hay proyectos de investigación, de curso, de extensión e interdisciplinarios que buscan justo lo que tú sabes hacer. Conecta U lee lo que necesita cada proyecto y lo compara con tu perfil técnico: entre más completo esté, más fácil te encuentran.',
    steps: [
      {
        title: 'Tus conocimientos y competencias',
        detail:
          'conocimientos técnicos, competencias técnicas y competencias blandas, con su nivel y el tiempo que llevas usándolos.',
      },
      {
        title: 'Tu experiencia',
        detail:
          'laboral, de semillero, de práctica o de docencia; la laboral, la de práctica y la de docencia van con su certificado.',
      },
      {
        title: 'Tu disponibilidad',
        detail: 'cuántas horas a la semana podrías dedicarle a un proyecto.',
      },
    ],
    note: 'Cuando un líder te convoque, te llegará un correo con el proyecto y el perfil para el que te recomendaron. Participar siempre es tu decisión.',
    ctaLabel: 'Completar mi perfil',
  },
  LIDER: {
    roleLabel: 'Líder de proyecto',
    subject: (name) => `${name}, tu próximo equipo empieza aquí`,
    lead: 'Describe tu proyecto como lo harías en una convocatoria: título, objetivos y entregables. Conecta U identifica con inteligencia artificial los perfiles que necesita, te explica por qué y te muestra a las personas de la UFPS que mejor encajan.',
    steps: [
      {
        title: 'Registra tu proyecto',
        detail:
          'con la plantilla de su tipo: investigación, curso, extensión o interdisciplinario.',
      },
      {
        title: 'Revisa los perfiles sugeridos',
        detail: 'puedes editarlos, descartarlos o agregar los tuyos.',
      },
      {
        title: 'Convoca a tu equipo',
        detail:
          'elige a quién invitar; cada persona recibe un correo con tu proyecto.',
      },
    ],
    note: 'Las recomendaciones se basan en lo que cada persona declara en su perfil. La decisión final siempre es tuya.',
    ctaLabel: 'Registrar mi primer proyecto',
  },
  ADMIN: {
    roleLabel: 'Administrador',
    subject: (name) =>
      `${name}, ya tienes acceso a la administración de Conecta U`,
    lead: 'Tu cuenta tiene acceso a la administración de la plataforma: personas, cuentas, catálogos, importación desde Excel, indicadores y reportes.',
    steps: [
      {
        title: 'Revisa el dashboard',
        detail: 'indicadores de proyectos, personas, perfiles y convocatorias.',
      },
      {
        title: 'Mantén los catálogos al día',
        detail: 'programas, semilleros, tipos y categorías de proyecto.',
      },
      {
        title: 'Carga personas desde Excel',
        detail: 'con la plantilla de importación y su reporte de rechazos.',
      },
    ],
    note: 'Las acciones de administración afectan a toda la plataforma; úsalas con cuidado.',
    ctaLabel: 'Ir al dashboard',
  },
};

const LOGIN_PATH = '/login';

/** Correo de bienvenida al crear una cuenta, con el contenido según el rol. */
export function renderWelcomeEmail(input: WelcomeEmailInput): RenderedEmail {
  const content = ROLE_CONTENT[input.role];
  const firstName = firstNameOf(input.fullName);
  const ctaUrl = joinUrl(input.appUrl, LOGIN_PATH);
  const subject = content.subject(firstName);
  const alternateLine = input.toAlternate
    ? 'Te llega también a tu correo alterno porque lo registraste como respaldo.'
    : '';

  const stepsHtml = content.steps
    .map(
      (step, index) => `<tr>
  <td style="width:30px;vertical-align:top;padding:0 0 14px;"><div style="width:24px;height:24px;border-radius:50%;border:1.5px solid ${COLOR.red};color:${COLOR.red};font-size:12px;font-weight:700;line-height:24px;text-align:center;">${index + 1}</div></td>
  <td style="vertical-align:top;padding:2px 0 14px 6px;font-size:14px;line-height:1.55;color:${COLOR.ink};"><b>${escapeHtml(step.title)}</b><span style="color:${COLOR.muted};">: ${escapeHtml(step.detail)}</span></td>
</tr>`,
    )
    .join('');

  const bodyHtml = `<p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${COLOR.red};letter-spacing:0.02em;">${escapeHtml(content.roleLabel)}</p>
<h1 style="margin:0 0 14px;font-size:23px;line-height:1.3;color:${COLOR.ink};">Hola, ${escapeHtml(firstName)}: ya formas parte de Conecta U</h1>
<p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:${COLOR.ink};">${escapeHtml(content.lead)}</p>
<p style="margin:0 0 12px;font-size:13px;font-weight:700;color:${COLOR.ink};">Para empezar</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${stepsHtml}</table>
<p style="margin:6px 0 22px;padding:12px 16px;border-left:3px solid ${COLOR.red};background:${COLOR.redSoft};font-size:13px;line-height:1.55;color:${COLOR.ink};">${escapeHtml(content.note)}</p>
${buttonHtml(content.ctaLabel, ctaUrl)}`;

  const footnote = [
    'Recibes este correo porque se creó una cuenta con esta dirección en Conecta U.',
    alternateLine,
    'Si no fuiste tú, ignóralo o avísale al administrador de la plataforma. Es un mensaje automático: no lo respondas.',
  ]
    .filter(Boolean)
    .join(' ');

  const html = renderLayout({
    preheader: `Tu cuenta de ${content.roleLabel.toLowerCase()} está lista. ${content.steps.length} pasos para empezar.`,
    title: subject,
    bodyHtml,
    footnote,
  });

  const text = [
    `Hola, ${firstName}: ya formas parte de Conecta U (${content.roleLabel}).`,
    '',
    content.lead,
    '',
    'Para empezar:',
    ...content.steps.map(
      (step, index) => `${index + 1}. ${step.title}: ${step.detail}`,
    ),
    '',
    content.note,
    '',
    `${content.ctaLabel}: ${ctaUrl}`,
    '',
    footnote,
  ].join('\n');

  return { subject, html, text };
}
