import type { UserRole } from './user-role.type';

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  description?: string;
  isActive?: boolean;
  permissions?: string[];
  children?: MenuItem[];
}

export interface MenuConfig {
  role: UserRole;
  items: MenuItem[];
}

export const MENU_CATALOG: MenuConfig[] = [
  {
    role: 'LIDER',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        path: '/dashboard',
        description: 'Resumen general',
        isActive: true,
      },
      {
        id: 'proyectos',
        label: 'Proyectos',
        icon: 'folder',
        path: '/proyectos',
      },
    ],
  },
  {
    role: 'COLABORADOR',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        path: '/dashboard',
        description: 'Resumen general',
        isActive: true,
      },
      {
        id: 'perfil',
        label: 'Mi perfil',
        icon: 'user',
        path: '/perfil',
      },
    ],
  },
  {
    role: 'ADMIN',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        path: '/dashboard',
        description: 'Resumen general',
        isActive: true,
      },
      {
        id: 'usuarios',
        label: 'Usuarios',
        icon: 'people',
        path: '/users',
      },
      {
        id: 'configuracion',
        label: 'Configuración',
        icon: 'settings',
        path: '/settings',
      },
    ],
  },
];

export function getMenuByRole(role: UserRole): MenuItem[] {
  const config = MENU_CATALOG.find((m) => m.role === role);
  return config?.items ?? [];
}
