/**
 * Almacenamiento de archivos privados (RT16): los certificados viven en un bucket con acceso
 * restringido y solo el backend los lee. La clave la genera el sistema, nunca el usuario.
 */
export interface FileStorage {
  put(key: string, content: Buffer, contentType: string): Promise<void>;
  /** `null` si el objeto no existe. */
  get(key: string): Promise<Buffer | null>;
  /** No falla si el objeto ya no existe. */
  delete(key: string): Promise<void>;
}
