import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { consentFields } from '../../domain/entities/data-consent';
import type { SkillEntity } from '../../domain/entities/skill.entity';
import {
  type CollaboratorWorkbook,
  type CollaboratorWorkbookReader,
  InvalidWorkbookError,
  type WorkbookRow,
} from '../../domain/repositories/collaborator-workbook.interface';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
import type { ImportRunRepository } from '../../domain/repositories/import-run.repository.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type {
  TransactionalRepositories,
  UnitOfWork,
} from '../../domain/repositories/unit-of-work.interface';
import {
  SHEET_COLLABORATORS,
  SHEET_EXPERIENCE,
  SHEET_SKILLS,
} from '../../shared/constants/import-collaborators.constants';
import {
  COLLABORATOR_REPOSITORY,
  COLLABORATOR_WORKBOOK_READER,
  IMPORT_RUN_REPOSITORY,
  PROGRAM_REPOSITORY,
  UNIT_OF_WORK,
} from '../../shared/interfaces/tokens';
import { AppLoggerService } from '../../shared/logging/logger.service';
import { emailOf } from '../import/cell-parsers';
import {
  type ParseResult,
  type ParsedCollaborator,
  type ParsedExperience,
  type ParsedSkill,
  parseCollaboratorRow,
  parseExperienceRow,
  parseSkillRow,
} from '../import/collaborator-row.parsers';
import {
  ImportReport,
  type RejectedRow,
  groupByEmail,
} from '../import/import-report';
import {
  type SkillProposal,
  resolveOrProposeSkill,
} from '../support/skill-resolver';

interface ValidRow<T> {
  row: number;
  value: T;
}

/** Colaborador validado, listo para guardarse con sus habilidades y experiencia. */
interface CollaboratorImport {
  row: number;
  collaborator: ParsedCollaborator;
  programId: string;
  skills: ValidRow<ParsedSkill>[];
  experience: ValidRow<ParsedExperience>[];
  /** Filas hijas inválidas: se informan solo si el colaborador se guarda. */
  childRejections: RejectedRow[];
}

/** Estado compartido mientras se recorren las filas de la hoja Colaboradores. */
interface ImportContext {
  report: ImportReport;
  seenEmails: Set<string>;
  skillRows: Map<string, WorkbookRow[]>;
  experienceRows: Map<string, WorkbookRow[]>;
}

/** Lo que produce guardar un colaborador dentro de su transacción. */
interface SaveContext {
  repositories: TransactionalRepositories;
  collaboratorId: string;
  email: string;
  proposedSkills: string[];
  rejected: RejectedRow[];
}

const SAVE_FAILED =
  'No se pudo guardar el colaborador ni sus habilidades o experiencia';

/**
 * RF23–RF24: importa colaboradores desde la plantilla Excel. Cada colaborador se guarda
 * con sus habilidades y experiencia en una sola transacción (RNF9): o entra completo o se
 * reporta como rechazado, sin cortar el resto de la carga.
 */
@Injectable()
export class ImportCollaboratorsUseCase {
  private readonly logger: ReturnType<AppLoggerService['forContext']>;

  constructor(
    @Inject(COLLABORATOR_WORKBOOK_READER)
    private readonly workbookReader: CollaboratorWorkbookReader,
    @Inject(COLLABORATOR_REPOSITORY)
    private readonly collaboratorRepository: CollaboratorRepository,
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: ProgramRepository,
    @Inject(IMPORT_RUN_REPOSITORY)
    private readonly importRunRepository: ImportRunRepository,
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(ImportCollaboratorsUseCase.name);
  }

  /**
   * @param content el .xlsx subido; su tamaño ya lo limitó la capa HTTP.
   * @param fileName nombre original del archivo, para el historial de importaciones.
   * @param importedByUserId admin que ejecuta la carga, para el historial.
   */
  async execute(
    content: Uint8Array,
    fileName: string,
    importedByUserId: string,
  ) {
    const workbook = await this.readWorkbook(content);
    const context: ImportContext = {
      report: new ImportReport(),
      seenEmails: new Set(),
      skillRows: groupByEmail(workbook.skills),
      experienceRows: groupByEmail(workbook.experience),
    };

    for (const row of workbook.collaborators) {
      await this.importRow(row, context);
    }

    context.report.rejectUnmatched(SHEET_SKILLS, context.skillRows);
    context.report.rejectUnmatched(SHEET_EXPERIENCE, context.experienceRows);
    const response = context.report.toResponse();

    const run = await this.importRunRepository.create({
      fileName,
      importedByUserId,
      createdCount: response.created,
      rejected: response.rejected,
      warnings: response.warnings,
    });

    return { id: run.id, ...response };
  }

  private async readWorkbook(
    content: Uint8Array,
  ): Promise<CollaboratorWorkbook> {
    try {
      return await this.workbookReader.read(content);
    } catch (error) {
      if (error instanceof InvalidWorkbookError) {
        throw new BadRequestException({ message: error.message });
      }
      throw error;
    }
  }

  private async importRow(
    { row, values }: WorkbookRow,
    context: ImportContext,
  ): Promise<void> {
    const email = emailOf(values.correo);
    const reject = (reason: string) =>
      context.report.reject({ sheet: SHEET_COLLABORATORS, row, email, reason });

    const prepared = await this.prepare(row, values, email, context);
    if (!prepared.ok) {
      reject(prepared.reason);
      return;
    }

    const saved = await this.save(prepared.value);
    if (!saved) {
      reject(SAVE_FAILED);
      return;
    }
    context.report.reject(...prepared.value.childRejections, ...saved.rejected);
    context.report.accept(email, saved.proposedSkills);
  }

