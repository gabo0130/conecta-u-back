import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import {
  COLLABORATOR_HEADERS,
  EXPERIENCE_HEADERS,
  SHEET_COLLABORATORS,
  SHEET_EXPERIENCE,
  SHEET_SKILLS,
  SKILL_HEADERS,
} from '../../shared/constants/import-collaborators.constants';

@Injectable()
export class GenerateCollaboratorsTemplateUseCase {
  async execute(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    workbook
      .addWorksheet(SHEET_COLLABORATORS)
      .addRow([...COLLABORATOR_HEADERS]);
    workbook.addWorksheet(SHEET_SKILLS).addRow([...SKILL_HEADERS]);
    workbook.addWorksheet(SHEET_EXPERIENCE).addRow([...EXPERIENCE_HEADERS]);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
