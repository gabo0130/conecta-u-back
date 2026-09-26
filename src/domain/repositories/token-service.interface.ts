import type { UserRole } from '../entities/user-role.type';

export interface TokenService {
  generate(userId: string, role?: UserRole): string;
  generateRefresh(userId: string, role?: UserRole): string;
  verify(token: string): { userId: string; role?: UserRole };
  verifyRefresh(token: string): { userId: string; role?: UserRole };
  /** Segundos de vigencia de un token emitido por `generate`, leídos del propio token. */
  expiresInSeconds(token: string): number;
}
