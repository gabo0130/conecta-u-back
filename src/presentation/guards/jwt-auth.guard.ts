import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import type { UserRole } from '../../domain/entities/user-role.type';
import type { TokenService } from '../../domain/repositories/token-service.interface';
import type { UserRepository } from '../../domain/repositories/user.repository.interface';
import { TOKEN_SERVICE, USER_REPOSITORY } from '../../shared/interfaces/tokens';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({ message: 'Token no proporcionado' });
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = this.tokenService.verify(token);
    const user = await this.userRepository.findById(payload.userId);

    // Se consulta la BD en cada petición para que desactivar la cuenta o cambiar el rol
    // tenga efecto de inmediato, sin esperar a que venza el token.
    if (!user || !user.active) {
      throw new UnauthorizedException({ message: 'No autorizado' });
    }

    request.user = { userId: user.id, role: user.role };

    return true;
  }
}
