export const SKILL_STATUSES = ['ACTIVA', 'PENDIENTE'] as const;

export type SkillStatus = (typeof SKILL_STATUSES)[number];
