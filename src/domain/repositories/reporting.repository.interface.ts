/** Conteo por una dimensión (tipo, categoría, programa, estado…). */
export interface CountBy {
  key: string;
  label: string;
  count: number;
}

export interface SkillBalance {
  skillId: string;
  name: string;
  type: string;
  /** Personas activas con autorización que declaran la habilidad. */
  offered: number;
  /** Perfiles requeridos activos que la piden. */
  demanded: number;
}

/** Indicadores del dashboard del ADMIN (RF15). Todo se calcula en la base, sin traer filas. */
export interface PlatformStats {
  generatedAt: Date;
  projects: {
    total: number;
    createdLast30Days: number;
    byStatus: CountBy[];
    byType: CountBy[];
    byCategory: CountBy[];
  };
  people: {
    total: number;
    active: number;
    withAccount: number;
    withConsent: number;
    truthfulnessDeclared: number;
    byPersonType: CountBy[];
    bySource: CountBy[];
    byProgram: CountBy[];
  };
  availability: {
    byStatus: CountBy[];
    averageWeeklyHours: number;
    totalWeeklyHoursAvailable: number;
  };
  users: { total: number; active: number; byRole: CountBy[] };
  profiles: {
    activeRequiredProfiles: number;
    analysesCompleted: number;
    analysesFailed: number;
    projectsWithRecommendations: number;
    recommendations: number;
    averageTopScore: number | null;
  };
  skills: {
    catalogActive: number;
    pendingApproval: number;
    topOffered: SkillBalance[];
    topDemanded: SkillBalance[];
    /** Habilidades pedidas que menos personas ofrecen (brechas). */
    gaps: SkillBalance[];
  };
  certificates: { required: number; uploaded: number };
  invitations: { sent: number; failed: number };
}

export interface ProjectReportRow {
  title: string;
  type: string;
  category: string;
  program: string | null;
  status: string;
  leader: string;
  executingEntity: string | null;
  sponsorEntity: string | null;
  durationMonths: number | null;
  deliverables: number;
  requiredProfiles: number;
  recommendations: number;
  invitationsSent: number;
  createdAt: Date;
}

export interface PersonReportRow {
  fullName: string;
  email: string;
  personType: string;
  program: string;
  semester: number | null;
  researchGroup: string | null;
  availabilityStatus: string;
  weeklyHours: number;
  skills: number;
  experiences: number;
  certificatesPending: number;
  hasAccount: boolean;
  dataConsent: boolean;
  truthfulnessDeclared: boolean;
  active: boolean;
  source: string;
}

export interface RecommendationReportRow {
  project: string;
  profile: string;
  rank: number;
  person: string;
  personType: string;
  program: string;
  score: number;
  skillScore: number;
  semanticScore: number;
  experienceScore: number;
  availabilityScore: number;
  generatedAt: Date;
}

export interface InvitationReportRow {
  project: string;
  profile: string | null;
  recipient: string;
  status: string;
  sentBy: string;
  sentAt: Date;
}

/** Consultas de solo lectura para el dashboard y los reportes del ADMIN (RF15–RF16). */
export interface ReportingRepository {
  getStats(now?: Date): Promise<PlatformStats>;
  projectRows(): Promise<ProjectReportRow[]>;
  personRows(): Promise<PersonReportRow[]>;
  skillRows(): Promise<SkillBalance[]>;
  recommendationRows(): Promise<RecommendationReportRow[]>;
  invitationRows(): Promise<InvitationReportRow[]>;
}
