export const REPORT_FORMATS = ['xlsx', 'csv'] as const;
export type ReportFormat = (typeof REPORT_FORMATS)[number];

export interface ReportColumn<T> {
  header: string;
  value: (row: T) => string | number | boolean | Date | null;
  width?: number;
}

export interface ReportSheet<T> {
  title: string;
  /** Línea de contexto bajo el título (fecha de generación, filtros…). */
  subtitle: string;
  columns: ReportColumn<T>[];
  rows: T[];
}

export interface ReportWriter {
  write<T>(sheet: ReportSheet<T>, format: ReportFormat): Promise<Buffer>;
}
