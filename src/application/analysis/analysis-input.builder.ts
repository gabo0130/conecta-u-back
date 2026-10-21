import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { ProjectEntity } from '../../domain/entities/project.entity';
import type { SkillEntity } from '../../domain/entities/skill.entity';
import type { AnalysisInput } from '../../domain/repositories/project-analyzer.interface';
import type { ProgramRepository } from '../../domain/repositories/program.repository.interface';
import type { ProjectCategoryRepository } from '../../domain/repositories/project-category.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  PROGRAM_REPOSITORY,
  PROJECT_CATEGORY_REPOSITORY,
  PROJECT_TYPE_REPOSITORY,
  SKILL_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { OMITTED_CONTACT, stripContactData } from './contact-data';

export type ProjectInput = AnalysisInput['project'];

/** Huella de lo que el análisis "vio" del proyecto: si cambia, el análisis quedó desactualizado. */
export function projectFingerprint(project: ProjectInput): string {
  return createHash('sha256')
    .update(JSON.stringify(project))
    .digest('hex')
    .slice(0, 16);
}

/**
 * Arma lo que se le entrega a la IA, sin datos personales (ver §4 del contrato): ni la
 * identidad del líder ni datos de contacto escritos en el texto del proyecto.
 */
@Injectable()
export class AnalysisInputBuilder {
  constructor(
    @Inject(PROJECT_TYPE_REPOSITORY)
    private readonly projectTypeRepository: ProjectTypeRepository,
    @Inject(PROJECT_CATEGORY_REPOSITORY)
    private readonly projectCategoryRepository: ProjectCategoryRepository,
    @Inject(PROGRAM_REPOSITORY)
    private readonly programRepository: ProgramRepository,
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
  ) {}

  async buildProject(project: ProjectEntity): Promise<ProjectInput> {
    const [type, category, program] = await Promise.all([
      this.projectTypeRepository.findById(project.typeId),
      this.projectCategoryRepository.findById(project.categoryId),
      project.programId
        ? this.programRepository.findById(project.programId)
        : Promise.resolve(null),
    ]);

    const fields = (type?.templateFields ?? [])
      .map((field) => ({
        label: field.label,
        value: scalarText(project.typeData[field.key]),
      }))
      .filter((field) => field.value !== '');

    return {
      title: project.title,
      summary: project.summary,
      objectives: project.objectives,
      type: { name: type?.name ?? 'Sin tipo', fields },
      category: category?.name ?? 'Sin categoría',
      program: program?.name ?? null,
      deliverables: project.deliverables.map((deliverable) => ({
        name: deliverable.name,
        scope: deliverable.scope,
      })),
      knownSkills: project.knownSkills
        .map((skill) => ({ name: skill.name, type: skill.type }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  /**
   * Entrada para la IA. La huella se calcula sobre el texto original (igual que en
   * `GET …/analysis`), y al prompt va el texto sin datos de contacto.
   */
  async build(project: ProjectEntity): Promise<{
    input: AnalysisInput;
    catalog: SkillEntity[];
    fingerprint: string;
  }> {
    const [projectInput, catalog] = await Promise.all([
      this.buildProject(project),
      this.skillRepository.findAllActive(),
    ]);
    return {
      fingerprint: projectFingerprint(projectInput),
      input: {
        project: withoutContactData(projectInput),
        catalog: catalog.map((skill) => ({
          name: skill.name,
          type: skill.type,
          category: skill.category,
        })),
      },
      catalog,
    };
  }
}

/** Ley 1581: el texto libre del líder puede traer correos, enlaces o teléfonos; no van a la IA. */
function withoutContactData(project: ProjectInput): ProjectInput {
  const strip = (text: string) => stripContactData(text, OMITTED_CONTACT);
  return {
    ...project,
    title: strip(project.title),
    summary: strip(project.summary),
    objectives: strip(project.objectives),
    type: {
      ...project.type,
      fields: project.type.fields.map((field) => ({
        ...field,
        value: strip(field.value),
      })),
    },
    deliverables: project.deliverables.map((deliverable) => ({
      name: strip(deliverable.name),
      scope: strip(deliverable.scope),
    })),
  };
}

/**
 * Los campos de plantilla guardan texto, números, booleanos o listas de palabras clave
 * (v2.1); cualquier otra cosa se ignora.
 */
function scalarText(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .join(', ');
  }
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
    ? String(value).trim()
    : '';
}
