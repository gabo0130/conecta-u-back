import type { ValueTransformer } from 'typeorm';

/** `numeric` llega como texto desde Postgres: se convierte a número al leer. */
export const numericTransformer: ValueTransformer = {
  to: (value: number) => value,
  from: (value: string | null) => (value === null ? null : Number(value)),
};
