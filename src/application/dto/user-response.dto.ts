import type { MenuItem } from '../../domain/entities/menu-catalog';
import type { UserRole } from '../../domain/entities/user-role.type';

export interface UserResponseDto {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  menu?: MenuItem[];
}
