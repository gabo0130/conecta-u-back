import {
  NEED_CHARACTERIZATION_LIMITS,
  type NeedCharacterization,
  type NeedCompetency,
} from '../../domain/entities/need';
import { InvalidAnalysisOutputError } from '../../domain/repositories/project-analyzer.interface';
import { normalizeSkillName } from '../../shared/utils/normalize-skill-name';
import type { SkillCatalogIndex } from '../analysis/skill-catalog-index';

export type ParsedCharacterization = Omit<
  NeedCharacterization,
  'provider' | 'model' | 'promptVersion'
>;

interface CatalogContext {
  catalog: SkillCatalogIndex;
  projectTypeCodes: string[];
}

const { textMax, itemMax, listMax, competenciesMax } =
  NEED_CHARACTERIZATION_LIMITS;

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const textOf = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

/** Lista de textos sin vacíos ni repetidos (comparando sin tildes ni mayúsculas). */
function listOf(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: string[] = [];
  for (const entry of value) {
    const text = textOf(entry, itemMax);
    const key = normalizeSkillName(text);
    if (!text || seen.has(key)) continue;
    seen.add(key);
    items.push(text);
    if (items.length === max) break;
  }
  return items;
}

/**
 * Valida la salida del modelo y la empareja con el catálogo. Es tolerante con lo cosmético
 * (textos largos, repetidos, un tipo de proyecto que no existe) y estricta con lo que deja la
 * caracterización sin sentido: que no sea un objeto o que no traiga el problema.
 * @throws InvalidAnalysisOutputError (el caso de uso reintenta una vez).
 */
export function parseCharacterization(
  raw: unknown,
  { catalog, projectTypeCodes }: CatalogContext,
): ParsedCharacterization {
  if (!isObject(raw)) {
    throw new InvalidAnalysisOutputError('La salida no es un objeto JSON');
  }
  const problem = textOf(raw.problema, textMax);
  if (!problem) {
    throw new InvalidAnalysisOutputError('Falta "problema"');
  }

  const competencies: NeedCompetency[] = [];
  const unmatchedCompetencies: string[] = [];
  for (const name of listOf(raw.competencias, competenciesMax)) {
    const skill = catalog.resolve(name);
    if (!skill) {
      unmatchedCompetencies.push(name);
    } else if (!competencies.some((item) => item.skillId === skill.id)) {
      competencies.push({ skillId: skill.id, name: skill.name });
    }
  }

  const suggested = textOf(raw.tipoProyectoSugerido, 40).toUpperCase();
  return {
    problem,
    objective: textOf(raw.objetivo, textMax),
    beneficiaries: textOf(raw.beneficiarios, textMax),
    expectedResults: listOf(raw.resultadosEsperados, listMax),
    competencies,
    unmatchedCompetencies,
    suggestedProjectTypeCode: projectTypeCodes.includes(suggested)
      ? suggested
      : null,
    missingInformation: listOf(raw.informacionFaltante, listMax),
  };
}
