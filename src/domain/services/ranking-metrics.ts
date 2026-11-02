// Métricas de evaluación de un ranking de recomendaciones (tesis, D6). Funciones puras: reciben
// la lista ordenada de ids que devolvió el recomendador y la pertinencia esperada de cada id
// (relevancia graduada: 0 = no pertinente, 1 = pertinente, 2 = muy pertinente…).
//
//   Precision@K = pertinentes en el top K / K
//   Recall@K    = pertinentes en el top K / total de pertinentes
//   HitRate@K   = 1 si hay al menos un pertinente en el top K, si no 0
//   NDCG@K      = DCG@K / IDCG@K, con DCG@K = Σ_{i=1..K} (2^rel_i − 1) / log2(i + 1)
//   Cobertura@K = competencias requeridas que tiene al menos una persona del top K / requeridas

/** Pertinencia esperada por id; los que no aparecen valen 0. */
export type Relevance = ReadonlyMap<string, number>;

const gradeOf = (relevance: Relevance, id: string): number =>
  Math.max(relevance.get(id) ?? 0, 0);

function assertK(k: number): void {
  if (!Number.isInteger(k) || k < 1) {
    throw new RangeError(
      `K debe ser un entero mayor o igual a 1 (recibido ${k})`,
    );
  }
}

const relevantInTop = (
  ranked: readonly string[],
  relevance: Relevance,
  k: number,
) => ranked.slice(0, k).filter((id) => gradeOf(relevance, id) > 0).length;

const totalRelevant = (relevance: Relevance) =>
  [...relevance.values()].filter((grade) => grade > 0).length;

/** Si la lista tiene menos de K elementos, los huecos cuentan como no pertinentes. */
export function precisionAtK(
  ranked: readonly string[],
  relevance: Relevance,
  k: number,
): number {
  assertK(k);
  return relevantInTop(ranked, relevance, k) / k;
}

/** `null` si el caso no tiene ningún pertinente (no se puede recuperar nada). */
export function recallAtK(
  ranked: readonly string[],
  relevance: Relevance,
  k: number,
): number | null {
  assertK(k);
  const total = totalRelevant(relevance);
  return total === 0 ? null : relevantInTop(ranked, relevance, k) / total;
}

export function hitRateAtK(
  ranked: readonly string[],
  relevance: Relevance,
  k: number,
): number {
  assertK(k);
  return relevantInTop(ranked, relevance, k) > 0 ? 1 : 0;
}

const gain = (grade: number) => 2 ** grade - 1;
const discount = (position: number) => Math.log2(position + 1);

export function dcgAtK(grades: readonly number[], k: number): number {
  assertK(k);
  return grades
    .slice(0, k)
    .reduce((sum, grade, index) => sum + gain(grade) / discount(index + 1), 0);
}

/** `null` si el caso no tiene ningún pertinente (IDCG = 0). */
export function ndcgAtK(
  ranked: readonly string[],
  relevance: Relevance,
  k: number,
): number | null {
  assertK(k);
  const ideal = [...relevance.values()]
    .filter((grade) => grade > 0)
    .sort((a, b) => b - a);
  const idcg = dcgAtK(ideal, k);
  if (idcg === 0) return null;
  return (
    dcgAtK(
      ranked.map((id) => gradeOf(relevance, id)),
      k,
    ) / idcg
  );
}

/**
 * Cobertura de competencias: qué parte de las competencias que pide el perfil tiene al menos
 * una de las K primeras personas. `skillsOf` devuelve las competencias (ya normalizadas) de
 * cada persona. `null` si el perfil no pide competencias.
 */
export function competencyCoverageAtK(
  ranked: readonly string[],
  requiredSkills: readonly string[],
  skillsOf: (id: string) => ReadonlySet<string>,
  k: number,
): number | null {
  assertK(k);
  const required = new Set(requiredSkills);
  if (required.size === 0) return null;
  const covered = new Set<string>();
  for (const id of ranked.slice(0, k)) {
    for (const skill of skillsOf(id))
      if (required.has(skill)) covered.add(skill);
  }
  return covered.size / required.size;
}

/** Promedio que ignora los casos sin valor (`null`); `null` si no queda ninguno. */
export function meanOf(values: readonly (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null);
  return present.length === 0
    ? null
    : present.reduce((sum, value) => sum + value, 0) / present.length;
}
