import type { CollaboratorEntity } from '../entities/collaborator.entity';

/**
 * Embeddings del perfil de cada persona (RF11, parte semántica). Un embedding está
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
  /** Marca todos los embeddings como desactualizados (`force`): se recalculan, no se reutilizan. */
  markAllStale(): Promise<void>;
  /**
   * Guarda el embedding, el modelo con que se evaluó y la huella del texto embebido; `null`
   * registra que no había contenido que representar con ese modelo.
   */
  save(
    collaboratorId: string,
    embedding: number[] | null,
    model: string,
    textHash: string | null,
  ): Promise<void>;
  /**
   * Si la persona ya tiene un vector de `model` calculado sobre un texto con esta huella, lo
   * marca al día sin recalcularlo (p. ej. cambió el año de último uso de una habilidad, que no
   * va en el texto). `false` si hay que calcularlo.
   */
  reuseIfUnchanged(
    collaboratorId: string,
    model: string,
    textHash: string,
  ): Promise<boolean>;
}
