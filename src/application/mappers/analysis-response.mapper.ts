import { PRIORITY_WEIGHT } from '../../domain/entities/priority.type';
import type { ProjectAnalysisEntity } from '../../domain/entities/project-analysis.entity';
import type {
  RequiredProfileEntity,
  RequiredProfileSkillEntity,
} from '../../domain/entities/required-profile.entity';

// Respuestas del análisis con IA (RF12–RF14). No salen `input` ni `rawOutput`: son de
// trazabilidad interna y el `input` repite el proyecto completo.

export function toAnalysisSummary(analysis: ProjectAnalysisEntity) {
  return {
    id: analysis.id,
    projectId: analysis.projectId,
    status: analysis.status,
    provider: analysis.provider,
    model: analysis.model,
    promptVersion: analysis.promptVersion,
    summary: analysis.summary,
    errorMessage: analysis.errorMessage,
    durationMs: analysis.durationMs,
    inputTokens: analysis.inputTokens,
    outputTokens: analysis.outputTokens,
    createdAt: analysis.createdAt,
    completedAt: analysis.completedAt,
  };
}

function toRequiredProfileSkillResponse(skill: RequiredProfileSkillEntity) {
  return {
    id: skill.id,
    skillId: skill.skillId,
    // Nombre canónico del catálogo si existe; si no, el que dijo la IA.
    name: skill.skillName ?? skill.rawName,
    catalogued: skill.skillId !== null,
    type: skill.type,
    minLevel: skill.minLevel,
    importance: skill.importance,
  };
}

export function toRequiredProfileResponse(profile: RequiredProfileEntity) {
  return {
    id: profile.id,
    source: profile.source,
    name: profile.name,
    description: profile.description,
    justification: profile.justification,
    quantity: profile.quantity,
    priority: profile.priority,
    minWeeklyHours: profile.minWeeklyHours,
    position: profile.position,
    active: profile.active,
    skills: [...profile.skills]
      .sort(
        (a, b) =>
          PRIORITY_WEIGHT[b.importance] - PRIORITY_WEIGHT[a.importance] ||
          (a.skillName ?? a.rawName).localeCompare(b.skillName ?? b.rawName),
      )
      .map(toRequiredProfileSkillResponse),
  };
}

export function toProjectAnalysisResponse(
  analysis: ProjectAnalysisEntity,
  profiles: RequiredProfileEntity[],
  outdated: boolean,
) {
  return {
    ...toAnalysisSummary(analysis),
    /** El proyecto cambió desde que se hizo el análisis. */
    outdated,
    profiles: profiles.map(toRequiredProfileResponse),
  };
}
