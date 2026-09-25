export const SKILL_TYPES = [
  'CONOCIMIENTO',
  'COMPETENCIA',
  'HABILIDAD_BLANDA',
] as const;

export type SkillType = (typeof SKILL_TYPES)[number];
