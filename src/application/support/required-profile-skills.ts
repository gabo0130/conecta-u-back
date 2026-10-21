import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { NewRequiredProfileSkill } from '../../domain/repositories/project-analysis.repository.interface';
import type { SkillRepository } from '../../domain/repositories/skill.repository.interface';
import type { RequiredProfileSkillDto } from '../dto/required-profile.dto';

/**
 * Habilidades de un perfil agregado o editado a mano: salen del catálogo (ACTIVAS), sin
 * repetidas. El tipo lo fija el catálogo, igual que en el mapeo de la IA.
 */
export async function resolveProfileSkills(
  skillRepository: SkillRepository,
  items: RequiredProfileSkillDto[],
): Promise<NewRequiredProfileSkill[]> {
  const ids = items.map((item) => item.skillId);
  if (new Set(ids).size !== ids.length) {
    throw new UnprocessableEntityException({
      message: 'Hay habilidades repetidas en el perfil.',
    });
  }

  const found = await skillRepository.findByIds(ids);
  const byId = new Map(
    found.filter((skill) => skill.status === 'ACTIVA').map((s) => [s.id, s]),
  );

  return items.map((item) => {
    const skill = byId.get(item.skillId);
    if (!skill) {
      throw new NotFoundException({ message: 'Habilidad no encontrada' });
    }
    return {
      skillId: skill.id,
      rawName: skill.name,
      type: skill.type,
      minLevel: item.minLevel,
      importance: item.importance,
    };
  });
}
