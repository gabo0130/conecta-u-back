export const SKILL_CATEGORIES = [
  'LENGUAJE',
  'FRAMEWORK',
  'BASE_DATOS',
  'NUBE_DEVOPS',
  'DATOS_IA',
  'DISENO_UX',
  'HERRAMIENTA',
  'METODOLOGIA',
  'GESTION',
  'COMUNICACION',
  'TRABAJO_EQUIPO',
  'LIDERAZGO',
  'OTRA',
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];
