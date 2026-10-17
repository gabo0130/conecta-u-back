import type { Page, PageParams } from '../../shared/pagination/pagination.util';
import type { Level } from '../entities/level.type';
import type { Priority } from '../entities/priority.type';
import type { ProjectAnalysisEntity } from '../entities/project-analysis.entity';
import type { RequiredProfileEntity } from '../entities/required-profile.entity';
import type { SkillType } from '../entities/skill-type.type';
import type { StoredEmbedding } from '../entities/stored-embedding';

export interface CreateProjectAnalysisDto {
  projectId: string;
  requestedById: string;
  provider: string;
  model: string;
  promptVersion: string;
  input: Record<string, unknown>;
}

export interface NewRequiredProfileSkill {
  skillId: string | null;
  rawName: string;
  type: SkillType;
  minLevel: Level;
  importance: Priority;
}

export interface NewRequiredProfile {
  name: string;
  description: string;
  justification: string;
  quantity: number;
  priority: Priority;
  minWeeklyHours: number | null;
  position: number;
  skills: NewRequiredProfileSkill[];
  /** null si no se pudo calcular: el matchmaking reparte su peso entre los demás componentes. */
  embedding: StoredEmbedding | null;
}

export interface CompleteProjectAnalysisDto {
  /** Modelo que respondió, si no fue el registrado al reservar el turno (respaldo). */
  model?: string;
  rawOutput: unknown;
  summary: string;
  inputTokens: number | null;
  outputTokens: number | null;
  durationMs: number;
  profiles: NewRequiredProfile[];
}

export interface AnalysisSlotLimits {
  /**
   * Se cuentan todos los intentos creados desde esta fecha, también los ERROR: cada uno llegó
   * a llamar a la IA y se cobró contra su cuota (RT7).
   */
  dailySince: Date;
  maxPerDay: number;
}

export type ClaimAnalysisResult =
  | { status: 'CLAIMED'; analysis: ProjectAnalysisEntity }
  | { status: 'IN_PROGRESS' }
  | { status: 'DAILY_LIMIT' };

export interface ProjectAnalysisRepository {
  /**
   * Reserva el turno de un análisis (RT7): comprueba "uno en curso por proyecto" y el máximo
   * diario y crea el análisis PENDIENTE, todo en una transacción serializada por proyecto, así
   * dos peticiones simultáneas no pasan las dos.
   */
  claim(
    data: CreateProjectAnalysisDto,
    limits: AnalysisSlotLimits,
  ): Promise<ClaimAnalysisResult>;
  /**
   * Marca el análisis como COMPLETADO, guarda sus perfiles y pasa el proyecto a ANALIZADO en
   * una sola transacción: o queda todo o no queda nada. Devuelve `null` sin escribir si el
   * análisis ya no está PENDIENTE (se dio por interrumpido mientras la IA respondía).
   */
  complete(
    id: string,
    data: CompleteProjectAnalysisDto,
  ): Promise<{
    analysis: ProjectAnalysisEntity;
    profiles: RequiredProfileEntity[];
  } | null>;
  /**
   * Marca ERROR solo si sigue PENDIENTE y, en la misma transacción, devuelve el proyecto a su
   * estado real (misma regla que `recoverInterrupted`). `false` si ya había terminado.
   */
  fail(id: string, errorMessage: string, durationMs: number): Promise<boolean>;
  /**
   * Recupera análisis interrumpidos (p. ej. el servidor se reinició a mitad): marca ERROR los
   * PENDIENTE creados antes de `staleBefore` y devuelve a ANALIZADO (si tiene un análisis
   * completado) o BORRADOR los proyectos que quedaron EN_ANALISIS sin un análisis en curso.
   * Con `projectId`, solo ese proyecto. Devuelve cuántos análisis marcó.
   */
  recoverInterrupted(staleBefore: Date, projectId?: string): Promise<number>;
  findById(id: string): Promise<ProjectAnalysisEntity | null>;
  findLatestCompleted(projectId: string): Promise<ProjectAnalysisEntity | null>;
  /** Historial del proyecto, del más reciente al más antiguo. */
  findByProjectId(
    projectId: string,
    params: PageParams,
  ): Promise<Page<ProjectAnalysisEntity>>;
}
