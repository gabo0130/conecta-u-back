import type { NeedCharacterization } from '../entities/need';

// Índice de completitud de la necesidad (tesis: variable «caracterización de necesidades»).
// Función pura: mide cuántos elementos de una necesidad bien caracterizada están presentes,
// ponderados por su importancia para convertirla en una oportunidad. 0–100.
//
// Pesos (suman 100) — PROPUESTA PARA VALIDAR CON LOS 3 EXPERTOS (formato de juicio de expertos):
//   problema 20 · objetivo 20  → sin ellos no hay de qué partir (enunciado y propósito).
//   beneficiarios 15 · resultados esperados 15 · competencias 15 → definen alcance y perfiles.
//   plazo 10 → condiciona la urgencia real y la planeación.
//   dependencia 5 → quién la plantea; útil para el seguimiento, no para el diseño.
// Si los expertos ajustan los pesos, solo cambia `NEED_COMPLETENESS_WEIGHTS`.

export const NEED_ELEMENTS = [
  'problem',
  'objective',
  'beneficiaries',
  'expectedResults',
  'competencies',
  'deadline',
  'dependency',
] as const;
export type NeedElement = (typeof NEED_ELEMENTS)[number];

export const NEED_COMPLETENESS_WEIGHTS: Record<NeedElement, number> = {
  problem: 20,
  objective: 20,
  beneficiaries: 15,
  expectedResults: 15,
  competencies: 15,
  deadline: 10,
  dependency: 5,
};

export const NEED_ELEMENT_LABELS: Record<NeedElement, string> = {
  problem: 'Problema',
  objective: 'Objetivo',
  beneficiaries: 'Beneficiarios',
  expectedResults: 'Resultados esperados',
  competencies: 'Competencias requeridas',
  deadline: 'Plazo esperado',
  dependency: 'Dependencia que la plantea',
};

/** Lo que mide el índice: lo que declara el formulador y lo que extrajo la caracterización. */
export interface CompletenessInput {
  deadline: string | null;
  dependency: string | null;
  characterization: Pick<
    NeedCharacterization,
    | 'problem'
    | 'objective'
    | 'beneficiaries'
    | 'expectedResults'
    | 'competencies'
  > | null;
}

export interface CompletenessResult {
  /** 0–100, entero. */
  score: number;
  present: NeedElement[];
  missing: { element: NeedElement; label: string; weight: number }[];
}

const hasText = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

function isPresent(element: NeedElement, input: CompletenessInput): boolean {
  const c = input.characterization;
  switch (element) {
    case 'problem':
      return hasText(c?.problem);
    case 'objective':
      return hasText(c?.objective);
    case 'beneficiaries':
      return hasText(c?.beneficiaries);
    case 'expectedResults':
      return (c?.expectedResults.length ?? 0) > 0;
    case 'competencies':
      return (c?.competencies.length ?? 0) > 0;
    case 'deadline':
      return input.deadline !== null;
    case 'dependency':
      return hasText(input.dependency);
  }
}

export function computeNeedCompleteness(
  input: CompletenessInput,
  weights: Record<NeedElement, number> = NEED_COMPLETENESS_WEIGHTS,
): CompletenessResult {
  const total = NEED_ELEMENTS.reduce((sum, e) => sum + weights[e], 0);
  const present = NEED_ELEMENTS.filter((element) => isPresent(element, input));
  const earned = present.reduce((sum, e) => sum + weights[e], 0);
  return {
    score: total === 0 ? 0 : Math.round((100 * earned) / total),
    present,
    missing: NEED_ELEMENTS.filter((e) => !present.includes(e)).map(
      (element) => ({
        element,
        label: NEED_ELEMENT_LABELS[element],
        weight: weights[element],
      }),
    ),
  };
}
