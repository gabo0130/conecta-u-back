import type { CollaboratorEntity } from '../entities/collaborator.entity';

/**
 * Embeddings del perfil de cada persona (RF15, parte semántica). Un embedding está
 * desactualizado cuando `embeddingUpdatedAt` es null (los repositorios de personas,
 * habilidades y experiencias lo dejan así cada vez que cambia el contenido del perfil) o
 * cuando lo generó otro modelo que el actual (`model`): no se puede comparar.
 */
export interface CollaboratorEmbeddingRepository {
  /**
   * Personas candidatas (activas y con consentimiento, Ley 1581) cuyo embedding falta o
   * está desactualizado para `model`, con sus habilidades y experiencias.
   */
  findStale(model: string, limit: number): Promise<CollaboratorEntity[]>;
  countStale(model: string): Promise<number>;
  /** Marca todos los embeddings como desactualizados (`force`). */
  markAllStale(): Promise<void>;
  /**
   * Guarda el embedding y el modelo con que se evaluó; `null` registra que no había
   * contenido que representar con ese modelo.
   */
  save(
    collaboratorId: string,
    embedding: number[] | null,
    model: string,
  ): Promise<void>;
}
