/** Valor de una celda ya reducido a un primitivo (sin texto enriquecido ni fórmulas). */
export type CellValue = string | number | boolean | Date | null;

export interface WorkbookRow {
  /** Número de fila en la hoja, para reportar rechazos (RF24). */
  row: number;
  values: Record<string, CellValue>;
}

/** Contenido de la plantilla de carga de colaboradores, hoja por hoja (RF23). */
export interface CollaboratorWorkbook {
  collaborators: WorkbookRow[];
  skills: WorkbookRow[];
  experience: WorkbookRow[];
}

/** El archivo no es un .xlsx legible o no respeta las hojas y columnas de la plantilla. */
export class InvalidWorkbookError extends Error {}

export interface CollaboratorWorkbookReader {
  /** @throws InvalidWorkbookError */
  read(content: Uint8Array): Promise<CollaboratorWorkbook>;
}

export interface CollaboratorTemplateWriter {
  write(): Promise<Uint8Array>;
}
