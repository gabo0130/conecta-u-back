export const SKILL_TYPES = ['CONOCIMIENTO', 'COMPETENCIA'] as const;

export type SkillType = (typeof SKILL_TYPES)[number];
