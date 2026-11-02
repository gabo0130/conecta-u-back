import type { PasswordResetToken } from '../entities/password-reset';

export interface CreatePasswordResetTokenDto {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface PasswordResetTokenRepository {
  create(data: CreatePasswordResetTokenDto): Promise<void>;
  /** Token sin usar y sin vencer con ese hash, o `null`. */
  findUsable(tokenHash: string, now: Date): Promise<PasswordResetToken | null>;
  /**
   * Marca el token como usado solo si nadie lo usó antes; `false` si otra petición se adelantó
   * (así un enlace no sirve dos veces aunque lleguen dos solicitudes a la vez).
   */
  consume(id: string, now: Date): Promise<boolean>;
  /** Marca como usados todos los tokens pendientes de la cuenta. */
  invalidateForUser(userId: string, now: Date): Promise<void>;
  countCreatedSince(userId: string, since: Date): Promise<number>;
}