  /** Valida la fila y sus filas hijas sin escribir nada. */
  private async prepare(
    row: number,
    values: WorkbookRow['values'],
    email: string,
    context: ImportContext,
  ): Promise<ParseResult<CollaboratorImport>> {
    if (email && context.seenEmails.has(email)) {
      return { ok: false, reason: 'Correo duplicado en el archivo' };
    }
    context.seenEmails.add(email);

    const parsed = parseCollaboratorRow(values);
    if (!parsed.ok) return parsed;

    const resolved = await this.resolveNewCollaborator(parsed.value);
    if (!resolved.ok) return resolved;

    const childRejections: RejectedRow[] = [];
    return {
      ok: true,
      value: {
        row,
        collaborator: parsed.value,
        programId: resolved.value.programId,
        skills: validRows(
          context.skillRows.get(email),
          parseSkillRow,
          SHEET_SKILLS,
          childRejections,
        ),
        experience: validRows(
          context.experienceRows.get(email),
          parseExperienceRow,
          SHEET_EXPERIENCE,
          childRejections,
        ),
        childRejections,
      },
    };
  }

  /** Resuelve el programa y confirma que el correo es nuevo antes de abrir la transacción. */
  private async resolveNewCollaborator(
    collaborator: ParsedCollaborator,
  ): Promise<ParseResult<{ programId: string }>> {
    const program = await this.programRepository.findByCodeOrName(
      collaborator.program,
    );
    if (!program || !program.active) {
      return { ok: false, reason: 'Programa no encontrado' };
    }
    if (await this.collaboratorRepository.findByEmail(collaborator.email)) {
      return { ok: false, reason: 'El correo ya existe en la base de datos' };
    }
    return { ok: true, value: { programId: program.id } };
  }

  private async save(data: CollaboratorImport): Promise<SaveContext | null> {
    try {
      return await this.unitOfWork.run(async (repositories) => {
        const context: SaveContext = {
          repositories,
          collaboratorId: await this.createCollaborator(repositories, data),
          email: data.collaborator.email,
          proposedSkills: [],
          rejected: [],
        };
        await this.saveSkills(context, data.skills);
        await this.saveExperience(context, data.experience);
        return context;
      });
    } catch (error) {
      this.logger.error('No se pudo importar un colaborador', error, {
        method: 'save',
        row: data.row,
      });
      return null;
    }
  }

  private async createCollaborator(
    repositories: TransactionalRepositories,
    { collaborator, programId }: CollaboratorImport,
  ): Promise<string> {
    const { id } = await repositories.collaborators.create({
      email: collaborator.email,
      firstName: collaborator.firstName,
      lastName: collaborator.lastName,
      personType: collaborator.personType,
      programId,
      semester: collaborator.semester,
      researchGroup: collaborator.researchGroup,
      summary: collaborator.summary,
      profileUrl: collaborator.profileUrl,
      availabilityStatus: collaborator.availabilityStatus,
      weeklyHours: collaborator.weeklyHours,
      ...consentFields(true),
      source: 'IMPORTACION',
    });
    return id;
  }

  private async saveSkills(
    context: SaveContext,
    skills: ValidRow<ParsedSkill>[],
  ): Promise<void> {
    const addedSkillIds = new Set<string>();
    for (const { row, value } of skills) {
      const skill = await this.resolveSkill(context, value);
      // "React" y "ReactJS" resuelven a la misma habilidad del catálogo.
      if (addedSkillIds.has(skill.id)) {
        context.rejected.push({
          sheet: SHEET_SKILLS,
          row,
          email: context.email,
          reason: `Habilidad repetida para este colaborador: ${skill.name}`,
        });
        continue;
      }
      addedSkillIds.add(skill.id);
      await context.repositories.collaboratorSkills.create({
        collaboratorId: context.collaboratorId,
        skillId: skill.id,
        level: value.level,
        experienceMonths: value.experienceMonths,
        lastUsedYear: value.lastUsedYear,
      });
    }
  }

  private async saveExperience(
    context: SaveContext,
    experience: ValidRow<ParsedExperience>[],
  ): Promise<void> {
    for (const { value } of experience) {
      const technologyIds = new Set<string>();
      for (const name of value.technologies) {
        const skill = await this.resolveSkill(context, {
          name,
          type: 'CONOCIMIENTO',
        });
        technologyIds.add(skill.id);
      }
      await context.repositories.experiences.create({
        collaboratorId: context.collaboratorId,
        type: value.type,
        role: value.role,
        organization: value.organization,
        startDate: value.startDate,
        endDate: value.endDate,
        current: value.current,
        weeklyHours: value.weeklyHours,
        level: value.level,
        description: value.description,
        skillIds: [...technologyIds],
      });
    }
  }

  private async resolveSkill(
    context: SaveContext,
    proposal: SkillProposal,
  ): Promise<SkillEntity> {
    const { skill, proposed } = await resolveOrProposeSkill(
      context.repositories.skills,
      proposal,
    );
    if (proposed) {
      context.proposedSkills.push(skill.name);
    }
    return skill;
  }
}

function validRows<T>(
  rows: WorkbookRow[] | undefined,
  parse: (values: WorkbookRow['values']) => ParseResult<T>,
  sheet: string,
  rejected: RejectedRow[],
): ValidRow<T>[] {
  const valid: ValidRow<T>[] = [];
  for (const { row, values } of rows ?? []) {
    const parsed = parse(values);
    if (parsed.ok) {
      valid.push({ row, value: parsed.value });
    } else {
      rejected.push({
        sheet,
        row,
        email: emailOf(values.correo),
        reason: parsed.reason,
      });
    }
  }
  return valid;
}
