import { createHash, randomBytes } from 'node:crypto';
import { PASSWORD_RESET_RULES } from '../../domain/entities/password-reset';

/** Token aleatorio para el enlace (va al correo) y su hash (va a la base). */
export function newResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(PASSWORD_RESET_RULES.tokenBytes).toString(
    'base64url',
  );
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
