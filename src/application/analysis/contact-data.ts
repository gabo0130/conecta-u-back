// Datos de contacto y números de documento en texto libre (Ley 1581): no se envían a la IA. Lo
// escriben las personas (resumen, experiencias) o el líder (proyecto, perfiles), así que pueden
// aparecer en cualquier lado.

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
const URL = /(?:https?:\/\/|www\.)\S+/gi;
/**
 * Teléfonos con separadores (+57 300 123 4567, (607) 577 6655, 315-555-0100, 577 6655):
 * el indicativo va entre paréntesis o seguido de un separador, así no confunde años
 * ("2026-2027"), montos ("1.000.000") ni porcentajes.
 */
const PHONE =
  /(?<!\d)(?:\+\d{1,3}[\s.-]?)?(?:\(\d{1,3}\)\s?|\d{1,3}[\s.-])?\d{3}[\s.-]?\d{4}(?!\d)/g;
/** Celulares (3xx) y fijos (60x) colombianos de 10 dígitos escritos sin separadores. */
const PHONE_CO = /(?<!\d)(?:\+?57)?(?:3\d{9}|60\d{8})(?!\d)/g;

/**
 * Número de documento (v2.1) precedido de su tipo: "CC 1.094.123.456", "cédula: 88123456",
 * "T.I. 1002003004", "pasaporte AB123456". El tipo evita borrar montos o códigos sueltos.
 */
const DOCUMENT_WITH_TYPE =
  /(?<![\p{L}\d])(?:c\.?\s?c|t\.?\s?i|c\.?\s?e|ppt|pa|c[eé]dula(?:\s+de\s+(?:ciudadan[ií]a|extranjer[ií]a))?|tarjeta\s+de\s+identidad|pasaporte|documento(?:\s+de\s+identidad)?)\.?\s*(?:n(?:[°º.]|o\.?|úmero)?\s*)?[:#]?\s*[A-Z]{0,3}\d[\d.\s-]{4,13}\d(?!\d)/giu;
/**
 * Cédula escrita sola, sin separadores: 8 a 10 dígitos seguidos. Montos y años no llegan
 * aquí con esa forma (los montos de la plantilla se envían con separador de miles).
 */
const BARE_DOCUMENT = /(?<![\d.,])\d{8,10}(?![\d.,])/g;

/** Reemplaza correos, enlaces, teléfonos y números de documento por `placeholder`. */
export function stripContactData(text: string, placeholder: string): string {
  return text
    .replace(EMAIL, placeholder)
    .replace(URL, placeholder)
    .replace(DOCUMENT_WITH_TYPE, placeholder)
    .replace(PHONE_CO, placeholder)
    .replace(BARE_DOCUMENT, placeholder)
    .replace(PHONE, placeholder);
}

/** Para textos que se convierten en embedding: quita el contacto y compacta los espacios. */
export function redactContactData(text: string): string {
  return stripContactData(text, ' ').replace(/\s+/g, ' ').trim();
}

/** Para el prompt: deja una marca para que el modelo sepa que ahí había algo omitido. */
export const OMITTED_PERSONAL_DATA = '[dato personal omitido]';
