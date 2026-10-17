import type { Priority } from '../entities/priority.type';
import type { RequiredProfileEntity } from '../entities/required-profile.entity';
import type { StoredEmbedding } from '../entities/stored-embedding';
import type { NewRequiredProfileSkill } from './project-analysis.repository.interface';

export interface CreateManualRequiredProfileDto {
  projectId: string;
  name: string;
  description: string;
  justification: string;
  quantity: number;
  priority: Priority;
  minWeeklyHours: number | null;
  skills: NewRequiredProfileSkill[];
  /** null si no se pudo calcular: el matchmaking reparte su peso entre los demás componentes. */
  embedding: StoredEmbedding | null;
}

export interface UpdateRequiredProfileRepositoryDto {
  name?: string;
  description?: string;
  justification?: string;
  quantity?: number;
  priority?: Priority;
  minWeeklyHours?: number | null;
  active?: boolean;
  /** Si viene, reemplaza por completo las habilidades del perfil. */
  skills?: NewRequiredProfileSkill[];
  embedding?: StoredEmbedding | null;
}

export interface RequiredProfileRepository {
  findById(id: string): Promise<RequiredProfileEntity | null>;
  /**
   * Embeddings de los perfiles indicados generados con `model`. Los que no tienen, o los
   * tienen de otro modelo (no comparables), no aparecen.
   */
  findEmbeddings(ids: string[], model: string): Promise<Map<string, number[]>>;
  /** Perfiles activos sin embedding del modelo `model` (para regenerarlos), los más viejos primero. */
  findWithStaleEmbedding(
    model: string,
    limit: number,
  ): Promise<RequiredProfileEntity[]>;
  countWithStaleEmbedding(model: string): Promise<number>;
  saveEmbedding(id: string, embedding: StoredEmbedding | null): Promise<void>;
  /** Olvida el modelo de todos los embeddings de perfiles: se regeneran (`force`). */
  markAllEmbeddingsStale(): Promise<void>;
  /**
   * Perfiles activos que se muestran del proyecto: los del análisis indicado más los
   * manuales, en orden de `position`.
   */
  findActiveForProject(
    projectId: string,
    analysisId: string | null,
  ): Promise<RequiredProfileEntity[]>;
  /** Crea un perfil MANUAL al final de la lista del proyecto. */
  createManual(
    data: CreateManualRequiredProfileDto,
  ): Promise<RequiredProfileEntity>;
  update(
    id: string,
    data: UpdateRequiredProfileRepositoryDto,
  ): Promise<RequiredProfileEntity | null>;
}
