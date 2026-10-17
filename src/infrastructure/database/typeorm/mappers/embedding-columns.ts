import type { StoredEmbedding } from '../../../../domain/entities/stored-embedding';

/** Postgres entrega `vector` como texto "[0.1,0.2]" si el driver no lo convirtió ya. */
export function parseVector(value: number[] | string): number[] {
  return typeof value === 'string' ? (JSON.parse(value) as number[]) : value;
}

/** El vector y su modelo viajan juntos: nunca se guarda uno sin el otro. */
export function embeddingColumns(embedding: StoredEmbedding | null) {
  return {
    embedding: embedding?.vector ?? null,
    embeddingModel: embedding?.model ?? null,
  };
}
