import type { AvailabilityStatus } from '../entities/availability-status.type';
import type { CollaboratorEntity } from '../entities/collaborator.entity';
import type { PersonType } from '../entities/person-type.type';
import type { MatchBreakdown } from '../services/match-score';

/** Persona elegible para recomendar, con su embedding (null si todavía no se calcula). */
export interface MatchCandidate {
  collaborator: CollaboratorEntity;
  embedding: number[] | null;
}

export interface NewRecommendation {
  requiredProfileId: string;
  collaboratorId: string;
  rank: number;
  score: number;
  skillScore: number;
  semanticScore: number;
  experienceScore: number;
  availabilityScore: number;
  breakdown: MatchBreakdown;
}

/** Datos de la persona que puede ver el líder: sin correo, teléfono ni enlaces (Ley 1581). */
export interface RecommendedPerson {
  id: string;
  fullName: string;
  personType: PersonType;
  programName: string;
  researchGroup: string | null;
  availabilityStatus: AvailabilityStatus;
  weeklyHours: number;
  /** Tiene cuenta en la plataforma (si no, se contacta por otra vía). */
  hasUser: boolean;
}

export interface RecommendationView {
  id: string;
  requiredProfileId: string;
  rank: number;
  score: number;
  skillScore: number;
  semanticScore: number;
  experienceScore: number;
  availabilityScore: number;
  breakdown: MatchBreakdown;
  generatedAt: Date;
  collaborator: RecommendedPerson;
}

export interface RecommendationFilter {
  profileId?: string;
  /** Muestra también a quienes hoy figuran NO_DISPONIBLE. */
  includeUnavailable: boolean;
}

export interface RecommendationRepository {
  /**
   * Personas activas y con consentimiento de datos (con o sin usuario). Su embedding solo
   * viene si lo generó `embeddingModel`; si no, `null` (no comparable con el del perfil).
   */
  findCandidates(embeddingModel: string): Promise<MatchCandidate[]>;
  /**
   * Reemplaza todas las recomendaciones del proyecto por las nuevas, en una transacción:
   * o queda el resultado nuevo completo o el anterior intacto.
   */
  replaceForProject(
    projectId: string,
    rows: NewRecommendation[],
  ): Promise<void>;
  /** Recomendaciones de los perfiles activos del proyecto, ordenadas por perfil y `rank`. */
  findByProject(
    projectId: string,
    filter: RecommendationFilter,
  ): Promise<RecommendationView[]>;
  findViewById(id: string): Promise<RecommendationView | null>;
}
