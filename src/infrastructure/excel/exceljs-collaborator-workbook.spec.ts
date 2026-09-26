import ExcelJS from 'exceljs';
import { ExcelJsCollaboratorWorkbook } from './exceljs-collaborator-workbook';
import { InvalidWorkbookError } from '../../domain/repositories/collaborator-workbook.interface';
import {
  COLLABORATOR_HEADERS,
  EXPERIENCE_HEADERS,
  SHEET_COLLABORATORS,
  SHEET_EXPERIENCE,
  SHEET_SKILLS,
  SKILL_HEADERS,
} from '../../shared/constants/import-collaborators.constants';

async function toBuffer(workbook: ExcelJS.Workbook): Promise<Buffer> {
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function templateWorkbook(skip?: string): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  for (const [name, headers] of [
    [SHEET_COLLABORATORS, COLLABORATOR_HEADERS],
    [SHEET_SKILLS, SKILL_HEADERS],
    [SHEET_EXPERIENCE, EXPERIENCE_HEADERS],
  ] as const) {
    if (name !== skip) {
      workbook.addWorksheet(name).addRow([...headers]);
    }
  }
  return workbook;
}

describe('ExcelJsCollaboratorWorkbook', () => {
  const adapter = new ExcelJsCollaboratorWorkbook();

  it('writes a template with the three sheets and their headers', async () => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(
      (await adapter.write()) as unknown as ExcelJS.Buffer,
    );

    expect(
      (
        workbook.getWorksheet(SHEET_SKILLS)!.getRow(1).values as unknown[]
      ).slice(1),
    ).toEqual([...SKILL_HEADERS]);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      SHEET_COLLABORATORS,
      SHEET_SKILLS,
      SHEET_EXPERIENCE,
    ]);
  });

  it('reads rows as primitives keyed by header, skipping empty rows', async () => {
    const workbook = templateWorkbook();
    const sheet = workbook.getWorksheet(SHEET_COLLABORATORS)!;
    const row = sheet.addRow([]);
    row.getCell(1).value = {
      richText: [{ text: 'ana@' }, { text: 'example.com' }],
    };
    row.getCell(2).value = 'Ana';
    row.getCell(11).value = { formula: '5*2', result: 10 };
    sheet.addRow([]);
    sheet.addRow(['   ']);

    const result = await adapter.read(await toBuffer(workbook));

    expect(result.collaborators).toHaveLength(1);
    expect(result.collaborators[0].row).toBe(2);
    expect(result.collaborators[0].values).toEqual(
      expect.objectContaining({
        correo: 'ana@example.com',
        nombres: 'Ana',
        horas_semana: 10,
        apellidos: null,
      }),
    );
    expect(result.skills).toEqual([]);
  });

  it('matches headers regardless of order, case and accents', async () => {
    const workbook = templateWorkbook(SHEET_SKILLS);
    const reordered = [...SKILL_HEADERS]
      .reverse()
      .map((header) =>
        header === 'categoria' ? 'Categoría' : header.toUpperCase(),
      );
    const sheet = workbook.addWorksheet(SHEET_SKILLS);
    sheet.addRow(reordered);
    sheet.addRow([
      2025,
      12,
      'Avanzado',
      'Lenguaje',
      'Conocimiento',
      'Go',
      'a@b.co',
    ]);

    const result = await adapter.read(await toBuffer(workbook));

    expect(result.skills[0].values).toEqual(
      expect.objectContaining({
        correo: 'a@b.co',
        habilidad: 'Go',
        ultimo_uso: 2025,
      }),
    );
  });

  it('rejects a workbook without a required sheet', async () => {
    const buffer = await toBuffer(templateWorkbook(SHEET_EXPERIENCE));

    await expect(adapter.read(buffer)).rejects.toThrow(
      new InvalidWorkbookError('Falta la hoja "Experiencia"'),
    );
  });

  it('rejects a sheet with a missing column', async () => {
    const workbook = templateWorkbook(SHEET_SKILLS);
    workbook
      .addWorksheet(SHEET_SKILLS)
      .addRow(SKILL_HEADERS.filter((header) => header !== 'nivel'));

    await expect(adapter.read(await toBuffer(workbook))).rejects.toThrow(
      'Falta la columna "nivel" en la hoja "Habilidades"',
    );
  });

  it('rejects content that is not an xlsx file', async () => {
    await expect(
      adapter.read(Buffer.from('no es un excel')),
    ).rejects.toBeInstanceOf(InvalidWorkbookError);
  });
});
