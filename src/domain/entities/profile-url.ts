import { PROFILE_URL_MAX_LENGTH } from './collaborator-limits';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/**
 * Enlace del perfil (GitHub, portafolio, LinkedIn o CvLAC). Solo http/https: el frontend
 * lo pinta en un `<a href>`, así que un `javascript:` guardado se ejecutaría al hacer clic.
 */
export function isProfileUrl(value: string): boolean {
  if (value.length > PROFILE_URL_MAX_LENGTH) return false;
  try {
    const url = new URL(value);
    return ALLOWED_PROTOCOLS.has(url.protocol) && url.hostname.includes('.');
  } catch {
    return false;
  }
}

export const PROFILE_URL_ERROR = `El enlace debe empezar por http:// o https:// y tener máximo ${PROFILE_URL_MAX_LENGTH} caracteres`;
