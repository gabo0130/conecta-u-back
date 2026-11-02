import { Workbook } from 'exceljs';
import { ExcelJsReportWriter } from './exceljs-report-writer';

interface Row {
  name: string;
  count: number;
  ok: boolean;
  at: Date | null;
}

describe('ExcelJsReportWriter', () => {
  const writer = new ExcelJsReportWriter();
  const sheet = {
    title: 'Reporte de prueba',
    subtitle: 'generado hoy',
    columns: [
      { header: 'Nombre', value: (row: Row) => row.name },
      { header: 'Cantidad', value: (row: Row) => row.count },
      { header: 'Activo', value: (row: Row) => row.ok },
      { header: 'Fecha', value: (row: Row) => row.at },
    ],
    rows: [
      {
        name: '=HYPERLINK("x")',
        count: 2,
        ok: true,
        at: new Date('2026-11-01T00:00:00Z'),
      },
      { name: 'Pérez; "Ana"', count: 0, ok: false, at: null },
    ],
  };

  it('writes CSV with BOM, semicolons, quoting and formula neutralization', async () => {
    const csv = (await writer.write(sheet, 'csv')).toString('utf8');

    expect(csv.startsWith('﻿Nombre;Cantidad;Activo;Fecha\r\n')).toBe(true);
    expect(csv).toContain(`"'=HYPERLINK(""x"")";2;Sí;2026-11-01`);
    expect(csv).toContain('"Pérez; ""Ana""";0;No;');
  });

  it('writes an Excel sheet with title, header and data rows', async () => {
    const buffer = await writer.write(sheet, 'xlsx');
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const worksheet = workbook.worksheets[0];

    expect(worksheet.getCell('A1').value).toBe('Reporte de prueba');
    expect(worksheet.getCell('A4').value).toBe('Nombre');
    expect(worksheet.getCell('A5').value).toBe(`'=HYPERLINK("x")`);
    expect(worksheet.getCell('C6').value).toBe('No');
  });
});
