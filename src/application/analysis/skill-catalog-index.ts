import type { SkillEntity } from '../../domain/entities/skill.entity';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';

/**
 * Índice del catálogo por nombre canónico y sinónimos normalizados. El nombre canónico
 * gana si un sinónimo de otra habilidad coincide con él.
 */
export class SkillCatalogIndex {
  private readonly byName = new Map<string, SkillEntity>();
  private readonly bySynonym = new Map<string, SkillEntity>();

  constructor(catalog: SkillEntity[]) {
    for (const skill of catalog) {
      this.byName.set(skill.normalizedName, skill);
      for (const synonym of skill.synonyms) {
        const key = normalizeSkillName(synonym);
        if (key && !this.bySynonym.has(key)) this.bySynonym.set(key, skill);
      }
    }
  }

  /** La habilidad del catálogo que corresponde a un nombre dicho por la IA, o null. */
  resolve(rawName: string): SkillEntity | null {
    const key = normalizeSkillName(rawName);
    if (!key) return null;
    return this.byName.get(key) ?? this.bySynonym.get(key) ?? null;
  }
}
