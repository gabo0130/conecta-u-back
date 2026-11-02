import {
  competencyCoverageAtK,
  dcgAtK,
  hitRateAtK,
  meanOf,
  ndcgAtK,
  precisionAtK,
  recallAtK,
} from './ranking-metrics';

// Caso de referencia: 5 recomendados; pertinentes a (2), c (1) y x (1, no recomendado).
const ranked = ['a', 'b', 'c', 'd', 'e'];
const relevance = new Map([
  ['a', 2],
  ['c', 1],
  ['x', 1],
  ['b', 0],
]);

describe('ranking metrics (T8)', () => {
  it('Precision@K', () => {
    expect(precisionAtK(ranked, relevance, 1)).toBe(1);
    expect(precisionAtK(ranked, relevance, 3)).toBeCloseTo(2 / 3);
    expect(precisionAtK(ranked, relevance, 5)).toBe(0.4);
    // Lista más corta que K: los huecos no son pertinentes.
    expect(precisionAtK(['a'], relevance, 5)).toBe(0.2);
  });

  it('Recall@K', () => {
    expect(recallAtK(ranked, relevance, 1)).toBeCloseTo(1 / 3);
    expect(recallAtK(ranked, relevance, 5)).toBeCloseTo(2 / 3);
    expect(recallAtK(ranked, new Map([['a', 0]]), 5)).toBeNull();
  });

  it('HitRate@K', () => {
    expect(hitRateAtK(ranked, relevance, 1)).toBe(1);
    expect(hitRateAtK(['b', 'd', 'c'], relevance, 2)).toBe(0);
    expect(hitRateAtK(['b', 'd', 'c'], relevance, 3)).toBe(1);
  });

  it('DCG@K con ganancia 2^rel − 1 y descuento log2(i + 1)', () => {
    // 3/log2(2) + 0 + 1/log2(4) = 3 + 0,5
    expect(dcgAtK([2, 0, 1], 3)).toBeCloseTo(3.5);
  });

  it('NDCG@K con relevancia graduada', () => {
    // DCG@5 = 3 + 1/2 = 3,5; ideal [2, 1, 1] → 3 + 1/log2(3) + 1/2 = 4,1309
    expect(ndcgAtK(ranked, relevance, 5)).toBeCloseTo(
      3.5 / (3.5 + 1 / Math.log2(3)),
      6,
    );
    expect(ndcgAtK(ranked, relevance, 1)).toBe(1);
    // Orden perfecto = 1; sin pertinentes en el top = 0; sin pertinentes en el caso = null.
    expect(ndcgAtK(['a', 'c', 'x'], relevance, 3)).toBeCloseTo(1);
    expect(ndcgAtK(['b', 'd'], relevance, 2)).toBe(0);
    expect(ndcgAtK(ranked, new Map(), 5)).toBeNull();
  });

  it('cobertura de competencias del top K', () => {
    const skills: Record<string, string[]> = {
      a: ['python', 'sql'],
      b: ['react'],
      c: ['sql', 'docker'],
    };
    const skillsOf = (id: string) => new Set(skills[id] ?? []);
    const required = ['python', 'sql', 'docker', 'scrum'];
    expect(competencyCoverageAtK(ranked, required, skillsOf, 1)).toBe(0.5);
    expect(competencyCoverageAtK(ranked, required, skillsOf, 3)).toBe(0.75);
    expect(competencyCoverageAtK(ranked, [], skillsOf, 3)).toBeNull();
  });

  it('rechaza un K inválido', () => {
    expect(() => precisionAtK(ranked, relevance, 0)).toThrow(RangeError);
    expect(() => ndcgAtK(ranked, relevance, 2.5)).toThrow(RangeError);
  });

  it('meanOf ignora los casos sin valor', () => {
    expect(meanOf([1, null, 0.5])).toBe(0.75);
    expect(meanOf([null])).toBeNull();
  });
});
