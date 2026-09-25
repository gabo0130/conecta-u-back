import type { UserRole } from './user-role.type';

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly active: boolean = true,
  ) {}
}
