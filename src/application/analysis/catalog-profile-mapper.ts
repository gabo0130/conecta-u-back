import { PRIORITY_WEIGHT } from '../../domain/entities/priority.type';
import type { SkillEntity } from '../../domain/entities/skill.entity';
import type { AnalyzedProfile } from '../../domain/repositories/project-analyzer.interface';
import type {
  NewRequiredProfile,
  NewRequiredProfileSkill,
} from '../../domain/repositories/project-analysis.repository.interface';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';
import { redactContactData } from './contact-data';
import { SkillCatalogIndex } from './skill-catalog-index';

/**
 * Convierte los perfiles que devolvió la IA en perfiles guardables: cada habilidad se
 * resuelve contra el catálogo (nombre o sinónimo). Las que no existen quedan con
 * `skillId = null` ("no catalogada"); no se crean solas. Si dos habilidades de un perfil
 * resuelven a la misma, se conserva la de mayor importancia.
 */
export function mapProfilesToCatalog(
  profiles: AnalyzedProfile[],
  catalog: SkillEntity[],
): NewRequiredProfile[] {
  const index = new SkillCatalogIndex(catalog);

  return profiles.map((profile, position) => {
    const skills = new Map<string, NewRequiredProfileSkill>();
    for (const skill of profile.skills) {
      const match = index.resolve(skill.name);
      const key = match?.id ?? `raw:${normalizeSkillName(skill.name)}`;
      const entry: NewRequiredProfileSkill = {
        skillId: match?.id ?? null,
        rawName: skill.name,
        // El catálogo es la fuente de verdad del tipo; la IA solo lo propone.
        type: match?.type ?? skill.type,
        minLevel: skill.minLevel,
        importance: skill.importance,
      };
      const previous = skills.get(key);
      if (!previous || importanceWeight(entry) > importanceWeight(previous)) {
        skills.set(key, entry);
      }
    }

    return {
      name: profile.name,
      description: profile.description,
      justification: profile.justification,
      quantity: profile.quantity,
      priority: profile.priority,
      minWeeklyHours: profile.suggestedWeeklyHours,
      position,
      skills: [...skills.values()],
      embedding: null,
    };
  });
}

const importanceWeight = (skill: NewRequiredProfileSkill) =>
  PRIORITY_WEIGHT[skill.importance];

/** Texto que se convierte en embedding para comparar un perfil con las personas. */
export function profileEmbeddingText(profile: {
  name: string;
  description: string;
  skills: { rawName: string }[];
}): string {
  const skills = profile.skills.map((skill) => skill.rawName).join(', ');
  // Nombre y descripción los puede escribir el líder a mano: sin datos de contacto.
  return [profile.name, profile.description, skills]
    .map(redactContactData)
    .filter(Boolean)
    .join('. ');
}
