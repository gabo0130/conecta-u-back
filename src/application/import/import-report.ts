import type { ImportRejectedRow } from '../../domain/entities/import-run.entity';
import type { WorkbookRow } from '../../domain/repositories/collaborator-workbook.interface';
import { emailOf } from './cell-parsers';
import { documentNumberOf } from './collaborator-row.parsers';

export type RejectedRow = ImportRejectedRow;

const UNMATCHED_PERSON =
  'El documento o el correo no corresponde a un colaborador importado en este archivo';

/**
 * Llave con la que una fila de Habilidades o Experiencia se asocia a su persona (v2.1): el
 * documento; si viene vacío, el correo (compatibilidad con cargas anteriores).
 */
export function personKeyOf(values: WorkbookRow['values']): string {
  const documentNumber = documentNumberOf(values.numero_documento);
  return documentNumber
    ? documentKey(documentNumber)
    : emailKey(emailOf(values.correo));
}

export const documentKey = (documentNumber: string) =>
  `documento:${documentNumber}`;
export const emailKey = (email: string) => `correo:${email}`;

/** Resultado de una importación (RF24): creados, rechazados con su causa y advertencias. */
export class ImportReport {
  private created = 0;
  private readonly importedKeys = new Set<string>();
  private readonly rejected: RejectedRow[] = [];
  private readonly warnings: string[] = [];

  reject(...rows: RejectedRow[]): void {
    this.rejected.push(...rows);
  }

  /** `keys`: las llaves por las que sus filas hijas pueden encontrarla (documento y correo). */
  accept(keys: string[], proposedSkills: string[]): void {
    this.created++;
    keys.forEach((key) => this.importedKeys.add(key));
    this.warnings.push(
      ...proposedSkills.map(
        (name) => `Habilidad nueva creada como pendiente: "${name}"`,
      ),
    );
  }

  /** Filas de una hoja hija cuya persona no quedó importada: se informan, no se pierden. */
  rejectUnmatched(sheet: string, rowsByPerson: Map<string, WorkbookRow[]>) {
    for (const [key, rows] of rowsByPerson) {
      if (!this.importedKeys.has(key)) {
        this.reject(
          ...rows.map(({ row, values }) => ({
            sheet,
            row,
            email: emailOf(values.correo),
            reason: UNMATCHED_PERSON,
          })),
        );
      }
    }
  }

  toResponse() {
    return {
      created: this.created,
      rejected: this.rejected,
      warnings: this.warnings,
    };
  }
}

export function groupByPerson(rows: WorkbookRow[]): Map<string, WorkbookRow[]> {
  const groups = new Map<string, WorkbookRow[]>();
  for (const row of rows) {
    const key = personKeyOf(row.values);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return groups;
}
