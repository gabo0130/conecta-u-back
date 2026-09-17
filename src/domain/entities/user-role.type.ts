export const USER_ROLES = ['LIDER', 'COLABORADOR', 'ADMIN'] as const;

export type UserRole = (typeof USER_ROLES)[number];
