import type { TextLength } from './text-rules';

// Longitudes de usuarios, proyectos y catálogo: coinciden con sus columnas.
// Las del perfil técnico del colaborador están en `collaborator-limits.ts`.
export const USER_FULL_NAME_LENGTH: TextLength = { min: 2, max: 120 };
export const PROJECT_TITLE_LENGTH: TextLength = { min: 3, max: 160 };
export const DELIVERABLE_NAME_MAX_LENGTH = 140;
export const SKILL_NAME_MAX_LENGTH = 80;
