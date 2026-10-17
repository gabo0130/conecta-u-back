// Datos de contacto en texto libre (Ley 1581): no se envían a la IA. Lo escriben las personas
// (resumen, experiencias) o el líder (proyecto, perfiles), así que pueden aparecer en cualquier lado.

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

/** Reemplaza correos, enlaces y teléfonos por `placeholder`. */
export function stripContactData(text: string, placeholder: string): string {
  return text
    .replace(EMAIL, placeholder)
    .replace(URL, placeholder)
    .replace(PHONE_CO, placeholder)
    .replace(PHONE, placeholder);
}

/** Para textos que se convierten en embedding: quita el contacto y compacta los espacios. */
export function redactContactData(text: string): string {
  return stripContactData(text, ' ').replace(/\s+/g, ' ').trim();
}

/** Para el prompt: deja una marca para que el modelo sepa que ahí había algo omitido. */
export const OMITTED_CONTACT = '[dato de contacto omitido]';
