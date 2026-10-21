import type { AvailabilityStatus } from '../entities/availability-status.type';
import type { ExperienceType } from '../entities/experience-type.type';
import type { Level } from '../entities/level.type';
import { LEVELS } from '../entities/level.type';
import { PRIORITY_WEIGHT } from '../entities/priority.type';
import type { Priority } from '../entities/priority.type';

// Puntaje de correspondencia entre un perfil requerido y una persona (RF15–RF17).
// Función pura: no lee base de datos ni configuración, así se prueba con casos puntuales.
// Los componentes valen de 0 a 1; el puntaje final, de 0 a 100 (ver §5 del contrato).

export interface MatchWeights {
  skills: number;
  semantic: number;
  experience: number;
  availability: number;
}

export const DEFAULT_MATCH_WEIGHTS: MatchWeights = {
  skills: 0.5,
  semantic: 0.2,
  experience: 0.15,
  availability: 0.15,
};

/** Habilidad que pide el perfil. `normalizedName` sirve para emparejar las no catalogadas. */
export interface RequiredSkillSpec {
  skillId: string | null;
  name: string;
  normalizedName: string;
  minLevel: Level;
  importance: Priority;
}

export interface RequiredProfileSpec {
  skills: RequiredSkillSpec[];
  minWeeklyHours: number | null;
  embedding: number[] | null;
}

export interface PersonSkillSpec {
  skillId: string;
  /** Nombre canónico y sinónimos, ya normalizados. */
  normalizedNames: string[];
  level: Level;
  months: number;
}

export interface PersonExperienceSpec {
  type: ExperienceType;
  /** "Rol – Organización", para mostrar en la justificación. */
  label: string;
  months: number;
  /** Habilidades del catálogo que usó en esa experiencia. */
  skillIds: string[];
}

export interface PersonSpec {
  skills: PersonSkillSpec[];
  experiences: PersonExperienceSpec[];
  availabilityStatus: AvailabilityStatus;
  weeklyHours: number;
  embedding: number[] | null;
}

export interface MatchOptions {
  weights: MatchWeights;
  /** Tipo de experiencia que equivale al tipo del proyecto (p. ej. semillero ↔ investigación). */
  projectExperienceType: ExperienceType | null;
}

export interface MatchBreakdown {
  matchedSkills: {
    skill: string;
    required: Level;
    has: Level;
    months: number;
    importance: Priority;
    /** nivel × profundidad, de 0 a 1. */
    points: number;
  }[];
  missingSkills: { skill: string; required: Level; importance: Priority }[];
  experience: { relevantMonths: number; items: string[] };
  availability: {
    status: AvailabilityStatus;
    weeklyHours: number;
    requiredHours: number | null;
  };
  /** Coseno crudo entre los embeddings; null si falta alguno. */
  semantic: { similarity: number | null };
  /** Pesos realmente aplicados (si no hay embeddings, el peso semántico se reparte). */
  weights: MatchWeights;
}

export interface MatchResult {
  /** 0–100, con 2 decimales. */
  score: number;
  components: MatchWeights;
  breakdown: MatchBreakdown;
  /** La persona comparte al menos una habilidad o tiene experiencia relevante. */
  relevant: boolean;
}

const AVAILABILITY_FACTOR: Record<AvailabilityStatus, number> = {
  DISPONIBLE: 1,
  PARCIAL: 0.6,
  NO_DISPONIBLE: 0,
};

const MIN_EXPERIENCE_FACTOR = 0.7;
const FULL_DEPTH_MONTHS = 24;
const FULL_EXPERIENCE_MONTHS = 24;
const EXPERIENCE_TYPE_BONUS = 0.2;
/**
 * Los embeddings de textos de un mismo dominio ya rondan 0.5 de coseno: se reescala el
 * rango útil a 0–1 para que la parte semántica distinga a las personas.
 */
export const SEMANTIC_FLOOR = 0.5;
export const SEMANTIC_CEILING = 0.85;

const levelRank = (level: Level): number => LEVELS.indexOf(level) + 1;
const clamp01 = (value: number): number => Math.min(Math.max(value, 0), 1);
const round = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

/** Normaliza pesos arbitrarios para que sumen 1. */
export function normalizeWeights(weights: MatchWeights): MatchWeights {
  const total =
    weights.skills +
    weights.semantic +
    weights.experience +
    weights.availability;
  if (total <= 0) return { ...DEFAULT_MATCH_WEIGHTS };
  return {
    skills: weights.skills / total,
    semantic: weights.semantic / total,
    experience: weights.experience / total,
    availability: weights.availability / total,
  };
}

