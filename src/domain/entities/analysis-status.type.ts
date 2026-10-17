export const ANALYSIS_STATUSES = ['PENDIENTE', 'COMPLETADO', 'ERROR'] as const;

export type AnalysisStatus = (typeof ANALYSIS_STATUSES)[number];
