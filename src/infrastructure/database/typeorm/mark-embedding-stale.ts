import type { EntityManager } from 'typeorm';
import { CollaboratorOrmEntity } from './collaborator.orm-entity';

/**
 * Deja desactualizado el embedding de una persona: cambió algo de lo que lo compone
 * (resumen, habilidades o experiencias). El siguiente `rebuild` lo recalcula.
 * Usa el `manager` del repositorio que escribe: dentro de un `UnitOfWork` participa en su
 * transacción; fuera de uno es una escritura aparte (si falla, el embedding sigue vigente).
 */
export async function markEmbeddingStale(
  manager: EntityManager,
  collaboratorId: string,
): Promise<void> {
  await manager.update(
    CollaboratorOrmEntity,
    { id: collaboratorId },
    { embeddingUpdatedAt: null },
  );
}
