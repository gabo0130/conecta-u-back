/**
 * Recuperación de contraseña. El enlace lleva un token aleatorio de un solo uso; en la base
 * solo queda su hash (SHA-256), así una copia de la base no sirve para cambiar contraseñas.
 */
export const PASSWORD_RESET_RULES = {
  tokenBytes: 32,
  ttlMinutes: 30,
  /** Solicitudes por cuenta en una hora; las demás reciben la misma respuesta pero no envían. */
  maxRequestsPerHour: 3,
} as const;

export const PASSWORD_LIMITS = {
  minLength: 8,
  // bcrypt ignora lo que pase de 72 bytes: una contraseña más larga daría falsa seguridad.
  maxBytes: 72,
} as const;

export interface PasswordResetToken {
  id: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
}

/**
 * Un token (acceso o refresco) emitido antes del último cambio de contraseña ya no sirve:
 * cambiar la contraseña cierra todas las sesiones abiertas.
 */
export function issuedBeforePasswordChange(
  passwordChangedAt: Date | null,
  issuedAtSeconds: number | undefined,
): boolean {
  if (!passwordChangedAt) return false;
  if (issuedAtSeconds === undefined) return true;
  return issuedAtSeconds < Math.floor(passwordChangedAt.getTime() / 1000);
}
