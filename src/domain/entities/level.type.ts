export const LEVELS = ['BASICO', 'INTERMEDIO', 'AVANZADO', 'EXPERTO'] as const;

export type Level = (typeof LEVELS)[number];
