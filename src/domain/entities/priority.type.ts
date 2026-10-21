export const PRIORITIES = ['ALTA', 'MEDIA', 'BAJA'] as const;

export type Priority = (typeof PRIORITIES)[number];

/** Cuánto pesa una habilidad según su importancia (también ordena: ALTA primero). */
export const PRIORITY_WEIGHT: Record<Priority, number> = {
  ALTA: 3,
  MEDIA: 2,
  BAJA: 1,
};
