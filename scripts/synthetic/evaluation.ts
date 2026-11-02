import { collaboratorEmbeddingText } from '../../src/application/analysis/collaborator-embedding-text';
import { profileEmbeddingText } from '../../src/application/analysis/catalog-profile-mapper';
import {
  projectExperienceType,
  toProfileSpec,
} from '../../src/application/matchmaking/match-input';
import { rankCandidates } from '../../src/application/matchmaking/rank-candidates';
import { CollaboratorSkillEntity } from '../../src/domain/entities/collaborator-skill.entity';
import { CollaboratorEntity } from '../../src/domain/entities/collaborator.entity';
import { ExperienceEntity } from '../../src/domain/entities/experience.entity';
import {
  RequiredProfileEntity,
  RequiredProfileSkillEntity,
} from '../../src/domain/entities/required-profile.entity';
import { SkillEntity } from '../../src/domain/entities/skill.entity';
import type { EmbeddingProvider } from '../../src/domain/repositories/embedding-provider.interface';
import {
  cosineSimilarity,
  DEFAULT_MATCH_WEIGHTS,
  SEMANTIC_FLOOR,
  type MatchWeights,
} from '../../src/domain/services/match-score';
import {
  competencyCoverageAtK,
  hitRateAtK,
  meanOf,
  ndcgAtK,
  precisionAtK,
  recallAtK,
  type Relevance,
} from '../../src/domain/services/ranking-metrics';
import { FakeEmbeddingProvider } from '../../src/infrastructure/ai/fake-embedding-provider';
import { normalizeSkillName } from '../../src/shared/utils/normalize-skill-name';
import { createRandom, generatePeople, relevanceOf, type SyntheticPerson } from './dataset';
import { TEST_NEEDS, type NeedProfile, type TestNeed } from './needs';

// Evaluación OFFLINE del recomendador con datos sintéticos (tesis, Fase 4 DSR, preliminar).
// ES UNA SIMULACIÓN: no reemplaza el piloto con usuarios ni la valoración de los expertos.
// Usa el mismo código de producción para el puntaje (computeMatch), la conversión de perfiles
// y personas (toProfileSpec / toPersonSpec) y el texto de los embeddings. Por defecto los
// embeddings son los deterministas sin red (FakeEmbeddingProvider, bolsa de palabras con hash):
// la parte "semántica" mide coincidencia de vocabulario, no la de un modelo real. Se puede pasar
// otro proveedor (p. ej. Gemini) para medirla con embeddings reales.

/** Fecha fija para que la duración de las experiencias no cambie entre corridas. */
export const EVALUATION_DATE = new Date('2026-11-02T00:00:00Z');
export const EMBEDDING_DIMENSIONS = 768;
/** Igual que `MATCH_TOP_N` por defecto: cuántas personas guarda la plataforma por perfil. */
export const TOP_N = 10;

export interface EvaluationOptions {
  count: number;
  seed: number;
  ks: number[];
}

export const DEFAULT_OPTIONS: EvaluationOptions = { count: 150, seed: 20261102, ks: [5, 10] };

export const SYSTEMS = ['hibrido', 'hibrido_sin_semantica', 'solo_habilidades', 'aleatorio'] as const;
export type SystemKey = (typeof SYSTEMS)[number];

export const SYSTEM_LABELS: Record<SystemKey, string> = {
  hibrido: 'Híbrido de Conecta U (habilidades 0,5 · semántica 0,2 · experiencia 0,15 · disponibilidad 0,15)',
  hibrido_sin_semantica: 'Híbrido sin embeddings (ablación: el peso semántico se reparte)',
  solo_habilidades: 'Línea base: solo habilidades',
  aleatorio: 'Línea base: orden aleatorio',
};

export const METRICS = ['precision', 'recall', 'hitRate', 'ndcg', 'coverage'] as const;
export type MetricKey = (typeof METRICS)[number];

export const METRIC_LABELS: Record<MetricKey, string> = {
  precision: 'Precision@K',
  recall: 'Recall@K',
  hitRate: 'HitRate@K',
  ndcg: 'NDCG@K',
  coverage: 'Cobertura de competencias@K',
};

