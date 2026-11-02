import type { CollaboratorEntity } from '../../domain/entities/collaborator.entity';
import type { ExperienceType } from '../../domain/entities/experience-type.type';
import type { MatchCandidate } from '../../domain/repositories/recommendation.repository.interface';
import {
  computeMatch,
  type MatchResult,
  type MatchWeights,
  type RequiredProfileSpec,
} from '../../domain/services/match-score';
import { toPersonSpec } from './match-input';

export interface RankOptions {
  weights: MatchWeights;
  projectExperienceType: ExperienceType | null;
  topN: number;
  now: Date;
}

export interface RankedCandidate {
  collaborator: CollaboratorEntity;
  result: MatchResult;
}

/**
 * Orden de las recomendaciones de un perfil (RF11–RF12): solo personas pertinentes (comparten
 * una habilidad o tienen experiencia relevante), por puntaje, luego por habilidades, apellido,
 * nombre e id (el último desempate hace el orden determinista). Lo usan la generación de
 * recomendaciones y la evaluación de la tesis, para que se mida exactamente el mismo sistema.
 */
export function rankCandidates(
  profile: RequiredProfileSpec,
  candidates: MatchCandidate[],
  { weights, projectExperienceType, topN, now }: RankOptions,
): RankedCandidate[] {
  return candidates
    .map(({ collaborator, embedding }) => ({
      collaborator,
      result: computeMatch(
        profile,
        toPersonSpec(collaborator, embedding, now),
        {
          weights,
          projectExperienceType,
        },
      ),
    }))
    .filter(({ result }) => result.relevant)
    .sort(
      (a, b) =>
        b.result.score - a.result.score ||
        b.result.components.skills - a.result.components.skills ||
        a.collaborator.lastName.localeCompare(b.collaborator.lastName) ||
        a.collaborator.firstName.localeCompare(b.collaborator.firstName) ||
        a.collaborator.id.localeCompare(b.collaborator.id),
    )
    .slice(0, topN);
}
