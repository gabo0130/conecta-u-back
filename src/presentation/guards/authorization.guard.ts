import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AUTHORIZATION_RULE_KEY,
  type AuthorizationRule,
} from './authorization.decorator';
import type { AuthenticatedRequest } from './jwt-auth.guard';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rule = this.reflector.getAllAndOverride<AuthorizationRule>(
      AUTHORIZATION_RULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rule) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException({ message: 'No autorizado' });
    }

    const userRole = request.user.role;
    const hasRoleRules = (rule.anyOfRoles?.length ?? 0) > 0;

    if (!hasRoleRules) {
      return true;
    }

    const roleAllowed = hasRoleRules && rule.anyOfRoles!.includes(userRole);

    if (roleAllowed) {
      return true;
    }

    throw new ForbiddenException({ message: 'Prohibido' });
  }
}
