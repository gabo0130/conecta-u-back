import { USER_ROLES } from './user-role.type';

const ROLE_NAMES: Record<(typeof USER_ROLES)[number], string> = {
  LIDER: 'Líder de proyecto',
  COLABORADOR: 'Colaborador',
  ADMIN: 'Administrador',
};

export const ROLES_CATALOG = USER_ROLES.map((roleKey) => ({
  id: `role_${roleKey}`,
  key: roleKey,
  name: ROLE_NAMES[roleKey],
}));
