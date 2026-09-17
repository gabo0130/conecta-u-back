export const AVAILABILITY_STATUSES = [
  'DISPONIBLE',
  'PARCIAL',
  'NO_DISPONIBLE',
] as const;

export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];
