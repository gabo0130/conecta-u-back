import {
  computeNeedPriority,
  NEED_PRIORITY_WEIGHTS,
  priorityLevel,
} from './need-priority';

describe('computeNeedPriority (T4)', () => {
  it('los pesos suman 1', () => {
    const { impact, urgency, completeness } = NEED_PRIORITY_WEIGHTS;
    expect(impact + urgency + completeness).toBeCloseTo(1);
  });

  it.each([
    // impacto, urgencia, completitud → puntaje, nivel
    [5, 5, 100, 100, 'ALTA'],
    [1, 1, 0, 16, 'BAJA'],
    [5, 4, 85, 89, 'ALTA'],
    [3, 3, 50, 58, 'MEDIA'],
    [4, 2, 15, 51, 'MEDIA'],
    [2, 2, 0, 32, 'BAJA'],
  ])(
    'impacto %i, urgencia %i, completitud %i → %d (%s)',
    (impact, urgency, completeness, score, level) => {
      expect(computeNeedPriority({ impact, urgency, completeness })).toEqual({
        score,
        level,
      });
    },
  );

  it('redondea a 2 decimales', () => {
    // 100 · (0,4·3/5 + 0,4·4/5 + 0,2·33/100) = 24 + 32 + 6,6 = 62,6
    expect(
      computeNeedPriority({ impact: 3, urgency: 4, completeness: 33 }).score,
    ).toBe(62.6);
  });

  it('umbrales: 70 es ALTA y 40 es MEDIA', () => {
    expect(priorityLevel(70)).toBe('ALTA');
    expect(priorityLevel(69.99)).toBe('MEDIA');
    expect(priorityLevel(40)).toBe('MEDIA');
    expect(priorityLevel(39.99)).toBe('BAJA');
  });
});
