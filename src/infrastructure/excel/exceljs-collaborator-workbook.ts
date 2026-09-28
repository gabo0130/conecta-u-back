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
  AVAILABILITY_DISPLAY,
  COLLABORATOR_HEADERS,
  EXPERIENCE_HEADERS,
  EXPERIENCE_TYPE_DISPLAY,
  LEVEL_DISPLAY,
  PERSON_TYPE_DISPLAY,
  SHEET_COLLABORATORS,
  SHEET_EXPERIENCE,
  SHEET_GUIDE,
  SHEET_SKILLS,
  SKILL_CATEGORY_DISPLAY,
  SKILL_HEADERS,
  SKILL_TYPE_DISPLAY,
  YES_DISPLAY,
  normalizeLabel,
} from '../../shared/constants/import-collaborators.constants';

/** Última fila hasta la que se repite la validación de datos (desplegables) en las hojas. */
const VALIDATION_LAST_ROW = 500;

/** Una columna con lista fija de valores válidos: alimenta la guía y el desplegable de Excel. */
interface EnumField {
  header: string;
  options: string[];
  allowBlank: boolean;
}

/** Una fila de la hoja "Guía": una por columna de una hoja de datos. */
interface GuideField {
  header: string;
  required: boolean;
  description: string;
  valid: string;
}

interface SheetDefinition {
  name: string;
  headers: readonly string[];
  enumFields: EnumField[];
  guideFields: GuideField[];
}

const enumValues = (display: Record<string, string>) => Object.values(display);

const COLLABORATORS_SHEET: SheetDefinition = {
  name: SHEET_COLLABORATORS,
  headers: COLLABORATOR_HEADERS,
  enumFields: [
    { header: 'tipo_persona', options: enumValues(PERSON_TYPE_DISPLAY), allowBlank: false },
    { header: 'disponibilidad', options: enumValues(AVAILABILITY_DISPLAY), allowBlank: false },
    { header: 'autoriza_datos', options: [YES_DISPLAY, 'No'], allowBlank: false },
  ],
  guideFields: [
    { header: 'correo', required: true, description: 'Correo único de la persona.', valid: 'ana.perez@correo.edu.co' },
    { header: 'nombres', required: true, description: 'Nombres de pila.', valid: 'Ana' },
    { header: 'apellidos', required: true, description: 'Apellidos.', valid: 'Pérez Rojas' },
    { header: 'tipo_persona', required: true, description: 'Tipo de persona.', valid: enumValues(PERSON_TYPE_DISPLAY).join(', ') },
    {
      header: 'programa',
      required: true,
      description: 'Programa académico. Debe coincidir con el nombre o el código de un programa activo del catálogo.',
      valid: 'Ingeniería de Sistemas',
    },
    { header: 'semestre', required: false, description: 'Semestre actual (solo estudiantes).', valid: '5' },
    { header: 'semillero_o_grupo', required: false, description: 'Semillero o grupo de investigación.', valid: 'Semillero de IA' },
    { header: 'resumen', required: false, description: 'Breve descripción del perfil.', valid: 'Texto libre' },
    { header: 'enlace', required: false, description: 'URL a portafolio, LinkedIn o GitHub.', valid: 'https://…' },
    { header: 'disponibilidad', required: true, description: 'Disponibilidad actual.', valid: enumValues(AVAILABILITY_DISPLAY).join(', ') },
    { header: 'horas_semana', required: true, description: 'Horas disponibles por semana.', valid: '4' },
    {
      header: 'autoriza_datos',
      required: true,
      description: 'Autorización de tratamiento de datos. Debe ser "Sí"; de lo contrario la fila se rechaza.',
      valid: YES_DISPLAY,
    },
  ],
};

const SKILLS_SHEET: SheetDefinition = {
  name: SHEET_SKILLS,
  headers: SKILL_HEADERS,
  enumFields: [
    { header: 'tipo', options: enumValues(SKILL_TYPE_DISPLAY), allowBlank: false },
    { header: 'categoria', options: enumValues(SKILL_CATEGORY_DISPLAY), allowBlank: true },
    { header: 'nivel', options: enumValues(LEVEL_DISPLAY), allowBlank: false },
  ],
  guideFields: [
    { header: 'correo', required: true, description: 'Debe coincidir con un correo de la hoja Colaboradores.', valid: 'ana.perez@correo.edu.co' },
    {
      header: 'habilidad',
      required: true,
      description: 'Nombre de la habilidad. Si no existe en el catálogo, se crea como pendiente de revisión.',
      valid: 'Java',
    },
    { header: 'tipo', required: true, description: 'Tipo de habilidad.', valid: enumValues(SKILL_TYPE_DISPLAY).join(', ') },
    {
      header: 'categoria',
      required: false,
      description: 'Solo se usa si la habilidad es nueva (no existe en el catálogo); si ya existe, déjalo vacío.',
      valid: enumValues(SKILL_CATEGORY_DISPLAY).join(', '),
    },
    { header: 'nivel', required: true, description: 'Nivel de dominio.', valid: enumValues(LEVEL_DISPLAY).join(', ') },
    { header: 'meses_experiencia', required: true, description: 'Meses de experiencia con esa habilidad.', valid: '6' },
    { header: 'ultimo_uso', required: false, description: 'Año en que se usó por última vez.', valid: '2025' },
  ],
};

