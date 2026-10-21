/**
 * Vector guardado junto al modelo que lo generó. Solo se comparan vectores del mismo modelo:
 * mezclar espacios distintos (p. ej. `fake` y Gemini) daría similitudes sin sentido.
 */
export interface StoredEmbedding {
  vector: number[];
  model: string;
}