type MetricRow = Record<MetricKey, number | null>;

export interface CaseResult {
  needId: string;
  needKind: TestNeed['kind'];
  profile: string;
  archetype: string;
  /** Personas pertinentes (relevancia > 0) entre las elegibles. */
  relevantCount: number;
  rankings: Record<SystemKey, string[]>;
  metrics: Record<SystemKey, Record<string, MetricRow>>;
}

export interface EvaluationResult {
  simulation: true;
  notice: string;
  options: EvaluationOptions;
  dataset: {
    people: number;
    eligiblePeople: number;
    needs: number;
    profiles: number;
    archetypes: number;
  };
  settings: { weights: MatchWeights; topN: number; embedding: string; evaluationDate: string };
  /** Cuánto puede influir la parte semántica con estos embeddings (ver `SEMANTIC_FLOOR`). */
  semanticDiagnostics: {
    semanticFloor: number;
    cosine: { p50: number; p90: number; p99: number; max: number };
    /** Pares (perfil, persona elegible) con coseno por encima del piso: los únicos con aporte semántico. */
    shareAboveFloor: number;
  };
  summary: Record<SystemKey, Record<string, MetricRow>>;
  cases: CaseResult[];
}

export const SIMULATION_NOTICE =
  'SIMULACIÓN con datos sintéticos: la pertinencia "verdadera" la fija el arquetipo con el que se generó cada persona. ' +
  'No reemplaza el piloto con usuarios reales ni la valoración de los expertos; sirve para verificar el funcionamiento del recomendador y compararlo con líneas base.';

const skillEntity = (name: string) => {
  const key = normalizeSkillName(name);
  return new SkillEntity(key, name, key, 'CONOCIMIENTO');
};

function toCollaborator(person: SyntheticPerson): CollaboratorEntity {
  return new CollaboratorEntity({
    id: person.id,
    email: person.email,
    userId: null,
    firstName: person.firstName,
    lastName: person.lastName,
    personType: person.personType,
    programId: person.program,
    semester: person.semester,
    summary: person.summary,
    interests: person.interests,
    availabilityStatus: person.availabilityStatus,
    weeklyHours: person.weeklyHours,
    dataConsent: true,
    skills: person.skills.map(
      (skill, index) =>
        new CollaboratorSkillEntity(`${person.id}-s${index}`, person.id, skillEntity(skill.name), skill.level, skill.months, skill.lastUsedYear),
    ),
    experiences: person.experiences.map(
      (experience, index) =>
        new ExperienceEntity({
          id: `${person.id}-e${index}`,
          collaboratorId: person.id,
          type: experience.type,
          role: experience.role,
          organization: experience.organization,
          startDate: experience.startDate,
          endDate: experience.endDate,
          current: experience.endDate === null,
          weeklyHours: experience.weeklyHours,
          level: experience.level,
          technologies: experience.technologies.map(skillEntity),
        }),
    ),
  });
}

function toRequiredProfile(need: TestNeed, profile: NeedProfile, index: number): RequiredProfileEntity {
  const id = `${need.id}-P${index + 1}`;
  return new RequiredProfileEntity({
    id,
    projectId: need.id,
    analysisId: null,
    source: 'MANUAL',
    name: profile.name,
    // En producción la descripción la escribe la IA; aquí, el texto de la necesidad.
    description: need.text,
    justification: '',
    quantity: 1,
    priority: 'ALTA',
    minWeeklyHours: profile.minWeeklyHours,
    position: index,
    active: true,
    skills: profile.skills.map(
      (skill, skillIndex) =>
        new RequiredProfileSkillEntity(`${id}-k${skillIndex}`, id, null, skill.name, 'CONOCIMIENTO', skill.minLevel, skill.importance),
    ),
    createdAt: EVALUATION_DATE,
    updatedAt: EVALUATION_DATE,
  });
}

