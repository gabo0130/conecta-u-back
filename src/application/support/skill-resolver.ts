import type { SkillCategory } from '../../domain/entities/skill-category.type';
import type { SkillEntity } from '../../domain/entities/skill.entity';
import type { SkillType } from '../../domain/entities/skill-type.type';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';

export interface SkillProposal {
  name: string;
  type: SkillType;
  category?: SkillCategory;
}

export interface ResolvedSkill {
  skill: SkillEntity;
  /** `true` si no existía y se creó como PENDIENTE. */
  proposed: boolean;
}

/**
 * Busca la habilidad por nombre canónico o sinónimo; si no existe la crea como
 * PENDIENTE para que el administrador la revise (RF4).
 */
export async function resolveOrProposeSkill(
  skillRepository: SkillRepository,
  proposal: SkillProposal,
): Promise<ResolvedSkill> {
  const normalizedName = normalizeSkillName(proposal.name);
  const existing =
    await skillRepository.findByNormalizedNameOrSynonym(normalizedName);
  if (existing) {
    return { skill: existing, proposed: false };
  }

  const skill = await skillRepository.create({
    name: proposal.name.trim(),
    normalizedName,
    type: proposal.type,
    category: proposal.category ?? 'OTRA',
    status: 'PENDIENTE',
  });
  return { skill, proposed: true };
}
