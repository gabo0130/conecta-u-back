export const LOG_LEVELS = [
  'error',
  'warn',
  'info',
  'debug',
  'verbose',
] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];