/** El mismo orden que la generación de recomendaciones (`rankCandidates`), sin copias. */
function rankHybrid(
  profile: RequiredProfileEntity,
  profileEmbedding: number[] | null,
  candidates: { collaborator: CollaboratorEntity; embedding: number[] | null }[],
  weights: MatchWeights,
  experienceType: ReturnType<typeof projectExperienceType>,
): string[] {
  return rankCandidates(toProfileSpec(profile, profileEmbedding), candidates, {
    weights,
    projectExperienceType: experienceType,
    topN: TOP_N,
    now: EVALUATION_DATE,
  }).map(({ collaborator }) => collaborator.id);
}

function evaluateRanking(
  ranked: string[],
  relevance: Relevance,
  requiredSkills: string[],
  skillsOf: (id: string) => ReadonlySet<string>,
  ks: number[],
): Record<string, MetricRow> {
  return Object.fromEntries(
    ks.map((k) => [
      `@${k}`,
      {
        precision: precisionAtK(ranked, relevance, k),
        recall: recallAtK(ranked, relevance, k),
        hitRate: hitRateAtK(ranked, relevance, k),
        ndcg: ndcgAtK(ranked, relevance, k),
        coverage: competencyCoverageAtK(ranked, requiredSkills, skillsOf, k),
      },
    ]),
  );
}

const round = (value: number | null) => (value === null ? null : Math.round(value * 10000) / 10000);

const EMBED_BATCH = 50;

async function embedAll(embedder: EmbeddingProvider, texts: string[]): Promise<number[][]> {
  const vectors: number[][] = [];
  for (let start = 0; start < texts.length; start += EMBED_BATCH) {
    vectors.push(...(await embedder.embed(texts.slice(start, start + EMBED_BATCH))));
  }
  return vectors;
}

function quantile(sorted: number[], q: number): number {
  return sorted.length === 0 ? 0 : sorted[Math.floor(q * (sorted.length - 1))];
}

export async function runEvaluation(
  options: EvaluationOptions = DEFAULT_OPTIONS,
  embedder: EmbeddingProvider = new FakeEmbeddingProvider(EMBEDDING_DIMENSIONS),
): Promise<EvaluationResult> {
  const people = generatePeople(options.count, options.seed);
  // Por defecto la plataforma no recomienda a quien figura NO_DISPONIBLE.
  const eligible = people.filter((person) => person.availabilityStatus !== 'NO_DISPONIBLE');
  const collaborators = eligible.map(toCollaborator);
  const personEmbeddings = await embedAll(embedder, collaborators.map(collaboratorEmbeddingText));
  const withEmbedding = collaborators.map((collaborator, index) => ({ collaborator, embedding: personEmbeddings[index] }));
  const withoutEmbedding = collaborators.map((collaborator) => ({ collaborator, embedding: null }));
  const skillsById = new Map(eligible.map((person) => [person.id, new Set(person.skills.map((skill) => normalizeSkillName(skill.name)))]));
  const skillsOf = (id: string) => skillsById.get(id) ?? new Set<string>();
  const random = createRandom(options.seed + 1);

  const cases: CaseResult[] = [];
  const cosines: number[] = [];
  for (const need of TEST_NEEDS) {
    const experienceType = projectExperienceType(need.projectType);
    for (const [index, needProfile] of need.profiles.entries()) {
      const profile = toRequiredProfile(need, needProfile, index);
      const [profileEmbedding] = await embedder.embed([
        profileEmbeddingText({ name: profile.name, description: profile.description, skills: profile.skills }),
      ]);
      for (const vector of personEmbeddings) cosines.push(cosineSimilarity(profileEmbedding, vector));
      const relevance: Relevance = new Map(
        eligible.map((person) => [person.id, relevanceOf(person, needProfile.archetype, needProfile.alsoRelevant)]),
      );
      const shuffled = random.sample(eligible.map((person) => person.id), eligible.length).slice(0, TOP_N);
      const rankings: Record<SystemKey, string[]> = {
        hibrido: rankHybrid(profile, profileEmbedding, withEmbedding, DEFAULT_MATCH_WEIGHTS, experienceType),
        hibrido_sin_semantica: rankHybrid(profile, null, withoutEmbedding, DEFAULT_MATCH_WEIGHTS, experienceType),
        solo_habilidades: rankHybrid(profile, null, withoutEmbedding, { skills: 1, semantic: 0, experience: 0, availability: 0 }, experienceType),
        aleatorio: shuffled,
      };
      const required = needProfile.skills.map((skill) => normalizeSkillName(skill.name));
      cases.push({
        needId: need.id,
        needKind: need.kind,
        profile: needProfile.name,
        archetype: needProfile.archetype,
        relevantCount: [...relevance.values()].filter((grade) => grade > 0).length,
        rankings,
        metrics: Object.fromEntries(
          SYSTEMS.map((system) => [system, evaluateRanking(rankings[system], relevance, required, skillsOf, options.ks)]),
        ) as CaseResult['metrics'],
      });
    }
  }

  const summary = Object.fromEntries(
    SYSTEMS.map((system) => [
      system,
      Object.fromEntries(
        options.ks.map((k) => [
          `@${k}`,
          Object.fromEntries(
            METRICS.map((metric) => [metric, round(meanOf(cases.map((item) => item.metrics[system][`@${k}`][metric])))]),
          ) as MetricRow,
        ]),
      ),
    ]),
  ) as EvaluationResult['summary'];

  return {
    simulation: true,
    notice: SIMULATION_NOTICE,
    options,
    dataset: {
      people: people.length,
      eligiblePeople: eligible.length,
      needs: TEST_NEEDS.length,
      profiles: cases.length,
      archetypes: new Set(people.map((person) => person.primary)).size,
    },
    settings: {
      weights: DEFAULT_MATCH_WEIGHTS,
      topN: TOP_N,
      embedding: embedder.model,
      evaluationDate: EVALUATION_DATE.toISOString().slice(0, 10),
    },
    semanticDiagnostics: semanticDiagnostics(cosines),
    summary,
    cases,
  };
}

