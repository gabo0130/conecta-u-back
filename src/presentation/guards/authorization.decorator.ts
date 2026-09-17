import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../domain/entities/user-role.type';

export interface AuthorizationRule {
  anyOfRoles?: UserRole[];
}

export const AUTHORIZATION_RULE_KEY = 'authorization_rule';

export const Authorize = (rule: AuthorizationRule) =>
  SetMetadata(AUTHORIZATION_RULE_KEY, rule);