const EXPERIENCE_SHEET: SheetDefinition = {
  name: SHEET_EXPERIENCE,
  headers: EXPERIENCE_HEADERS,
  enumFields: [
    { header: 'tipo', options: enumValues(EXPERIENCE_TYPE_DISPLAY), allowBlank: false },
    { header: 'nivel', options: enumValues(LEVEL_DISPLAY), allowBlank: false },
    { header: 'actual', options: [YES_DISPLAY, 'No'], allowBlank: false },
  ],
  guideFields: [
    { header: 'correo', required: true, description: 'Debe coincidir con un correo de la hoja Colaboradores.', valid: 'ana.perez@correo.edu.co' },
    { header: 'tipo', required: true, description: 'Tipo de experiencia.', valid: enumValues(EXPERIENCE_TYPE_DISPLAY).join(', ') },
    { header: 'rol', required: true, description: 'Rol desempeñado.', valid: 'Desarrolladora' },
    { header: 'organizacion', required: true, description: 'Organización o proyecto.', valid: 'Semillero de Software UFPS' },
    { header: 'fecha_inicio', required: true, description: 'Fecha de inicio, formato AAAA-MM-DD.', valid: '2024-02-01' },
    { header: 'fecha_fin', required: false, description: 'Fecha de fin, formato AAAA-MM-DD. Vacío si "actual" es Sí.', valid: '2024-12-15' },
    { header: 'actual', required: true, description: '¿Sigue vigente?', valid: `${YES_DISPLAY}, No` },
    { header: 'horas_semana', required: true, description: 'Horas dedicadas por semana.', valid: '4' },
    { header: 'nivel', required: true, description: 'Nivel de dominio en esa experiencia.', valid: enumValues(LEVEL_DISPLAY).join(', ') },
    {
      header: 'tecnologias',
      required: false,
      description: 'Tecnologías usadas, separadas por comas. Cada una se busca o se crea en el catálogo.',
      valid: 'React, TypeScript',
    },
    { header: 'descripcion', required: false, description: 'Descripción breve de la experiencia.', valid: 'Texto libre' },
  ],
};

const SHEETS: readonly SheetDefinition[] = [
  COLLABORATORS_SHEET,
  SKILLS_SHEET,
  EXPERIENCE_SHEET,
];

/** Adaptador ExcelJS de la plantilla "Plantilla Carga Colaboradores – Conecta U.xlsx". */
@Injectable()
export class ExcelJsCollaboratorWorkbook
  implements CollaboratorWorkbookReader, CollaboratorTemplateWriter
{
  async read(content: Uint8Array): Promise<CollaboratorWorkbook> {
    const workbook = await this.load(content);
    const [collaborators, skills, experience] = SHEETS.map(({ name, headers }) =>
      readSheet(workbook, name, headers),
    );
    return { collaborators, skills, experience };
  }

  async write(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    writeGuideSheet(workbook);
    for (const definition of SHEETS) {
      writeDataSheet(workbook, definition);
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

/** Hoja "Guía": una tabla de referencia por hoja de datos, generada desde su propio contrato. */
function writeGuideSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet(SHEET_GUIDE);
  sheet.columns = [
    { width: 22 },
    { width: 12 },
    { width: 50 },
    { width: 45 },
  ];

  for (const { name, guideFields } of SHEETS) {
    const title = sheet.addRow([`Hoja: ${name}`]);
    title.font = { bold: true, size: 13 };
    sheet.addRow([]);

    const header = sheet.addRow(['Campo', 'Obligatorio', 'Qué es', 'Valores válidos / ejemplo']);
    header.font = { bold: true };

    for (const field of guideFields) {
      sheet.addRow([field.header, field.required ? 'Sí' : 'No', field.description, field.valid]);
    }
    sheet.addRow([]);
  }
}

/** Hoja de datos: encabezado, encabezado congelado y desplegable en cada columna de valores fijos. */
function writeDataSheet(workbook: ExcelJS.Workbook, definition: SheetDefinition): void {
  const sheet = workbook.addWorksheet(definition.name);
  sheet.addRow([...definition.headers]);
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  for (const field of definition.enumFields) {
    const column = definition.headers.indexOf(field.header) + 1;
    // Lista inline como texto literal (no un rango a una hoja auxiliar): mantiene la plantilla
    // liviana, sin hojas ni nombres definidos adicionales.
    const formula = `"${field.options.join(',')}"`;
    for (let row = 2; row <= VALIDATION_LAST_ROW; row++) {
      sheet.getCell(row, column).dataValidation = {
        type: 'list',
        allowBlank: field.allowBlank,
        formulae: [formula],
        showErrorMessage: true,
        errorStyle: 'stop',
        errorTitle: 'Valor inválido',
        error: `Elige uno de estos valores: ${field.options.join(', ')}.`,
      };
    }
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
