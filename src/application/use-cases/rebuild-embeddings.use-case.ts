import { Injectable } from '@nestjs/common';
import { CollaboratorEmbeddingService } from '../analysis/collaborator-embedding.service';
import { ProfileEmbedder } from '../analysis/profile-embedder';
import {
  REBUILD_DEFAULT_LIMIT,
  type RebuildEmbeddingsDto,
} from '../dto/rebuild-embeddings.dto';

/**
 * ADMIN: recalcula los embeddings que faltan o quedaron desactualizados, de las personas y
 * de los perfiles requeridos. Un vector de otro modelo cuenta como desactualizado, así que
 * tras cambiar de proveedor basta con llamarlo (`force` regenera todo igual).
 */
@Injectable()
export class RebuildEmbeddingsUseCase {
  constructor(
    private readonly collaboratorEmbeddings: CollaboratorEmbeddingService,
    private readonly profileEmbedder: ProfileEmbedder,
  ) {}

  async execute({ force, limit }: RebuildEmbeddingsDto = {}) {
    if (force) {
      await Promise.all([
        this.collaboratorEmbeddings.markAllStale(),
        this.profileEmbedder.markAllStale(),
      ]);
    }
    const max = limit ?? REBUILD_DEFAULT_LIMIT;
    const collaborators = await this.collaboratorEmbeddings.rebuildStale(max);
    const requiredProfiles = await this.profileEmbedder.rebuildStale(max);
    return { ...collaborators, requiredProfiles };
  }
}
