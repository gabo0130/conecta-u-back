import type { WorkbookRow } from '../../domain/repositories/collaborator-workbook.interface';
import { emailOf } from './cell-parsers';

export interface RejectedRow {
  sheet: string;
  row: number;
  email: string;
  reason: string;
}

const UNMATCHED_EMAIL =
  'El correo no corresponde a un colaborador importado en este archivo';

/** Resultado de una importación (RF24): creados, rechazados con su causa y advertencias. */
export class ImportReport {
  private readonly importedEmails = new Set<string>();
  private readonly rejected: RejectedRow[] = [];
  private readonly warnings: string[] = [];

  reject(...rows: RejectedRow[]): void {
    this.rejected.push(...rows);
  }

  accept(email: string, proposedSkills: string[]): void {
    this.importedEmails.add(email);
    this.warnings.push(
      ...proposedSkills.map(
        (name) => `Habilidad nueva creada como pendiente: "${name}"`,
      ),
    );
  }

  /** Filas de una hoja hija cuyo correo no quedó importado: se informan, no se pierden. */
  rejectUnmatched(sheet: string, rowsByEmail: Map<string, WorkbookRow[]>) {
    for (const [email, rows] of rowsByEmail) {
      if (!this.importedEmails.has(email)) {
        this.reject(
          ...rows.map(({ row }) => ({
            sheet,
            row,
            email,
            reason: UNMATCHED_EMAIL,
          })),
        );
      }
    }
  }

  toResponse() {
    return {
      created: this.importedEmails.size,
      rejected: this.rejected,
      warnings: this.warnings,
    };
  }
}

export function groupByEmail(rows: WorkbookRow[]): Map<string, WorkbookRow[]> {
  const groups = new Map<string, WorkbookRow[]>();
  for (const row of rows) {
    const email = emailOf(row.values.correo);
    groups.set(email, [...(groups.get(email) ?? []), row]);
  }
  return groups;
}
