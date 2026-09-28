import { getMenuByRole } from '../../domain/entities/menu-catalog';
import type { UserEntity } from '../../domain/entities/user.entity';

// Única forma de respuesta de una cuenta: la usan gestión de usuarios, registro, sesión y
// las vistas del ADMIN. `passwordHash` nunca sale de aquí.

export function toUserResponse(user: UserEntity) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    active: user.active,
  };
}

/** Usuario de la sesión (login y `/auth/me`): la cuenta más el menú de su rol. */
export function toSessionUserResponse(user: UserEntity) {
  return { ...toUserResponse(user), menu: getMenuByRole(user.role) };
}

export type UserResponse = ReturnType<typeof toUserResponse>;
export type SessionUserResponse = ReturnType<typeof toSessionUserResponse>;
