export const PERSON_TYPES = ['ESTUDIANTE', 'DOCENTE'] as const;

export type PersonType = (typeof PERSON_TYPES)[number];
