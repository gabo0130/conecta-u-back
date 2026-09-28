/** Una fila rechazada al importar (RF24): en qué hoja, qué fila, de quién y por qué. */
export interface ImportRejectedRow {
  sheet: string;
  row: number;
  email: string;
  reason: string;
}

/** Auditoría de una corrida de importación de colaboradores desde Excel. */
export class ImportRunEntity {
  constructor(
    public readonly id: string,
    public readonly fileName: string,
    public readonly importedByUserId: string | null,
    public readonly createdCount: number,
    public readonly rejectedCount: number,
    public readonly rejected: ImportRejectedRow[],
    public readonly warnings: string[],
    public readonly createdAt: Date,
  ) {}
}
