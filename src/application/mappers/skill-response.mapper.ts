import type { SkillEntity } from '../../domain/entities/skill.entity';

/**
 * Habilidad tal como la ve quien consulta un perfil o un proyecto. `normalizedName`,
 * `synonyms` y `status` son detalles del catálogo: solo salen por `/catalogs/skills`.
 */
export function toSkillSummary(skill: SkillEntity) {
  return {
    id: skill.id,
    name: skill.name,
    type: skill.type,
    category: skill.category,
  };
}
