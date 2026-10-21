import { GoogleGenAI } from '@google/genai';
import type {
  EmbedOptions,
  EmbeddingProvider,
} from '../../domain/repositories/embedding-provider.interface';
import { callWithTransientRetry } from './retry-transient';

export interface GeminiEmbeddingOptions {
  apiKey: string;
  model: string;
  dimensions: number;
  /** Tope por llamada: los embeddings son opcionales y no deben comerse el tiempo del análisis. */
  timeoutMs: number;
}

/** Tamaño de lote por llamada; el API acepta varios textos a la vez. */
const BATCH_SIZE = 50;

/**
 * Embeddings con `gemini-embedding-001`. Con una dimensión reducida (768) el modelo no
 * devuelve vectores normalizados, así que se normalizan aquí para que la distancia coseno
 * de pgvector sea comparable.
 */
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions: number;
  readonly model: string;

  private readonly client: GoogleGenAI;
  private readonly modelName: string;
  private readonly timeoutMs: number;

  constructor({
    apiKey,
    model,
    dimensions,
    timeoutMs,
  }: GeminiEmbeddingOptions) {
    this.client = new GoogleGenAI({ apiKey });
    this.modelName = model;
    this.model = `gemini/${model}@${dimensions}`;
    this.dimensions = dimensions;
    this.timeoutMs = timeoutMs;
  }

  /** Todos los lotes de la llamada comparten el mismo tope de tiempo. */
  async embed(
    texts: string[],
    options: EmbedOptions = {},
  ): Promise<number[][]> {
    const deadline =
      Date.now() + Math.min(options.timeoutMs ?? Infinity, this.timeoutMs);
    const vectors: number[][] = [];
    for (let start = 0; start < texts.length; start += BATCH_SIZE) {
      const batch = texts.slice(start, start + BATCH_SIZE);
      const response = await callWithTransientRetry(
        (signal) =>
          this.client.models.embedContent({
            model: this.modelName,
            contents: batch,
            config: {
              outputDimensionality: this.dimensions,
              abortSignal: signal,
            },
          }),
        Math.max(deadline - Date.now(), 1),
      );
      const embeddings = response.embeddings ?? [];
      if (embeddings.length !== batch.length) {
        throw new Error(
          `Gemini devolvió ${embeddings.length} embeddings para ${batch.length} textos`,
        );
      }
      for (const embedding of embeddings) {
        const values = embedding.values ?? [];
        if (values.length !== this.dimensions) {
          throw new Error(
            `Embedding de ${values.length} dimensiones; se esperaban ${this.dimensions}`,
          );
        }
        vectors.push(normalize(values));
      }
    }
    return vectors;
  }
}

function normalize(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  return norm === 0 ? values : values.map((value) => value / norm);
}
