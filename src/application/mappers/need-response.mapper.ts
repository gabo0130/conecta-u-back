import type { NeedEntity } from '../../domain/entities/need';

/** Resumen para la lista de necesidades (sin el texto completo ni la caracterización). */
export function toNeedSummaryResponse(need: NeedEntity) {
  return {
    id: need.id,
    title: need.title,
    kind: need.kind,
    status: need.status,
    urgency: need.urgency,
    impact: need.impact,
    deadline: need.deadline,
    dependency: need.dependency,
    completeness: need.completeness,
    priorityScore: need.priorityScore,
    projectId: need.projectId,
    createdById: need.createdById,
    createdAt: need.createdAt,
    updatedAt: need.updatedAt,
  };
}

/** Detalle de una necesidad, con su caracterización. */
export function toNeedResponse(need: NeedEntity) {
  return {
    ...toNeedSummaryResponse(need),
    description: need.description,
    characterization: need.characterization,
    characterizedAt: need.characterizedAt,
    discardReason: need.discardReason,
  };
}
