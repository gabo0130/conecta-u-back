import ExcelJS from 'exceljs';
import { GenerateCollaboratorsTemplateUseCase } from './generate-collaborators-template.use-case';
import {
  COLLABORATOR_HEADERS,
  EXPERIENCE_HEADERS,
  SHEET_COLLABORATORS,
  SHEET_EXPERIENCE,
  SHEET_SKILLS,
  SKILL_HEADERS,
} from '../../shared/constants/import-collaborators.constants';

describe('GenerateCollaboratorsTemplateUseCase', () => {
  const useCase = new GenerateCollaboratorsTemplateUseCase();

  it('generates a workbook with the three required sheets and headers', async () => {
    const buffer = await useCase.execute();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const collaboratorsSheet = workbook.getWorksheet(SHEET_COLLABORATORS);
    const skillsSheet = workbook.getWorksheet(SHEET_SKILLS);
    const experienceSheet = workbook.getWorksheet(SHEET_EXPERIENCE);

    expect(collaboratorsSheet).toBeDefined();
    expect(skillsSheet).toBeDefined();
    expect(experienceSheet).toBeDefined();

    expect(
      (collaboratorsSheet!.getRow(1).values as unknown[]).slice(1),
    ).toEqual([...COLLABORATOR_HEADERS]);
    expect((skillsSheet!.getRow(1).values as unknown[]).slice(1)).toEqual([
      ...SKILL_HEADERS,
    ]);
    expect((experienceSheet!.getRow(1).values as unknown[]).slice(1)).toEqual([
      ...EXPERIENCE_HEADERS,
    ]);
  });
});
