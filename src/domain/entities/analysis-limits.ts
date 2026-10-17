// RT7: límites de consumo del análisis con IA, y forma esperada de su salida.
export const MAX_ANALYSES_PER_DAY = 5;
// Los tiempos (presupuesto total y umbral de análisis interrumpido) dependen de la
// configuración: ver `application/analysis/analysis-timeouts.ts`.

export const PROFILES_PER_ANALYSIS = { min: 1, max: 5 } as const;
export const SKILLS_PER_PROFILE = { min: 2, max: 8 } as const;
export const PROFILE_QUANTITY = { min: 1, max: 10 } as const;
export const PROFILE_NAME_MAX_LENGTH = 120;
export const SKILL_RAW_NAME_MAX_LENGTH = 80;
/** Un perfil que agrega el líder a mano pide al menos una habilidad (los de la IA, dos). */
export const MANUAL_SKILLS_PER_PROFILE = {
  min: 1,
  max: SKILLS_PER_PROFILE.max,
} as const;
export const PROFILE_TEXT_MAX_LENGTH = 2000;
export const PROFILE_WEEKLY_HOURS = { min: 1, max: 60 } as const;
