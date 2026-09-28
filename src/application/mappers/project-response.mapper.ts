import type { ProjectEntity } from '../../domain/entities/project.entity';
import { toSkillSummary } from './skill-response.mapper';

/** Única forma de respuesta de un proyecto: la usan las rutas del LIDER y las del ADMIN. */
export function toProjectResponse(project: ProjectEntity) {
  return {
    id: project.id,
    title: project.title,
    summary: project.summary,
    objectives: project.objectives,
    typeId: project.typeId,
    categoryId: project.categoryId,
    programId: project.programId,
    typeData: project.typeData,
    knownSkills: project.knownSkills.map(toSkillSummary),
    deliverables: project.deliverables.map((deliverable) => ({
      id: deliverable.id,
      name: deliverable.name,
      scope: deliverable.scope,
    })),
    leaderId: project.leaderId,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}
