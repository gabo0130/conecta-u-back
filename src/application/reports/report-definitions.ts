import type {
  InvitationReportRow,
  PersonReportRow,
  ProjectReportRow,
  RecommendationReportRow,
  ReportingRepository,
  SkillBalance,
} from '../../domain/repositories/reporting.repository.interface';
import type { ReportSheet } from '../../domain/repositories/report-writer.interface';

export const REPORT_KINDS = [
  'proyectos',
  'personas',
  'habilidades',
  'recomendaciones',
  'convocatorias',
] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

const LABEL: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_ANALISIS: 'En análisis',
  ANALIZADO: 'Analizado',
  ESTUDIANTE: 'Estudiante',
  DOCENTE: 'Docente',
  DISPONIBLE: 'Disponible',
  PARCIAL: 'Parcialmente disponible',
  NO_DISPONIBLE: 'No disponible',
  REGISTRO: 'Registro',
  ADMIN: 'Administrador',
  IMPORTACION: 'Importación',
  CONOCIMIENTO: 'Conocimiento técnico',
  COMPETENCIA: 'Competencia técnica',
  HABILIDAD_BLANDA: 'Competencia blanda',
  ENVIADA: 'Enviada',
  FALLIDA: 'Fallida',
};
export const labelOf = (value: string | null): string | null =>
  value === null ? null : (LABEL[value] ?? value);

const round2 = (value: number) => Math.round(value * 100) / 100;

interface ReportDefinition<T> {
  title: string;
  fileName: string;
  load: (repository: ReportingRepository) => Promise<T[]>;
  columns: ReportSheet<T>['columns'];
}

const projects: ReportDefinition<ProjectReportRow> = {
  title: 'Reporte de proyectos',
  fileName: 'reporte-proyectos',
  load: (r) => r.projectRows(),
  columns: [
    { header: 'Proyecto', value: (x) => x.title, width: 40 },
    { header: 'Tipo', value: (x) => x.type },
    { header: 'Categoría', value: (x) => x.category },
    { header: 'Programa', value: (x) => x.program },
    { header: 'Estado', value: (x) => labelOf(x.status) },
    { header: 'Líder', value: (x) => x.leader, width: 26 },
    { header: 'Entidad ejecutora', value: (x) => x.executingEntity, width: 26 },
    {
      header: 'Entidad patrocinadora',
      value: (x) => x.sponsorEntity,
      width: 26,
    },
    { header: 'Duración (meses)', value: (x) => x.durationMonths },
    { header: 'Entregables', value: (x) => x.deliverables },
    { header: 'Perfiles requeridos', value: (x) => x.requiredProfiles },
    { header: 'Recomendaciones', value: (x) => x.recommendations },
    { header: 'Convocatorias enviadas', value: (x) => x.invitationsSent },
    { header: 'Registrado', value: (x) => x.createdAt },
  ],
};

// Sin documento ni teléfono: el reporte consolida, no es un directorio (minimización, Ley 1581).
const people: ReportDefinition<PersonReportRow> = {
  title: 'Reporte de personas',
  fileName: 'reporte-personas',
  load: (r) => r.personRows(),
  columns: [
    { header: 'Nombre', value: (x) => x.fullName, width: 30 },
    { header: 'Correo', value: (x) => x.email, width: 30 },
    { header: 'Tipo', value: (x) => labelOf(x.personType) },
    { header: 'Programa', value: (x) => x.program, width: 28 },
    { header: 'Semestre', value: (x) => x.semester },
    { header: 'Semillero o grupo', value: (x) => x.researchGroup, width: 24 },
    { header: 'Disponibilidad', value: (x) => labelOf(x.availabilityStatus) },
    { header: 'Horas por semana', value: (x) => x.weeklyHours },
    { header: 'Habilidades', value: (x) => x.skills },
    { header: 'Experiencias', value: (x) => x.experiences },
    { header: 'Certificados pendientes', value: (x) => x.certificatesPending },
    { header: 'Tiene cuenta', value: (x) => x.hasAccount },
    { header: 'Autorización de datos', value: (x) => x.dataConsent },
    {
      header: 'Declaración de veracidad',
      value: (x) => x.truthfulnessDeclared,
    },
    { header: 'Activa', value: (x) => x.active },
    { header: 'Origen', value: (x) => labelOf(x.source) },
  ],
};

const skills: ReportDefinition<SkillBalance> = {
  title: 'Oferta y demanda de habilidades',
  fileName: 'reporte-habilidades',
  load: (r) => r.skillRows(),
  columns: [
    { header: 'Habilidad', value: (x) => x.name, width: 30 },
    { header: 'Clasificación', value: (x) => labelOf(x.type), width: 22 },
    { header: 'Personas que la ofrecen', value: (x) => x.offered },
    { header: 'Perfiles que la piden', value: (x) => x.demanded },
    {
      header: 'Personas por perfil',
      value: (x) => (x.demanded === 0 ? null : round2(x.offered / x.demanded)),
    },
  ],
};

const recommendations: ReportDefinition<RecommendationReportRow> = {
  title: 'Reporte de recomendaciones',
  fileName: 'reporte-recomendaciones',
  load: (r) => r.recommendationRows(),
  columns: [
    { header: 'Proyecto', value: (x) => x.project, width: 36 },
    { header: 'Perfil requerido', value: (x) => x.profile, width: 26 },
    { header: 'Puesto', value: (x) => x.rank, width: 8 },
    { header: 'Persona', value: (x) => x.person, width: 28 },
    { header: 'Tipo', value: (x) => labelOf(x.personType) },
    { header: 'Programa', value: (x) => x.program, width: 26 },
    { header: 'Correspondencia (%)', value: (x) => round2(x.score) },
    { header: 'Habilidades', value: (x) => round2(x.skillScore) },
    { header: 'Afinidad semántica', value: (x) => round2(x.semanticScore) },
    { header: 'Experiencia', value: (x) => round2(x.experienceScore) },
    { header: 'Disponibilidad', value: (x) => round2(x.availabilityScore) },
    { header: 'Generada', value: (x) => x.generatedAt },
  ],
};

const invitations: ReportDefinition<InvitationReportRow> = {
  title: 'Historial de convocatorias',
  fileName: 'reporte-convocatorias',
  load: (r) => r.invitationRows(),
  columns: [
    { header: 'Proyecto', value: (x) => x.project, width: 36 },
    { header: 'Perfil', value: (x) => x.profile, width: 26 },
    { header: 'Destinatario', value: (x) => x.recipient, width: 28 },
    { header: 'Estado', value: (x) => labelOf(x.status) },
    { header: 'Enviada por', value: (x) => x.sentBy, width: 26 },
    { header: 'Fecha', value: (x) => x.sentAt },
  ],
};

export const REPORTS: Record<ReportKind, ReportDefinition<never>> = {
  proyectos: projects as unknown as ReportDefinition<never>,
  personas: people as unknown as ReportDefinition<never>,
  habilidades: skills as unknown as ReportDefinition<never>,
  recomendaciones: recommendations as unknown as ReportDefinition<never>,
  convocatorias: invitations as unknown as ReportDefinition<never>,
};
