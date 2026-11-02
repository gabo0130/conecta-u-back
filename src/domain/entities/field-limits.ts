import type { TextLength } from './text-rules';

// Longitudes de usuarios, proyectos y catálogo: coinciden con sus columnas.
// Las del perfil técnico del colaborador están en `collaborator-limits.ts`.
export const USER_FULL_NAME_LENGTH: TextLength = { min: 2, max: 120 };
export const PROJECT_TITLE_LENGTH: TextLength = { min: 3, max: 160 };
export const DELIVERABLE_NAME_MAX_LENGTH = 140;
// v2.2, E5: entidades del proyecto y duración (CHECK 1–60 en la columna).
export const PROJECT_ENTITY_MAX_LENGTH = 150;
export const PROJECT_DURATION_MONTHS = { min: 1, max: 60 } as const;
export const SKILL_NAME_MAX_LENGTH = 80;

// Catálogos gestionables por el ADMIN (RF18): límites acordes a sus columnas.
export const PROGRAM_CODE_LENGTH: TextLength = { min: 2, max: 20 };
export const PROGRAM_NAME_LENGTH: TextLength = { min: 2, max: 120 };
export const PROGRAM_FACULTY_MAX_LENGTH = 120;
export const PROJECT_TYPE_CODE_LENGTH: TextLength = { min: 2, max: 40 };
export const PROJECT_TYPE_NAME_LENGTH: TextLength = { min: 2, max: 80 };
export const PROJECT_CATEGORY_NAME_LENGTH: TextLength = { min: 2, max: 80 };
export const TEMPLATE_FIELD_KEY_MAX_LENGTH = 60;
export const TEMPLATE_FIELD_LABEL_MAX_LENGTH = 80;
export const TEMPLATE_FIELD_OPTION_MAX_LENGTH = 80;
