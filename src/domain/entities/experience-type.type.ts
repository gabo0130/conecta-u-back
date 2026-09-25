export const EXPERIENCE_TYPES = [
  'LABORAL',
  'PRACTICA',
  'PROYECTO_ACADEMICO',
  'SEMILLERO_INVESTIGACION',
  'PROYECTO_PERSONAL',
  'VOLUNTARIADO',
  'DOCENCIA',
] as const;

export type ExperienceType = (typeof EXPERIENCE_TYPES)[number];