function findPersonSkill(
  required: RequiredSkillSpec,
  skills: PersonSkillSpec[],
): PersonSkillSpec | undefined {
  return skills.find((skill) =>
    required.skillId
      ? skill.skillId === required.skillId
      : skill.normalizedNames.includes(required.normalizedName),
  );
}

export function computeMatch(
  profile: RequiredProfileSpec,
  person: PersonSpec,
  { weights, projectExperienceType }: MatchOptions,
): MatchResult {
  // --- Habilidades (S)
  const matchedSkills: MatchBreakdown['matchedSkills'] = [];
  const missingSkills: MatchBreakdown['missingSkills'] = [];
  const relevantSkillIds = new Set<string>();
  let earned = 0;
  let possible = 0;

  for (const required of profile.skills) {
    const weight = PRIORITY_WEIGHT[required.importance];
    possible += weight;
    // Haber usado la tecnología en una experiencia cuenta aunque no la haya listado como habilidad.
    if (required.skillId) relevantSkillIds.add(required.skillId);
    const owned = findPersonSkill(required, person.skills);
    if (!owned) {
      missingSkills.push({
        skill: required.name,
        required: required.minLevel,
        importance: required.importance,
      });
      continue;
    }
    relevantSkillIds.add(owned.skillId);
    const levelFactor = Math.min(
      levelRank(owned.level) / levelRank(required.minLevel),
      1,
    );
    const depthFactor =
      MIN_EXPERIENCE_FACTOR +
      (1 - MIN_EXPERIENCE_FACTOR) *
        Math.min(owned.months / FULL_DEPTH_MONTHS, 1);
    const points = levelFactor * depthFactor;
    earned += weight * points;
    matchedSkills.push({
      skill: required.name,
      required: required.minLevel,
      has: owned.level,
      months: owned.months,
      importance: required.importance,
      points: round(points, 2),
    });
  }
  const skillScore = possible === 0 ? 0 : earned / possible;

  // --- Experiencia (E)
  const relevantExperiences = person.experiences.filter((experience) =>
    experience.skillIds.some((id) => relevantSkillIds.has(id)),
  );
  const relevantMonths = relevantExperiences.reduce(
    (total, experience) => total + experience.months,
    0,
  );
  const typeBonus =
    projectExperienceType !== null &&
    relevantExperiences.some(
      (experience) => experience.type === projectExperienceType,
    )
      ? EXPERIENCE_TYPE_BONUS
      : 0;
  const experienceScore = clamp01(
    Math.min(relevantMonths / FULL_EXPERIENCE_MONTHS, 1) + typeBonus,
  );

  // --- Disponibilidad (A)
  const hoursFactor =
    profile.minWeeklyHours && profile.minWeeklyHours > 0
      ? Math.min(person.weeklyHours / profile.minWeeklyHours, 1)
      : 1;
  const availabilityScore =
    AVAILABILITY_FACTOR[person.availabilityStatus] * hoursFactor;

  // --- Semántica (M): opcional, si falta un embedding su peso se reparte
  const similarity =
    profile.embedding && person.embedding
      ? cosineSimilarity(profile.embedding, person.embedding)
      : null;
  const hasEmbeddings = similarity !== null;
  const semanticScore =
    similarity === null
      ? 0
      : clamp01(
          (similarity - SEMANTIC_FLOOR) / (SEMANTIC_CEILING - SEMANTIC_FLOOR),
        );

  const base = normalizeWeights(weights);
  const applied: MatchWeights = hasEmbeddings
    ? base
    : normalizeWeights({ ...base, semantic: 0 });

  const score = round(
    100 *
      (applied.skills * skillScore +
        applied.semantic * semanticScore +
        applied.experience * experienceScore +
        applied.availability * availabilityScore),
    2,
  );

  return {
    score,
    components: {
      skills: round(skillScore, 4),
      semantic: round(semanticScore, 4),
      experience: round(experienceScore, 4),
      availability: round(availabilityScore, 4),
    },
    breakdown: {
      matchedSkills,
      missingSkills,
      experience: {
        relevantMonths,
        items: relevantExperiences.map(
          (experience) => `${experience.label} (${experience.months} meses)`,
        ),
      },
      availability: {
        status: person.availabilityStatus,
        weeklyHours: person.weeklyHours,
        requiredHours: profile.minWeeklyHours,
      },
      semantic: {
        similarity: similarity === null ? null : round(similarity, 3),
      },
      weights: {
        skills: round(applied.skills, 4),
        semantic: round(applied.semantic, 4),
        experience: round(applied.experience, 4),
        availability: round(applied.availability, 4),
      },
    },
    relevant: matchedSkills.length > 0 || relevantMonths > 0,
  };
}
