import type { UserRole } from './user-role.type';

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly active: boolean = true,
    /** Último cambio de contraseña; los tokens emitidos antes quedan revocados. */
    public readonly passwordChangedAt: Date | null = null,
  ) {}
}
