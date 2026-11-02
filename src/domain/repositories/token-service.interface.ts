import type { UserRole } from '../entities/user-role.type';

/** Datos de un token válido. `issuedAt` (segundos) permite revocar sesiones anteriores. */
export interface VerifiedToken {
  userId: string;
  role?: UserRole;
  issuedAt?: number;
}

export interface TokenService {
  generate(userId: string, role?: UserRole): string;
  generateRefresh(userId: string, role?: UserRole): string;
  verify(token: string): VerifiedToken;
  verifyRefresh(token: string): VerifiedToken;
  /** Segundos de vigencia de un token emitido por `generate`, leídos del propio token. */
  expiresInSeconds(token: string): number;
}
