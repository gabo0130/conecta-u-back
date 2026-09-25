// Las celdas de un .xlsx llegan tipadas `unknown`; este archivo las normaliza a string a
// propósito en cada fila leída.
/* eslint-disable @typescript-eslint/no-base-to-string */
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type { SkillType } from '../../domain/entities/skill-type.type';
import type { CollaboratorSkillRepository } from '../../domain/repositories/collaborator-skill.repository.interface';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ExperienceRepository } from '../../domain/repositories/experience.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  COLLABORATOR_REPOSITORY,
  COLLABORATOR_SKILL_REPOSITORY,
  EXPERIENCE_REPOSITORY,
  PROGRAM_REPOSITORY,
  SKILL_REPOSITORY,
} from '../../shared/interfaces/tokens';
import {
  AVAILABILITY_LABELS,
  COLLABORATOR_HEADERS,
  EXPERIENCE_HEADERS,
  EXPERIENCE_TYPE_LABELS,
  LEVEL_LABELS,
  MAX_IMPORT_FILE_SIZE_BYTES,
  PERSON_TYPE_LABELS,
  REQUIRED_SHEETS,
  SHEET_COLLABORATORS,
  SHEET_EXPERIENCE,
  SHEET_SKILLS,
  SKILL_HEADERS,
  SKILL_TYPE_LABELS,
  YES_LABELS,
  normalizeLabel,
} from '../../shared/constants/import-collaborators.constants';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';

export interface RejectedRow {
  sheet: string;
  row: number;
  email: string;
  reason: string;
}

interface SheetRow {
  row: number;
  values: Record<string, unknown>;
}

@Injectable()
export class ImportCollaboratorsUseCase {
  constructor(
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: ProgramRepository,
    @Inject(SKILL_REPOSITORY)
    private readonly skillRepository: SkillRepository,
    @Inject(COLLABORATOR_SKILL_REPOSITORY)
    private readonly collaboratorSkillRepository: CollaboratorSkillRepository,
    @Inject(EXPERIENCE_REPOSITORY)
    private readonly experienceRepository: ExperienceRepository,
  ) {}

  async execute(file: Express.Multer.File) {
    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      throw new BadRequestException({
        message: 'El archivo supera el tamaño máximo permitido (5 MB)',
      });
    }

    const workbook = new ExcelJS.Workbook();
    try {
      // El .d.ts de exceljs declara su propio `Buffer extends ArrayBuffer` global, lo que
      // rompe la compatibilidad estructural con el `Buffer` real de Node en tiempo de
      // compilación; en tiempo de ejecución `file.buffer` sí es un Buffer válido.

      await workbook.xlsx.load(file.buffer as any);
    } catch {
      throw new BadRequestException({
        message: 'No se pudo leer el archivo. Verifica que sea un .xlsx válido',
      });
    }

    for (const sheetName of REQUIRED_SHEETS) {
      if (!workbook.getWorksheet(sheetName)) {
        throw new BadRequestException({
          message: `Falta la hoja "${sheetName}"`,
        });
      }
    }

    const collaboratorsSheet = workbook.getWorksheet(SHEET_COLLABORATORS)!;
    const skillsSheet = workbook.getWorksheet(SHEET_SKILLS)!;
    const experienceSheet = workbook.getWorksheet(SHEET_EXPERIENCE)!;

    this.assertHeaders(
      collaboratorsSheet,
      COLLABORATOR_HEADERS,
      SHEET_COLLABORATORS,
    );
    this.assertHeaders(skillsSheet, SKILL_HEADERS, SHEET_SKILLS);
    this.assertHeaders(experienceSheet, EXPERIENCE_HEADERS, SHEET_EXPERIENCE);

    const rejected: RejectedRow[] = [];
    const warnings: string[] = [];
    let created = 0;

    const collaboratorRows = this.readRows(
      collaboratorsSheet,
      COLLABORATOR_HEADERS,
    );
    const skillRows = this.readRows(skillsSheet, SKILL_HEADERS);
    const experienceRows = this.readRows(experienceSheet, EXPERIENCE_HEADERS);
    const seenEmails = new Set<string>();

