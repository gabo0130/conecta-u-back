export const PROJECT_STATUSES = [
  'BORRADOR',
  'EN_ANALISIS',
  'ANALIZADO',
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
