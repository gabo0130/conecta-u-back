import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import {
  type CellValue,
  type CollaboratorTemplateWriter,
  type CollaboratorWorkbook,
  type CollaboratorWorkbookReader,
  InvalidWorkbookError,
  type WorkbookRow,
} from '../../domain/repositories/collaborator-workbook.interface';
import {
  COLLABORATOR_HEADERS,
  EXPERIENCE_HEADERS,
  SHEET_COLLABORATORS,
  SHEET_EXPERIENCE,
  SHEET_SKILLS,
  SKILL_HEADERS,
  normalizeLabel,
} from '../../shared/constants/import-collaborators.constants';

const SHEETS = [
  { name: SHEET_COLLABORATORS, headers: COLLABORATOR_HEADERS },
  { name: SHEET_SKILLS, headers: SKILL_HEADERS },
  { name: SHEET_EXPERIENCE, headers: EXPERIENCE_HEADERS },
] as const;

/** Adaptador ExcelJS de la plantilla "Plantilla Carga Colaboradores – Conecta U.xlsx". */
@Injectable()
export class ExcelJsCollaboratorWorkbook
  implements CollaboratorWorkbookReader, CollaboratorTemplateWriter
{
  async read(content: Uint8Array): Promise<CollaboratorWorkbook> {
    const workbook = await this.load(content);
    const [collaborators, skills, experience] = SHEETS.map(
      ({ name, headers }) => readSheet(workbook, name, headers),
    );
    return { collaborators, skills, experience };
  }

  async write(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    for (const { name, headers } of SHEETS) {
      workbook.addWorksheet(name).addRow([...headers]);
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private async load(content: Uint8Array): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    try {
      // Los tipos de exceljs declaran su propio `Buffer`, incompatible en compilación con el
      // de Node; en ejecución es el mismo objeto.
      await workbook.xlsx.load(content as unknown as ExcelJS.Buffer);
    } catch {
      throw new InvalidWorkbookError(
        'No se pudo leer el archivo. Verifica que sea un .xlsx válido',
      );
    }
    return workbook;
  }
}

function readSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  headers: readonly string[],
): WorkbookRow[] {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    throw new InvalidWorkbookError(`Falta la hoja "${sheetName}"`);
  }

  const columnIndex = headerColumns(sheet);
  const missing = headers.find((header) => !columnIndex.has(header));
  if (missing) {
    throw new InvalidWorkbookError(
      `Falta la columna "${missing}" en la hoja "${sheetName}"`,
    );
  }

  const rows: WorkbookRow[] = [];
  sheet.eachRow((sheetRow, rowNumber) => {
    if (rowNumber === 1) return;
    const values: Record<string, CellValue> = {};
    for (const header of headers) {
      values[header] = toCellValue(sheetRow.getCell(columnIndex.get(header)!));
    }
    if (Object.values(values).some((value) => value !== null)) {
      rows.push({ row: rowNumber, values });
    }
  });
  return rows;
}

function headerColumns(sheet: ExcelJS.Worksheet): Map<string, number> {
  const columns = new Map<string, number>();
  sheet.getRow(1).eachCell((cell, column) => {
    columns.set(normalizeLabel(cell.text), column);
  });
  return columns;
}

/** Reduce texto enriquecido, hipervínculos y fórmulas a su valor visible. */
function toCellValue(cell: ExcelJS.Cell): CellValue {
  const { value } = cell;
  if (value === null || value === undefined) return null;
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date
  ) {
    return typeof value === 'string' && value.trim() === '' ? null : value;
  }
  if ('result' in value) {
    const result = value.result;
    return result instanceof Date ||
      typeof result === 'string' ||
      typeof result === 'number' ||
      typeof result === 'boolean'
      ? result
      : null;
  }
  const text = cell.text.trim();
  return text === '' ? null : text;
}
