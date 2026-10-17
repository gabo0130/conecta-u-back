export interface EmbedOptions {
  /** Tope de tiempo para esta llamada; si se omite, el del proveedor. */
  timeoutMs?: number;
}

export interface EmbeddingProvider {
  /** Dimensión de los vectores que devuelve (debe coincidir con la columna `vector(N)`). */
  readonly dimensions: number;
  /**
   * Identifica el espacio de los vectores (proveedor, modelo y dimensión). Dos vectores solo
   * se pueden comparar si los generó el mismo modelo: se guarda junto a cada embedding.
   */
  readonly model: string;
  /**
   * Un vector por texto, en el mismo orden.
   * @throws si el proveedor no responde; quien llama decide si puede seguir sin embeddings.
   */
  embed(texts: string[], options?: EmbedOptions): Promise<number[][]>;
}
