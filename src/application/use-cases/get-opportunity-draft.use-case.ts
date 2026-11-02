import { Inject, Injectable } from '@nestjs/common';
import type { NeedEntity } from '../../domain/entities/need';
import {
  DELIVERABLE_NAME_MAX_LENGTH,
  PROJECT_DURATION_MONTHS,
  PROJECT_ENTITY_MAX_LENGTH,
  PROJECT_TITLE_LENGTH,
} from '../../domain/entities/field-limits';
import type { NeedRepository } from '../../domain/repositories/need.repository.interface';
import type { ProjectTypeRepository } from '../../domain/repositories/project-type.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import {
  NEED_REPOSITORY,
  PROJECT_TYPE_REPOSITORY,
  SKILL_REPOSITORY,
} from '../../shared/interfaces/tokens';
import { computeDurationMonths } from '../../shared/utils/compute-duration-months';
import { toSkillSummary } from '../mappers/skill-response.mapper';
import { loadOpenOwnedNeed } from '../support/need-access';

/**
 * Tesis (T5/T10): borrador del proyecto con el que el formulador convierte su necesidad en
 * oportunidad. Precarga el formulario de proyecto desde la caracterización; la persona lo revisa
 * y lo envía a `POST /needs/:id/opportunity`. No guarda nada.
 */
@Injectable()
export class GetOpportunityDraftUseCase {
  constructor(
    @Inject(NEED_REPOSITORY) private readonly needRepository: NeedRepository,
    @Inject(SKILL_REPOSITORY) private readonly skillRepository: SkillRepository,
    @Inject(PROJECT_TYPE_REPOSITORY)
    private readonly projectTypeRepository: ProjectTypeRepository,
  ) {}

  async execute(userId: string, needId: string, now = new Date()) {
    const need = await loadOpenOwnedNeed(this.needRepository, userId, needId);
    const characterization = need.characterization;
    const [skills, projectTypes] = await Promise.all([
      this.skillRepository.findByIds(
        characterization?.competencies.map((item) => item.skillId) ?? [],
      ),
      this.projectTypeRepository.findAll(true),
    ]);
    const suggestedType = projectTypes.find(
      (type) => type.code === characterization?.suggestedProjectTypeCode,
    );
    return {
      needId: need.id,
      title: need.title.slice(0, PROJECT_TITLE_LENGTH.max),
      summary: characterization?.problem || need.description,
      objectives: characterization?.objective ?? '',
      executingEntity:
        need.dependency?.slice(0, PROJECT_ENTITY_MAX_LENGTH) ?? null,
      durationMonths: durationUntil(need.deadline, now),
      typeId: suggestedType?.id ?? null,
      knownSkills: skills.map(toSkillSummary),
      deliverables: (characterization?.expectedResults ?? []).map((result) => ({
        name: result.slice(0, DELIVERABLE_NAME_MAX_LENGTH),
        scope: deliverableScope(need),
      })),
    };
  }
}

/** Meses hasta el plazo esperado, dentro del rango que admite un proyecto; null si no hay plazo. */
function durationUntil(deadline: string | null, now: Date): number | null {
  if (!deadline) return null;
  const today = now.toISOString().slice(0, 10);
  const months = computeDurationMonths(today, deadline, now);
  return Math.min(
    Math.max(months, PROJECT_DURATION_MONTHS.min),
    PROJECT_DURATION_MONTHS.max,
  );
}

const deliverableScope = (need: NeedEntity) =>
  `Resultado esperado de la necesidad «${need.title}».`;
