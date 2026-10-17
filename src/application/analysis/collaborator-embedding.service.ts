import { Inject, Injectable } from '@nestjs/common';
import type { CollaboratorEmbeddingRepository } from '../../domain/repositories/collaborator-embedding.repository.interface';
import type { EmbeddingProvider } from '../../domain/repositories/embedding-provider.interface';
import {
  COLLABORATOR_EMBEDDING_REPOSITORY,
  EMBEDDING_PROVIDER,
} from '../../shared/interfaces/tokens';
import { AppLoggerService } from '../../shared/logging/logger.service';
import { collaboratorEmbeddingText } from './collaborator-embedding-text';

/** Textos por llamada al proveedor; cada lote tiene su propio tope de tiempo. */
export const EMBEDDING_BATCH_SIZE = 50;

export interface RebuildSummary {
  /** Personas con embedding nuevo. */
  processed: number;
  /** Personas sin contenido que representar: quedan al día, sin embedding. */
  skipped: number;
  /** Personas que no se pudieron procesar; siguen pendientes. */
  failed: number;
  /** Pendientes que quedan después de esta corrida (si superó el límite o hubo fallos). */
  remaining: number;
}

/** Mantiene al día los embeddings del perfil de las personas (RF15, parte semántica). */
@Injectable()
export class CollaboratorEmbeddingService {
  private readonly logger: ReturnType<AppLoggerService['forContext']>;
  private inFlight: Promise<RebuildSummary> | null = null;

  constructor(
    @Inject(COLLABORATOR_EMBEDDING_REPOSITORY)
    private readonly repository: CollaboratorEmbeddingRepository,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(CollaboratorEmbeddingService.name);
  }

  /**
   * Procesa hasta `limit` personas pendientes, en lotes de 50. Si un lote falla se detiene
   * (el proveedor probablemente está caído: seguir solo gasta tiempo y dinero) y, con
   * `maxDurationMs`, no empieza lotes nuevos pasado ese tiempo. Dos llamadas simultáneas
   * comparten la misma corrida, pero quien trae `maxDurationMs` nunca espera más que eso
   * (p. ej. un líder que genera recomendaciones mientras el ADMIN reconstruye todo).
   */
  rebuildStale(
    limit: number,
    options: { maxDurationMs?: number } = {},
  ): Promise<RebuildSummary> {
    const joining = this.inFlight !== null;
    this.inFlight ??= this.runRebuild(limit, options.maxDurationMs).finally(
      () => {
        this.inFlight = null;
      },
    );
    if (!joining || options.maxDurationMs === undefined) return this.inFlight;
    return this.waitAtMost(this.inFlight, options.maxDurationMs);
  }

  /** Espera la corrida ajena hasta `ms`; pasado eso sigue sin ella (no procesó nada propio). */
  private async waitAtMost(
    run: Promise<RebuildSummary>,
    ms: number,
  ): Promise<RebuildSummary> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), ms);
    });
    try {
      const summary = await Promise.race([run, timedOut]);
      if (summary) return summary;
      return {
        processed: 0,
        skipped: 0,
        failed: 0,
        remaining: await this.repository.countStale(
          this.embeddingProvider.model,
        ),
      };
    } finally {
      clearTimeout(timer);
    }
  }

  private async runRebuild(
    limit: number,
    maxDurationMs = Infinity,
  ): Promise<RebuildSummary> {
    const deadline = Date.now() + maxDurationMs;
    const { model } = this.embeddingProvider;
    const pending = await this.repository.findStale(model, limit);
    const summary: RebuildSummary = {
      processed: 0,
      skipped: 0,
      failed: 0,
      remaining: 0,
    };

    for (let start = 0; start < pending.length; start += EMBEDDING_BATCH_SIZE) {
      if (Date.now() >= deadline) break;
      const batch = pending.slice(start, start + EMBEDDING_BATCH_SIZE);
      const texts = batch.map(collaboratorEmbeddingText);
      const withText = batch.filter((_collaborator, index) => texts[index]);

      // Sin contenido no hay nada que representar: se registra como al día.
      for (const [index, collaborator] of batch.entries()) {
        if (!texts[index]) {
          await this.repository.save(collaborator.id, null, model);
          summary.skipped++;
        }
      }
      if (withText.length === 0) continue;

      try {
        // Con tope de tiempo, cada lote recibe solo lo que queda (nunca más que el del proveedor).
        const vectors = await this.embeddingProvider.embed(
          texts.filter(Boolean),
          Number.isFinite(deadline)
            ? { timeoutMs: Math.max(deadline - Date.now(), 1) }
            : {},
        );
        for (const [index, collaborator] of withText.entries()) {
          await this.repository.save(collaborator.id, vectors[index], model);
          summary.processed++;
        }
      } catch (error) {
        summary.failed += withText.length;
        this.logger.error('Falló un lote de embeddings de personas', error, {
          method: 'rebuildStale',
          batchSize: withText.length,
        });
        break;
      }
    }

    summary.remaining = await this.repository.countStale(model);
    return summary;
  }

  /**
   * Invalida todos los embeddings (`force`). Al cambiar de modelo no hace falta: los de otro
   * modelo ya cuentan como desactualizados.
   */
  markAllStale(): Promise<void> {
    return this.repository.markAllStale();
  }
}
