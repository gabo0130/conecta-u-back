import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export const REBUILD_DEFAULT_LIMIT = 200;
export const REBUILD_MAX_LIMIT = 500;

export class RebuildEmbeddingsDto {
  /** Invalida todos los embeddings antes de recalcular (p. ej. al cambiar de modelo). */
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  /** Máximo de personas a procesar en esta llamada; si quedan más, se llama otra vez. */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(REBUILD_MAX_LIMIT)
  limit?: number;
}
