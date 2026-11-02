import {
  computeNeedCompleteness,
  NEED_COMPLETENESS_WEIGHTS,
  NEED_ELEMENTS,
  type CompletenessInput,
} from './need-completeness';

const characterization = {
  problem: 'Los estudiantes no pueden reservar citas.',
  objective: 'Ofrecer reservas en línea.',
  beneficiaries: 'Estudiantes de pregrado',
  expectedResults: ['Plataforma web'],
  competencies: [{ skillId: 's1', name: 'React' }],
};
const complete: CompletenessInput = {
  deadline: '2027-03-01',
  dependency: 'Bienestar Universitario',
  characterization,
};

describe('computeNeedCompleteness (T3)', () => {
  it('los pesos suman 100', () => {
    const total = NEED_ELEMENTS.reduce(
      (sum, element) => sum + NEED_COMPLETENESS_WEIGHTS[element],
      0,
    );
    expect(total).toBe(100);
  });

  it('una necesidad completa vale 100 y no le falta nada', () => {
    expect(computeNeedCompleteness(complete)).toEqual({
      score: 100,
      present: [...NEED_ELEMENTS],
      missing: [],
    });
  });

  it('sin caracterizar solo cuentan el plazo y la dependencia (10 + 5)', () => {
    const result = computeNeedCompleteness({
      ...complete,
      characterization: null,
    });
    expect(result.score).toBe(15);
    expect(result.missing.map((item) => item.element)).toEqual([
      'problem',
      'objective',
      'beneficiaries',
      'expectedResults',
      'competencies',
    ]);
  });

  it('nada declarado vale 0', () => {
    expect(
      computeNeedCompleteness({
        deadline: null,
        dependency: null,
        characterization: null,
      }).score,
    ).toBe(0);
  });

  it('caracterizada sin beneficiarios, competencias ni plazo: 100 − 15 − 15 − 10 = 60', () => {
    const result = computeNeedCompleteness({
      deadline: null,
      dependency: 'Bienestar',
      characterization: {
        ...characterization,
        beneficiaries: '   ',
        competencies: [],
      },
    });
    expect(result.score).toBe(60);
    expect(result.missing).toEqual([
      { element: 'beneficiaries', label: 'Beneficiarios', weight: 15 },
      {
        element: 'competencies',
        label: 'Competencias requeridas',
        weight: 15,
      },
      { element: 'deadline', label: 'Plazo esperado', weight: 10 },
    ]);
  });

  it('acepta pesos alternativos (validación con expertos) y redondea', () => {
    const equal = Object.fromEntries(
      NEED_ELEMENTS.map((element) => [element, 1]),
    ) as typeof NEED_COMPLETENESS_WEIGHTS;
    // 2 de 7 elementos presentes → 28,57 → 29.
    expect(
      computeNeedCompleteness({ ...complete, characterization: null }, equal)
        .score,
    ).toBe(29);
  });
});
