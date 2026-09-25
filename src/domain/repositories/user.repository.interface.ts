import type { UserRole } from '../entities/user-role.type';
import { UserEntity } from '../entities/user.entity';

export interface CreateUserRepositoryDto {
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UpdateUserRepositoryDto {
  fullName?: string;
  email?: string;
  role?: UserRole;
  active?: boolean;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findByEmailWithPassword(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  findAll(): Promise<UserEntity[]>;
  create(data: CreateUserRepositoryDto): Promise<UserEntity>;
  update(id: string, data: UpdateUserRepositoryDto): Promise<UserEntity | null>;
  delete(id: string): Promise<boolean>;
}
