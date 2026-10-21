/** Origen de un perfil requerido (HU-10): lo propuso la IA o lo agregó el líder a mano. */
export const REQUIRED_PROFILE_SOURCES = ['IA', 'MANUAL'] as const;

export type RequiredProfileSource = (typeof REQUIRED_PROFILE_SOURCES)[number];
