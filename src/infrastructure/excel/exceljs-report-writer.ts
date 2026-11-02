import { Injectable } from '@nestjs/common';
import { Workbook } from 'exceljs';
import type {
  ReportFormat,
  ReportSheet,
  ReportWriter,
} from '../../domain/repositories/report-writer.interface';

const BRAND_RED = 'FFC8102E';
// Marca de orden de bytes: Excel en español abre el CSV en UTF-8 solo si la trae.
const BOM = String.fromCharCode(0xfeff);
// Excel interpreta como fórmula una celda que empieza por estos caracteres (CSV/Formula injection).
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function cellValue(value: string | number | boolean | Date | null) {
  if (value === null) return '';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'string' && FORMULA_PREFIX.test(value))
    return `'${value}`;
  return value;
}

function csvCell(value: string | number | boolean | Date | null): string {
  const raw = cellValue(value);
  const text =
    raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw);
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Reportes del ADMIN (RF16) en Excel con formato o CSV (`;`, con BOM para Excel en español). */
@Injectable()
export class ExcelJsReportWriter implements ReportWriter {
  async write<T>(sheet: ReportSheet<T>, format: ReportFormat): Promise<Buffer> {
    if (format === 'csv') {
      const lines = [
        sheet.columns.map((column) => csvCell(column.header)).join(';'),
        ...sheet.rows.map((row) =>
          sheet.columns.map((column) => csvCell(column.value(row))).join(';'),
        ),
      ];
      return Buffer.from(`${BOM}${lines.join('\r\n')}\r\n`, 'utf8');
    }

    const workbook = new Workbook();
    workbook.creator = 'Conecta U';
    workbook.created = new Date();
    const worksheet = workbook.addWorksheet(sheet.title.slice(0, 31));
    const lastColumn = sheet.columns.length;

    worksheet.mergeCells(1, 1, 1, lastColumn);
    worksheet.getCell(1, 1).value = sheet.title;
    worksheet.getCell(1, 1).font = {
      bold: true,
      size: 14,
      color: { argb: BRAND_RED },
    };
    worksheet.mergeCells(2, 1, 2, lastColumn);
    worksheet.getCell(2, 1).value = sheet.subtitle;
    worksheet.getCell(2, 1).font = {
      italic: true,
      color: { argb: 'FF6B6F76' },
    };

    const header = worksheet.getRow(4);
    sheet.columns.forEach((column, index) => {
      const cell = header.getCell(index + 1);
      cell.value = column.header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: BRAND_RED },
      };
      cell.alignment = { vertical: 'middle', wrapText: true };
      worksheet.getColumn(index + 1).width = column.width ?? 18;
    });
    header.height = 30;

    sheet.rows.forEach((row, rowIndex) => {
      const excelRow = worksheet.getRow(5 + rowIndex);
      sheet.columns.forEach((column, index) => {
        const value = cellValue(column.value(row));
        const cell = excelRow.getCell(index + 1);
        cell.value = value;
        if (value instanceof Date) cell.numFmt = 'yyyy-mm-dd';
      });
    });

    worksheet.views = [{ state: 'frozen', ySplit: 4 }];
    if (sheet.rows.length > 0) {
      worksheet.autoFilter = {
        from: { row: 4, column: 1 },
        to: { row: 4 + sheet.rows.length, column: lastColumn },
      };
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
