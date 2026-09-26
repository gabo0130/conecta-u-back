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
      // RF3: un líder también puede tener (o crear) su perfil técnico de colaborador.
      {
        id: 'perfil',
        label: 'Mi perfil',
        icon: 'user',
        path: '/perfil',
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
      // El ADMIN ve todo: proyectos de todos los líderes, todos los perfiles técnicos,
      // cuentas de usuario e importación de colaboradores desde Excel.
      {
        id: 'proyectos',
        label: 'Proyectos',
        icon: 'folder',
        path: '/proyectos',
      },
      {
        id: 'colaboradores',
        label: 'Colaboradores',
        icon: 'profiles',
        path: '/colaboradores',
      },
      {
        id: 'usuarios',
        label: 'Usuarios',
        icon: 'people',
        path: '/users',
      },
      {
        id: 'importar',
        label: 'Importar Excel',
        icon: 'upload',
        path: '/importar',
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
