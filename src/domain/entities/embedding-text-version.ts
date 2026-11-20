/**
 * Versión del texto con que se calculan los embeddings de personas y perfiles requeridos. Va en
 * la clave del vector (`embeddingModel`), así un vector de un formato de texto anterior cuenta
 * como de otro modelo: no se compara y se regenera solo. Subirla al cambiar
 * `collaboratorEmbeddingText` o `profileEmbeddingText`.
 *
 * t2 (19/11/2026): los perfiles de la IA usan el nombre del catálogo de cada habilidad, igual
 * que al regenerarlos (antes, el nombre que devolvía la IA).
 */
export const EMBEDDING_TEXT_VERSION = 't2';
