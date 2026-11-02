import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { UserRole } from '../../domain/entities/user-role.type';
import type {
  TokenService,
  VerifiedToken,
} from '../../domain/repositories/token-service.interface';

interface JwtPayload {
  userId: string;
  role?: UserRole;
  kind: 'access' | 'refresh';
  iat?: number;
}

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  generate(userId: string, role?: UserRole): string {
    const payload: JwtPayload = { userId, kind: 'access' };
    if (role) {
      payload.role = role;
    }
    return this.jwtService.sign(payload);
  }

  generateRefresh(userId: string, role?: UserRole): string {
    const payload: JwtPayload = { userId, kind: 'refresh' };
    if (role) {
      payload.role = role;
    }

    return this.jwtService.sign(payload, {
      expiresIn: '30d',
    });
  }

  expiresInSeconds(token: string): number {
    const { iat, exp } = this.jwtService.decode<{ iat: number; exp: number }>(
      token,
    );
    return exp - iat;
  }

  verify(token: string): VerifiedToken {
    return this.verifyToken(token, 'access');
  }

  verifyRefresh(token: string): VerifiedToken {
    return this.verifyToken(token, 'refresh');
  }

  private verifyToken(token: string, kind: JwtPayload['kind']): VerifiedToken {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      if (payload.kind !== kind) {
        throw new UnauthorizedException({
          message: 'Token no válido o expirado',
        });
      }

      return {
        userId: payload.userId,
        role: payload.role,
        issuedAt: payload.iat,
      };
    } catch {
      throw new UnauthorizedException({
        message: 'Token no válido o expirado',
      });
    }
  }
}