function semanticDiagnostics(cosines: number[]): EvaluationResult['semanticDiagnostics'] {
  const sorted = [...cosines].sort((a, b) => a - b);
  const share = sorted.length === 0 ? 0 : sorted.filter((value) => value > SEMANTIC_FLOOR).length / sorted.length;
  return {
    semanticFloor: SEMANTIC_FLOOR,
    cosine: {
      p50: round(quantile(sorted, 0.5))!,
      p90: round(quantile(sorted, 0.9))!,
      p99: round(quantile(sorted, 0.99))!,
      max: round(quantile(sorted, 1))!,
    },
    shareAboveFloor: round(share)!,
  };
}

const decimal = (value: number) => value.toString().replace('.', ',');

const pct = (value: number | null) => (value === null ? '—' : value.toFixed(3).replace('.', ','));

/** Compara el híbrido con «solo habilidades» en NDCG al K mayor, sin adornar el resultado. */
function comparisonLine(result: EvaluationResult): string {
  const k = `@${result.options.ks[result.options.ks.length - 1]}`;
  const hybrid = result.summary.hibrido[k].ndcg ?? 0;
  const skills = result.summary.solo_habilidades[k].ndcg ?? 0;
  const difference = hybrid - skills;
  if (Math.abs(difference) < 0.02) {
    return `- El híbrido y «solo habilidades» quedan prácticamente empatados (NDCG${k}: ${pct(hybrid)} frente a ${pct(skills)}). En datos generados a partir de habilidades, estas ya explican casi toda la pertinencia; el aporte de experiencia, disponibilidad y semántica debe valorarse con el piloto y los expertos.`;
  }
  return `- El híbrido ${difference > 0 ? 'supera' : 'queda por debajo de'} «solo habilidades» en NDCG${k} (${pct(hybrid)} frente a ${pct(skills)}).`;
}