    for (const { row, values } of collaboratorRows) {
      const email = String(values.correo ?? '')
        .trim()
        .toLowerCase();

      if (!email) {
        rejected.push({
          sheet: SHEET_COLLABORATORS,
          row,
          email: '',
          reason: 'Correo obligatorio',
        });
        continue;
      }
      if (seenEmails.has(email)) {
        rejected.push({
          sheet: SHEET_COLLABORATORS,
          row,
          email,
          reason: 'Correo duplicado en el archivo',
        });
        continue;
      }

      const nombres = String(values.nombres ?? '').trim();
      const apellidos = String(values.apellidos ?? '').trim();
      const personType =
        PERSON_TYPE_LABELS[normalizeLabel(values.tipo_persona)];
      const availabilityStatus =
        AVAILABILITY_LABELS[normalizeLabel(values.disponibilidad)];
      const autorizaDatos = YES_LABELS.has(
        normalizeLabel(values.autoriza_datos),
      );
      const weeklyHours = Number(values.horas_semana);

      if (!nombres || !apellidos) {
        rejected.push({
          sheet: SHEET_COLLABORATORS,
          row,
          email,
          reason: 'Nombres y apellidos son obligatorios',
        });
        continue;
      }
      if (!personType) {
        rejected.push({
          sheet: SHEET_COLLABORATORS,
          row,
          email,
          reason: 'tipo_persona inválido',
        });
        continue;
      }
      if (!availabilityStatus) {
        rejected.push({
          sheet: SHEET_COLLABORATORS,
          row,
          email,
          reason: 'disponibilidad inválida',
        });
        continue;
      }
      if (!autorizaDatos) {
        rejected.push({
          sheet: SHEET_COLLABORATORS,
          row,
          email,
          reason: 'Debe autorizar el tratamiento de datos',
        });
        continue;
      }
      if (!Number.isFinite(weeklyHours)) {
        rejected.push({
          sheet: SHEET_COLLABORATORS,
          row,
          email,
          reason: 'horas_semana inválida',
        });
        continue;
      }

      const program = await this.programRepository.findByCodeOrName(
        String(values.programa ?? '').trim(),
      );
      if (!program) {
        rejected.push({
          sheet: SHEET_COLLABORATORS,
          row,
          email,
          reason: 'Programa no encontrado',
        });
        continue;
      }

      const existing = await this.collaboratorRepository.findByEmail(email);
      if (existing) {
        rejected.push({
          sheet: SHEET_COLLABORATORS,
          row,
          email,
          reason: 'El correo ya existe en la base de datos',
        });
        continue;
      }

      const semesterRaw = values.semestre;
      const semester =
        semesterRaw !== undefined &&
        semesterRaw !== '' &&
        Number.isFinite(Number(semesterRaw))
          ? Number(semesterRaw)
          : null;

      const collaborator = await this.collaboratorRepository.create({
        email,
        firstName: nombres,
        lastName: apellidos,
        personType,
        programId: program.id,
        semester,
        researchGroup: values.semillero_o_grupo
          ? String(values.semillero_o_grupo).trim()
          : null,
        summary: values.resumen ? String(values.resumen).trim() : null,
        profileUrl: values.enlace ? String(values.enlace).trim() : null,
        dataConsent: true,
        dataConsentAt: new Date(),
        source: 'IMPORTACION',
      });

      await this.collaboratorRepository.update(collaborator.id, {
        availabilityStatus,
        weeklyHours,
      });

      seenEmails.add(email);
      created++;

      await this.importSkillsForCollaborator(
        collaborator.id,
        email,
        skillRows,
        rejected,
        warnings,
      );
      await this.importExperienceForCollaborator(
        collaborator.id,
        email,
        experienceRows,
        rejected,
        warnings,
      );
    }

