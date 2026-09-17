import type { MenuItem } from '../../domain/entities/menu-catalog';
import type { UserRole } from '../../domain/entities/user-role.type';

export interface LoginResponseDto {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    program: string | null;
    menu: MenuItem[];
  };
}
