import {
  PROFILES_PER_ANALYSIS,
  PROFILE_NAME_MAX_LENGTH,
  PROFILE_QUANTITY,
  PROFILE_TEXT_MAX_LENGTH,
  PROFILE_WEEKLY_HOURS,
  SKILLS_PER_PROFILE,
  SKILL_RAW_NAME_MAX_LENGTH,
} from '../../domain/entities/analysis-limits';
import { LEVELS } from '../../domain/entities/level.type';
import type { Level } from '../../domain/entities/level.type';
import { PRIORITIES } from '../../domain/entities/priority.type';
import type { Priority } from '../../domain/entities/priority.type';
import { SKILL_TYPES } from '../../domain/entities/skill-type.type';
import type { SkillType } from '../../domain/entities/skill-type.type';
import { InvalidAnalysisOutputError } from '../../domain/repositories/project-analyzer.interface';
import type {
  AnalysisOutput,
  AnalyzedProfile,
} from '../../domain/repositories/project-analyzer.interface';

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** "Básico", "basico " y "BASICO" son el mismo valor; "Habilidad blanda" → HABILIDAD_BLANDA. */
function normalizeEnum(value: unknown): string {
  return (typeof value === 'string' ? value : '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function enumOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | null {
  const normalized = normalizeEnum(value);
  return allowed.find((candidate) => candidate === normalized) ?? null;
}

function textOf(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/**
 * Valida y normaliza la salida del modelo (`promptVersion v1`, ver §4 del contrato).
 * Es tolerante con lo cosmético (mayúsculas, tildes, textos largos, cantidades fuera de
 * rango) y estricta con lo que rompería el matchmaking (tipos, niveles, prioridades).
 * @throws InvalidAnalysisOutputError con todos los problemas encontrados.
 */
export function parseAnalysisOutput(raw: unknown): AnalysisOutput {
  const errors: string[] = [];
  if (!isObject(raw)) {
    throw new InvalidAnalysisOutputError('La salida no es un objeto JSON');
  }

  const summary = textOf(raw.resumen, PROFILE_TEXT_MAX_LENGTH);
  if (!summary) errors.push('Falta "resumen"');

  const rawProfiles = Array.isArray(raw.perfiles) ? raw.perfiles : [];
  if (
    rawProfiles.length < PROFILES_PER_ANALYSIS.min ||
    rawProfiles.length > PROFILES_PER_ANALYSIS.max
  ) {
    errors.push(
      `"perfiles" debe tener entre ${PROFILES_PER_ANALYSIS.min} y ${PROFILES_PER_ANALYSIS.max} elementos`,
    );
  }

  const profiles: AnalyzedProfile[] = [];
  rawProfiles.slice(0, PROFILES_PER_ANALYSIS.max).forEach((item, index) => {
    const profile = parseProfile(item, `perfiles[${index}]`, errors);
    if (profile) profiles.push(profile);
  });

  if (errors.length > 0) {
    throw new InvalidAnalysisOutputError(errors.join('; '));
  }
  return { summary, profiles };
}

function parseProfile(
  item: unknown,
  path: string,
  errors: string[],
): AnalyzedProfile | null {
  if (!isObject(item)) {
    errors.push(`${path} no es un objeto`);
    return null;
  }

  const name = textOf(item.nombre, PROFILE_NAME_MAX_LENGTH);
  const description = textOf(item.descripcion, PROFILE_TEXT_MAX_LENGTH);
  const justification = textOf(item.justificacion, PROFILE_TEXT_MAX_LENGTH);
  if (!name) errors.push(`${path}.nombre es obligatorio`);
  if (!justification) errors.push(`${path}.justificacion es obligatoria`);

  const priority = enumOf<Priority>(item.prioridad, PRIORITIES);
  if (!priority) errors.push(`${path}.prioridad no es válida`);

  const quantity = Math.min(
    Math.max(Math.round(Number(item.cantidad)) || 1, PROFILE_QUANTITY.min),
    PROFILE_QUANTITY.max,
  );
  const hours = Math.round(Number(item.horasSemanaSugeridas));
  const suggestedWeeklyHours =
    Number.isFinite(hours) && hours > 0 && hours <= PROFILE_WEEKLY_HOURS.max
      ? hours
      : null;

  const rawSkills = Array.isArray(item.habilidades) ? item.habilidades : [];
  if (
    rawSkills.length < SKILLS_PER_PROFILE.min ||
    rawSkills.length > SKILLS_PER_PROFILE.max
  ) {
    errors.push(
      `${path}.habilidades debe tener entre ${SKILLS_PER_PROFILE.min} y ${SKILLS_PER_PROFILE.max} elementos`,
    );
  }

  const skills: AnalyzedProfile['skills'] = [];
  rawSkills.slice(0, SKILLS_PER_PROFILE.max).forEach((skill, index) => {
    const parsed = parseSkill(skill, `${path}.habilidades[${index}]`, errors);
    if (parsed) skills.push(parsed);
  });

  if (!priority) return null;
  return {
    name,
    description,
    justification,
    quantity,
    priority,
    suggestedWeeklyHours,
    skills,
  };
}

function parseSkill(
  item: unknown,
  path: string,
  errors: string[],
): AnalyzedProfile['skills'][number] | null {
  if (!isObject(item)) {
    errors.push(`${path} no es un objeto`);
    return null;
  }
  const name = textOf(item.nombre, SKILL_RAW_NAME_MAX_LENGTH);
  const type = enumOf<SkillType>(item.tipo, SKILL_TYPES);
  const minLevel = enumOf<Level>(item.nivelMinimo, LEVELS);
  const importance = enumOf<Priority>(item.importancia, PRIORITIES);

  if (!name) errors.push(`${path}.nombre es obligatorio`);
  if (!type) errors.push(`${path}.tipo no es válido`);
  if (!minLevel) errors.push(`${path}.nivelMinimo no es válido`);
  if (!importance) errors.push(`${path}.importancia no es válida`);
  if (!name || !type || !minLevel || !importance) return null;

  return { name, type, minLevel, importance };
}