    return { created, rejected, warnings };
  }

  private async importSkillsForCollaborator(
    collaboratorId: string,
    email: string,
    skillRows: SheetRow[],
    rejected: RejectedRow[],
    warnings: string[],
  ): Promise<void> {
    const rows = skillRows.filter(
      ({ values }) =>
        String(values.correo ?? '')
          .trim()
          .toLowerCase() === email,
    );

    for (const { row, values } of rows) {
      const skillType = SKILL_TYPE_LABELS[normalizeLabel(values.tipo)];
      const level = LEVEL_LABELS[normalizeLabel(values.nivel)];
      const experienceMonths = Number(values.meses_experiencia);
      const skillName = String(values.habilidad ?? '').trim();

      if (
        !skillName ||
        !skillType ||
        !level ||
        !Number.isFinite(experienceMonths)
      ) {
        rejected.push({
          sheet: SHEET_SKILLS,
          row,
          email,
          reason: 'Datos de habilidad incompletos o inválidos',
        });
        continue;
      }

      const skill = await this.resolveOrProposeSkill(
        skillName,
        skillType,
        warnings,
      );
      const lastUsedYear = values.ultimo_uso ? Number(values.ultimo_uso) : null;

      await this.collaboratorSkillRepository.create({
        collaboratorId,
        skillId: skill.id,
        level,
        experienceMonths,
        lastUsedYear: Number.isFinite(lastUsedYear) ? lastUsedYear : null,
      });
    }
  }

  private async importExperienceForCollaborator(
    collaboratorId: string,
    email: string,
    experienceRows: SheetRow[],
    rejected: RejectedRow[],
    warnings: string[],
  ): Promise<void> {
    const rows = experienceRows.filter(
      ({ values }) =>
        String(values.correo ?? '')
          .trim()
          .toLowerCase() === email,
    );

    for (const { row, values } of rows) {
      const type = EXPERIENCE_TYPE_LABELS[normalizeLabel(values.tipo)];
      const level = LEVEL_LABELS[normalizeLabel(values.nivel)];
      const role = String(values.rol ?? '').trim();
      const organization = String(values.organizacion ?? '').trim();
      const startDate = this.parseDate(values.fecha_inicio);
      const current = YES_LABELS.has(normalizeLabel(values.actual));
      const weeklyHours = Number(values.horas_semana);

      if (
        !type ||
        !level ||
        !role ||
        !organization ||
        !startDate ||
        !Number.isFinite(weeklyHours)
      ) {
        rejected.push({
          sheet: SHEET_EXPERIENCE,
          row,
          email,
          reason: 'Datos de experiencia incompletos o inválidos',
        });
        continue;
      }

      const technologyNames = String(values.tecnologias ?? '')
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);

      const skillIds: string[] = [];
      for (const techName of technologyNames) {
        const skill = await this.resolveOrProposeSkill(
          techName,
          'CONOCIMIENTO',
          warnings,
        );
        skillIds.push(skill.id);
      }

      await this.experienceRepository.create({
        collaboratorId,
        type,
        role,
        organization,
        startDate,
        endDate: this.parseDate(values.fecha_fin),
        current,
        weeklyHours,
        level,
        description: values.descripcion
          ? String(values.descripcion).trim()
          : null,
        skillIds,
      });
    }
  }

  private async resolveOrProposeSkill(
    name: string,
    type: SkillType,
    warnings: string[],
  ) {
    const normalized = normalizeSkillName(name);
    const existing =
      await this.skillRepository.findByNormalizedNameOrSynonym(normalized);
    if (existing) {
      return existing;
    }

    warnings.push(`Habilidad nueva creada como pendiente: "${name}"`);
    return this.skillRepository.create({
      name,
      normalizedName: normalized,
      type,
      category: 'OTRA',
      status: 'PENDIENTE',
    });
  }

  private parseDate(value: unknown): string | null {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime())
      ? null
      : parsed.toISOString().slice(0, 10);
  }

  private assertHeaders(
    sheet: ExcelJS.Worksheet,
    headers: readonly string[],
    sheetName: string,
  ): void {
    const headerRow = sheet.getRow(1).values as unknown[];
    const actual = headerRow.slice(1).map((value) => normalizeLabel(value));
    for (const header of headers) {
      if (!actual.includes(header)) {
        throw new BadRequestException({
          message: `Falta la columna "${header}" en la hoja "${sheetName}"`,
        });
      }
    }
  }

  private readRows(
    sheet: ExcelJS.Worksheet,
    headers: readonly string[],
  ): SheetRow[] {
    const headerRow = sheet.getRow(1).values as unknown[];
    const columnIndex = new Map<string, number>();
    headerRow.forEach((value, index) => {
      const label = normalizeLabel(value);
      if (headers.includes(label)) {
        columnIndex.set(label, index);
      }
    });

    const rows: SheetRow[] = [];
    sheet.eachRow((sheetRow, rowNumber) => {
      if (rowNumber === 1) return;
      const rowValues = sheetRow.values as unknown[];
      const isEmpty = rowValues.every(
        (value) => value === undefined || value === null || value === '',
      );
      if (isEmpty) return;

      const values: Record<string, unknown> = {};
      for (const header of headers) {
        const index = columnIndex.get(header);
        values[header] = index !== undefined ? rowValues[index] : undefined;
      }
      rows.push({ row: rowNumber, values });
    });

    return rows;
  }
}
