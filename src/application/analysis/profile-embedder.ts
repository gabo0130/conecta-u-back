import { EMBEDDING_BATCH_SIZE } from './collaborator-embedding.service';
import { Inject, Injectable } from '@nestjs/common';
import type { RequiredProfileEntity } from '../../domain/entities/required-profile.entity';
import type { StoredEmbedding } from '../../domain/entities/stored-embedding';
import type {
  EmbedOptions,
  EmbeddingProvider,
} from '../../domain/repositories/embedding-provider.interface';
import type { RequiredProfileRepository } from '../../domain/repositories/required-profile.repository.interface';
import {
  EMBEDDING_PROVIDER,
  REQUIRED_PROFILE_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { AppLoggerService } from '../../shared/logging/logger.service';
import { profileEmbeddingText } from './catalog-profile-mapper';

export interface EmbeddableProfile {
  name: string;
  description: string;
  skills: { rawName: string }[];
}

export interface ProfileRebuildSummary {
  processed: number;
  failed: number;
  remaining: number;
}

/** Lo que describe a un perfil guardado: el nombre canónico de cada habilidad del catálogo. */
export function toEmbeddableProfile(
  profile: RequiredProfileEntity,
): EmbeddableProfile {
  return {
    name: profile.name,
    description: profile.description,
    skills: profile.skills.map((skill) => ({
      rawName: skill.skillName ?? skill.rawName,
    })),
  };
}

/**
 * Calcula el embedding de perfiles requeridos. La parte semántica es opcional: si el
 * proveedor falla, el perfil se guarda igual con `null` y el matchmaking reparte su peso.
 */
@Injectable()
export class ProfileEmbedder {
  private readonly logger: ReturnType<AppLoggerService['forContext']>;

  constructor(
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
    @Inject(REQUIRED_PROFILE_REPOSITORY)
    private readonly requiredProfileRepository: RequiredProfileRepository,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(ProfileEmbedder.name);
  }

  /** Modelo con el que se generan hoy los embeddings: los de otro modelo no se comparan. */
  get model(): string {
    return this.embeddingProvider.model;
  }

  async embed(
    profiles: EmbeddableProfile[],
    options: EmbedOptions = {},
  ): Promise<(StoredEmbedding | null)[]> {
    if (profiles.length === 0) return [];
    try {
      const vectors = await this.embeddingProvider.embed(
        profiles.map(profileEmbeddingText),
        options,
      );
      const { model } = this.embeddingProvider;
      return profiles.map((_profile, index) => {
        const vector = vectors[index];
        return vector ? { vector, model } : null;
      });
    } catch (error) {
      this.logger.warn(
        'No se pudieron calcular los embeddings de los perfiles',
        {
          method: 'embed',
          reason: error instanceof Error ? error.message : String(error),
        },
      );
      return profiles.map(() => null);
    }
  }

  /**
   * Recalcula y guarda el embedding de perfiles ya guardados (p. ej. porque lo generó otro
   * modelo). Devuelve los vectores nuevos por id; los que fallan quedan pendientes.
   */
  async refreshStored(
    profiles: RequiredProfileEntity[],
    options: EmbedOptions = {},
  ): Promise<Map<string, number[]>> {
    const embeddings = await this.embed(
      profiles.map(toEmbeddableProfile),
      options,
    );
    const refreshed = new Map<string, number[]>();
    for (const [index, profile] of profiles.entries()) {
      const embedding = embeddings[index];
      if (!embedding) continue;
      await this.requiredProfileRepository.saveEmbedding(profile.id, embedding);
      refreshed.set(profile.id, embedding.vector);
    }
    return refreshed;
  }

  /**
   * ADMIN: regenera los perfiles activos sin embedding del modelo actual, en lotes (como las
   * personas). Si un lote falla entero se detiene: el proveedor probablemente está caído.
   */
  async rebuildStale(limit: number): Promise<ProfileRebuildSummary> {
    const stale = await this.requiredProfileRepository.findWithStaleEmbedding(
      this.model,
      limit,
    );
    let processed = 0;
    for (let start = 0; start < stale.length; start += EMBEDDING_BATCH_SIZE) {
      const batch = stale.slice(start, start + EMBEDDING_BATCH_SIZE);
      const refreshed = await this.refreshStored(batch);
      processed += refreshed.size;
      if (refreshed.size === 0) break;
    }
    return {
      processed,
      failed: stale.length - processed,
      remaining: await this.requiredProfileRepository.countWithStaleEmbedding(
        this.model,
      ),
    };
  }

  /** `force`: olvida el modelo de todos los perfiles para que se regeneren. */
  markAllStale(): Promise<void> {
    return this.requiredProfileRepository.markAllEmbeddingsStale();
  }
}
