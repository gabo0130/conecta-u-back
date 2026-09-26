import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { consentFields } from '../../domain/entities/data-consent';
import {
  type CollaboratorWorkbook,
  type CollaboratorWorkbookReader,
  InvalidWorkbookError,
  type WorkbookRow,
} from '../../domain/repositories/collaborator-workbook.interface';
import type { CollaboratorRepository } from '../../domain/repositories/collaborator.repository.interface';
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
  type SkillProposal,
  resolveOrProposeSkill,
} from '../support/skill-resolver';

export interface RejectedRow {
  sheet: string;
  row: number;
  email: string;
  reason: string;
}

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
}

/** Resultado de guardar un colaborador: se aplica al reporte solo si la transacción confirmó. */
interface SavedCollaborator {
  proposedSkills: string[];
  rejected: RejectedRow[];
}

const UNMATCHED_EMAIL =
  'El correo no corresponde a un colaborador importado en este archivo';
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
    @Inject(UNIT_OF_WORK) private readonly unitOfWork: UnitOfWork,
    appLogger: AppLoggerService,
  ) {
    this.logger = appLogger.forContext(ImportCollaboratorsUseCase.name);
  }

  /** @param content el .xlsx subido; su tamaño ya lo limitó la capa HTTP. */
  async execute(content: Uint8Array) {
    const workbook = await this.readWorkbook(content);
    const skillRows = groupByEmail(workbook.skills);
    const experienceRows = groupByEmail(workbook.experience);
    const importedEmails = new Set<string>();
    const seenEmails = new Set<string>();
    const rejected: RejectedRow[] = [];
    const warnings: string[] = [];

    for (const { row, values } of workbook.collaborators) {
      const email = emailOf(values.correo);
      const reject = (reason: string) =>
        rejected.push({ sheet: SHEET_COLLABORATORS, row, email, reason });

      if (email && seenEmails.has(email)) {
        reject('Correo duplicado en el archivo');
        continue;
      }
      seenEmails.add(email);

      const parsed = parseCollaboratorRow(values);
      if (!parsed.ok) {
        reject(parsed.reason);
        continue;
      }

      const resolved = await this.resolveNewCollaborator(parsed.value);
      if (!resolved.ok) {
        reject(resolved.reason);
        continue;
      }

      // Los rechazos de filas hijas solo se informan si el colaborador se guarda; si no,
      // todas sus filas quedan como "sin colaborador importado" al final.
      const childRejections: RejectedRow[] = [];
      const saved = await this.save({
        row,
        collaborator: parsed.value,
        programId: resolved.value.programId,
        skills: this.validRows(
          skillRows.get(email),
          parseSkillRow,
          SHEET_SKILLS,
          childRejections,
        ),
        experience: this.validRows(
          experienceRows.get(email),
          parseExperienceRow,
          SHEET_EXPERIENCE,
          childRejections,
        ),
      });
      if (!saved) {
        reject(SAVE_FAILED);
        continue;
      }
      importedEmails.add(email);
      rejected.push(...childRejections, ...saved.rejected);
      warnings.push(
        ...saved.proposedSkills.map(
          (name) => `Habilidad nueva creada como pendiente: "${name}"`,
        ),
      );
    }

    rejected.push(
      ...unmatchedRows(skillRows, importedEmails, SHEET_SKILLS),
      ...unmatchedRows(experienceRows, importedEmails, SHEET_EXPERIENCE),
    );

    return { created: importedEmails.size, rejected, warnings };
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

  private validRows<T>(
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

  private async save(
    data: CollaboratorImport,
  ): Promise<SavedCollaborator | null> {
    try {
      return await this.unitOfWork.run((repositories) =>
        this.saveWith(repositories, data),
      );
    } catch (error) {
      this.logger.error('No se pudo importar un colaborador', error, {
        method: 'save',
        row: data.row,
      });
      return null;
    }
  }

  private async saveWith(
    repositories: TransactionalRepositories,
    { collaborator, programId, skills, experience }: CollaboratorImport,
  ): Promise<SavedCollaborator> {
    const result: SavedCollaborator = { proposedSkills: [], rejected: [] };
    const resolveSkill = async (proposal: SkillProposal) => {
      const resolved = await resolveOrProposeSkill(
        repositories.skills,
        proposal,
      );
      if (resolved.proposed) {
        result.proposedSkills.push(resolved.skill.name);
      }
      return resolved.skill;
    };

    const { id: collaboratorId } = await repositories.collaborators.create({
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

    const addedSkillIds = new Set<string>();
    for (const { row, value } of skills) {
      const skill = await resolveSkill(value);
      // "React" y "ReactJS" resuelven a la misma habilidad del catálogo.
      if (addedSkillIds.has(skill.id)) {
        result.rejected.push({
          sheet: SHEET_SKILLS,
          row,
          email: collaborator.email,
          reason: `Habilidad repetida para este colaborador: ${skill.name}`,
        });
        continue;
      }
      addedSkillIds.add(skill.id);
      await repositories.collaboratorSkills.create({
        collaboratorId,
        skillId: skill.id,
        level: value.level,
        experienceMonths: value.experienceMonths,
        lastUsedYear: value.lastUsedYear,
      });
    }

    for (const { value } of experience) {
      const technologyIds = new Set<string>();
      for (const name of value.technologies) {
        technologyIds.add(
          (await resolveSkill({ name, type: 'CONOCIMIENTO' })).id,
        );
      }
      await repositories.experiences.create({
        collaboratorId,
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

    return result;
  }
}

function groupByEmail(rows: WorkbookRow[]): Map<string, WorkbookRow[]> {
  const groups = new Map<string, WorkbookRow[]>();
  for (const row of rows) {
    const email = emailOf(row.values.correo);
    groups.set(email, [...(groups.get(email) ?? []), row]);
  }
  return groups;
}

/** Filas de Habilidades/Experiencia cuyo correo no quedó importado: se informan, no se pierden. */
function unmatchedRows(
  groups: Map<string, WorkbookRow[]>,
  importedEmails: Set<string>,
  sheet: string,
): RejectedRow[] {
  return [...groups.entries()]
    .filter(([email]) => !importedEmails.has(email))
    .flatMap(([email, rows]) =>
      rows.map(({ row }) => ({ sheet, row, email, reason: UNMATCHED_EMAIL })),
    );
}
