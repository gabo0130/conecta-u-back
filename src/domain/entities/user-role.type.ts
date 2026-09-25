export const USER_ROLES = ['LIDER', 'COLABORADOR', 'ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];

// El registro público solo puede crear estas cuentas; ADMIN se crea por seed/gestión de usuarios.
export const REGISTERABLE_ROLES = ['LIDER', 'COLABORADOR'] as const;

export type RegisterableRole = (typeof REGISTERABLE_ROLES)[number];
