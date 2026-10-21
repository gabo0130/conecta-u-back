import type { AnalysisStatus } from '../../../../domain/entities/analysis-status.type';
import type { Level } from '../../../../domain/entities/level.type';
import type { Priority } from '../../../../domain/entities/priority.type';
import { ProjectAnalysisEntity } from '../../../../domain/entities/project-analysis.entity';
import type { RequiredProfileSource } from '../../../../domain/entities/required-profile-source.type';
import {
  RequiredProfileEntity,
  RequiredProfileSkillEntity,
} from '../../../../domain/entities/required-profile.entity';
import type { SkillType } from '../../../../domain/entities/skill-type.type';
import type { ProjectAnalysisOrmEntity } from '../project-analysis.orm-entity';
import type { RequiredProfileSkillOrmEntity } from '../required-profile-skill.orm-entity';
import type { RequiredProfileOrmEntity } from '../required-profile.orm-entity';

export function toProjectAnalysisEntity(
  analysis: ProjectAnalysisOrmEntity,
): ProjectAnalysisEntity {
  return new ProjectAnalysisEntity({
    id: analysis.id,
    projectId: analysis.projectId,
    requestedById: analysis.requestedById,
    status: analysis.status as AnalysisStatus,
    provider: analysis.provider,
    model: analysis.model,
    promptVersion: analysis.promptVersion,
    input: analysis.input,
    inputTokens: analysis.inputTokens,
    outputTokens: analysis.outputTokens,
    rawOutput: analysis.rawOutput ?? null,
    summary: analysis.summary,
    errorMessage: analysis.errorMessage,
    durationMs: analysis.durationMs,
    createdAt: analysis.createdAt,
    completedAt: analysis.completedAt,
  });
}

function toRequiredProfileSkillEntity(
  skill: RequiredProfileSkillOrmEntity,
): RequiredProfileSkillEntity {
  return new RequiredProfileSkillEntity(
    skill.id,
    skill.requiredProfileId,
    skill.skillId,
    skill.rawName,
    skill.type as SkillType,
    skill.minLevel as Level,
    skill.importance as Priority,
    skill.skill?.name ?? null,
  );
}

export function toRequiredProfileEntity(
  profile: RequiredProfileOrmEntity,
): RequiredProfileEntity {
  return new RequiredProfileEntity({
    id: profile.id,
    projectId: profile.projectId,
    analysisId: profile.analysisId,
    source: profile.source as RequiredProfileSource,
    name: profile.name,
    description: profile.description,
    justification: profile.justification,
    quantity: profile.quantity,
    priority: profile.priority as Priority,
    minWeeklyHours: profile.minWeeklyHours,
    position: profile.position,
    active: profile.active,
    skills: (profile.skills ?? []).map(toRequiredProfileSkillEntity),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  });
}