/** Informe en Markdown con la tabla de resultados (marcado como simulación). */
export function toMarkdown(result: EvaluationResult): string {
  const lines = [
    '# Evaluación preliminar del recomendador con datos sintéticos',
    '',
    `> **${result.notice}**`,
    '',
    '## Parámetros (reproducibles)',
    '',
    `- Semilla: \`${result.options.seed}\` · personas generadas: ${result.dataset.people} (${result.dataset.eligiblePeople} elegibles: se excluye a quien figura NO_DISPONIBLE, igual que la plataforma por defecto) · arquetipos: ${result.dataset.archetypes}.`,
    `- Necesidades de prueba: ${result.dataset.needs} · perfiles requeridos evaluados: ${result.dataset.profiles}.`,
    `- Pesos del híbrido: habilidades ${decimal(result.settings.weights.skills)}, semántica ${decimal(result.settings.weights.semantic)}, experiencia ${decimal(result.settings.weights.experience)}, disponibilidad ${decimal(result.settings.weights.availability)}. Lista de ${result.settings.topN} personas por perfil.`,
    `- Embeddings: \`${result.settings.embedding}\` (deterministas, sin red). Fecha de referencia: ${result.settings.evaluationDate}.`,
    '- Pertinencia graduada: 2 si el arquetipo principal de la persona es el del perfil; 1 si es su arquetipo secundario o uno de los «también pertinentes» del perfil; 0 en otro caso.',
    `- Reproducir: \`npx ts-node scripts/synthetic/evaluate-recommender.ts --count ${result.options.count} --seed ${result.options.seed}\`.`,
    '',
    '## Resultados (promedio sobre los perfiles; Recall, NDCG y cobertura omiten casos sin valor)',
    '',
  ];
  for (const k of result.options.ks) {
    lines.push(`### K = ${k}`, '', `| Sistema | ${METRICS.map((metric) => METRIC_LABELS[metric].replace('@K', `@${k}`)).join(' | ')} |`, `|---|${METRICS.map(() => '---:').join('|')}|`);
    for (const system of SYSTEMS) {
      const row = result.summary[system][`@${k}`];
      lines.push(`| ${SYSTEM_LABELS[system]} | ${METRICS.map((metric) => pct(row[metric])).join(' | ')} |`);
    }
    lines.push('');
  }
  const diagnostics = result.semanticDiagnostics;
  lines.push(
    '## Aporte de la parte semántica con estos embeddings',
    '',
    `- El puntaje reescala el coseno entre ${diagnostics.semanticFloor.toString().replace('.', ',')} y 0,85 (pensado para embeddings de un modelo real como Gemini). Con \`${result.settings.embedding}\` el coseno perfil–persona queda en p50 = ${pct(diagnostics.cosine.p50)}, p90 = ${pct(diagnostics.cosine.p90)}, p99 = ${pct(diagnostics.cosine.p99)} y máximo ${pct(diagnostics.cosine.max)}: solo el ${(diagnostics.shareAboveFloor * 100).toFixed(1).replace('.', ',')} % de los pares supera el piso.`,
    diagnostics.shareAboveFloor < 0.05
      ? '- **Por eso, en esta simulación la parte semántica casi no influye y el híbrido coincide (o casi) con la ablación sin embeddings.** No es una conclusión sobre la semántica real: para medirla hay que correr el script con embeddings de Gemini (`--embeddings gemini`, requiere `GEMINI_API_KEY`).'
      : '- La parte semántica sí influye en esta corrida: comparar el híbrido con la ablación sin embeddings.',
    '',
    '## Lectura',
    '',
    '- Las líneas base acotan el resultado: «aleatorio» es el piso; «solo habilidades» muestra cuánto aporta combinar experiencia, disponibilidad y similitud de texto.',
    '- La ablación «sin embeddings» aísla el aporte de la parte semántica (ver la sección anterior).',
    comparisonLine(result),
    '- Los valores dependen de cómo se generaron los datos (arquetipos, ruido, disponibilidad): sirven para verificar el artefacto y compararlo con líneas base, no como evidencia de desempeño con usuarios reales.',
    '',
    '## Detalle por perfil (NDCG@10)',
    '',
    `| Necesidad | Tipo | Perfil | Pertinentes | ${SYSTEMS.map((system) => system).join(' | ')} |`,
    `|---|---|---|---:|${SYSTEMS.map(() => '---:').join('|')}|`,
  );
  const lastK = `@${result.options.ks[result.options.ks.length - 1]}`;
  for (const item of result.cases) {
    lines.push(`| ${item.needId} | ${item.needKind} | ${item.profile} | ${item.relevantCount} | ${SYSTEMS.map((system) => pct(item.metrics[system][lastK].ndcg)).join(' | ')} |`);
  }
  lines.push('');
  return lines.join('\n');
}
