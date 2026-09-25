export const COLLABORATOR_SOURCES = [
  'REGISTRO',
  'ADMIN',
  'IMPORTACION',
] as const;

export type CollaboratorSource = (typeof COLLABORATOR_SOURCES)[number];
