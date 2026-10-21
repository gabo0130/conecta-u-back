import {
  DEFAULT_MATCH_WEIGHTS,
  SEMANTIC_CEILING,
  SEMANTIC_FLOOR,
  computeMatch,
  cosineSimilarity,
  normalizeWeights,
  type MatchOptions,
  type PersonSpec,
  type RequiredProfileSpec,
  type RequiredSkillSpec,
} from './match-score';

const options: MatchOptions = {
  weights: DEFAULT_MATCH_WEIGHTS,
  projectExperienceType: null,
};

const required = (
  overrides: Partial<RequiredSkillSpec> = {},
): RequiredSkillSpec => ({
  skillId: 'react',
  name: 'React',
  normalizedName: 'react',
  minLevel: 'INTERMEDIO',
  importance: 'ALTA',
  ...overrides,
});

const profile = (
  overrides: Partial<RequiredProfileSpec> = {},
): RequiredProfileSpec => ({
  skills: [required()],
  minWeeklyHours: null,
  embedding: null,
  ...overrides,
});

const person = (overrides: Partial<PersonSpec> = {}): PersonSpec => ({
  skills: [
    {
      skillId: 'react',
      normalizedNames: ['react'],
      level: 'INTERMEDIO',
      months: 24,
    },
  ],
  experiences: [],
  availabilityStatus: 'DISPONIBLE',
  weeklyHours: 10,
  embedding: null,
  ...overrides,
});

/** Vector unitario cuyo coseno con [1, 0] es `cosine`. */
const withCosine = (cosine: number): number[] => [
  cosine,
  Math.sqrt(1 - cosine * cosine),
];

describe('computeMatch · habilidades', () => {
  it('scores 1 when the person has the skill at the required level with depth', () => {
    const result = computeMatch(profile(), person(), options);

    expect(result.components.skills).toBe(1);
    expect(result.breakdown.matchedSkills).toEqual([
      expect.objectContaining({
        skill: 'React',
        has: 'INTERMEDIO',
        months: 24,
        points: 1,
      }),
    ]);
    expect(result.breakdown.missingSkills).toEqual([]);
  });

  it('scores 0 and lists the missing skills when the person has none', () => {
    const result = computeMatch(profile(), person({ skills: [] }), options);

    expect(result.components.skills).toBe(0);
    expect(result.breakdown.missingSkills).toEqual([
      { skill: 'React', required: 'INTERMEDIO', importance: 'ALTA' },
    ]);
    expect(result.relevant).toBe(false);
  });

  it('gives partial credit for a lower level (BASICO vs AVANZADO = 1/3)', () => {
    const result = computeMatch(
      profile({ skills: [required({ minLevel: 'AVANZADO' })] }),
      person({
        skills: [
          {
            skillId: 'react',
            normalizedNames: ['react'],
            level: 'BASICO',
            months: 24,
          },
        ],
      }),
      options,
    );

    expect(result.components.skills).toBeCloseTo(1 / 3, 3);
  });

  it('does not reward a level above the required one', () => {
    const result = computeMatch(
      profile(),
      person({
        skills: [
          {
            skillId: 'react',
            normalizedNames: ['react'],
            level: 'EXPERTO',
            months: 24,
          },
        ],
      }),
      options,
    );

    expect(result.components.skills).toBe(1);
  });

  it('discounts a skill with little experience (0 months = 0.7)', () => {
    const result = computeMatch(
      profile(),
      person({
        skills: [
          {
            skillId: 'react',
            normalizedNames: ['react'],
            level: 'INTERMEDIO',
            months: 0,
          },
        ],
      }),
      options,
    );

    expect(result.components.skills).toBeCloseTo(0.7, 3);
  });

  it('weighs skills by importance (ALTA 3, MEDIA 2, BAJA 1)', () => {
    const result = computeMatch(
      profile({
        skills: [
          required({
            skillId: 'a',
            name: 'A',
            normalizedName: 'a',
            importance: 'ALTA',
          }),
          required({
            skillId: 'b',
            name: 'B',
            normalizedName: 'b',
            importance: 'BAJA',
          }),
        ],
      }),
      person({
        skills: [
          {
            skillId: 'a',
            normalizedNames: ['a'],
            level: 'INTERMEDIO',
            months: 24,
          },
        ],
      }),
      options,
    );

    // Tiene la ALTA (3) y le falta la BAJA (1): 3 / 4.
    expect(result.components.skills).toBeCloseTo(0.75, 3);
  });

  it('matches an uncatalogued skill by name or synonym', () => {
    const result = computeMatch(
      profile({
        skills: [required({ skillId: null, normalizedName: 'reactjs' })],
      }),
      person({
        skills: [
          {
            skillId: 'react',
            normalizedNames: ['react', 'reactjs'],
            level: 'INTERMEDIO',
            months: 24,
          },
        ],
      }),
      options,
    );

    expect(result.components.skills).toBe(1);
  });

  it('does not match an uncatalogued skill with an unrelated name', () => {
    const result = computeMatch(
      profile({
        skills: [required({ skillId: null, normalizedName: 'cobol' })],
      }),
      person(),
      options,
    );

    expect(result.components.skills).toBe(0);
  });

  it('scores 0 for a profile without skills instead of dividing by zero', () => {
    const result = computeMatch(profile({ skills: [] }), person(), options);

    expect(result.components.skills).toBe(0);
    expect(Number.isFinite(result.score)).toBe(true);
  });
});

describe('computeMatch · experiencia', () => {
  const experience = (overrides = {}) => ({
    type: 'LABORAL' as const,
    label: 'Desarrollador – UFPS',
    months: 12,
    skillIds: ['react'],
    ...overrides,
  });

  it('counts months of experiences that used the required technologies', () => {
    const result = computeMatch(
      profile(),
      person({
        experiences: [experience(), experience({ skillIds: ['otra'] })],
      }),
      options,
    );

    expect(result.components.experience).toBeCloseTo(0.5, 3);
    expect(result.breakdown.experience).toEqual({
      relevantMonths: 12,
      items: ['Desarrollador – UFPS (12 meses)'],
    });
  });

  it('caps the experience score at 24 months', () => {
    const result = computeMatch(
      profile(),
      person({ experiences: [experience({ months: 60 })] }),
      options,
    );

    expect(result.components.experience).toBe(1);
  });

  it('adds a bonus when the experience type matches the project type', () => {
    const result = computeMatch(
      profile(),
      person({
        experiences: [experience({ type: 'SEMILLERO_INVESTIGACION' })],
      }),
      { ...options, projectExperienceType: 'SEMILLERO_INVESTIGACION' },
    );

    expect(result.components.experience).toBeCloseTo(0.7, 3);
  });

  it('does not add the bonus to experience unrelated to the profile', () => {
    const result = computeMatch(
      profile(),
      person({
        experiences: [
          experience({ type: 'SEMILLERO_INVESTIGACION', skillIds: ['otra'] }),
        ],
      }),
      { ...options, projectExperienceType: 'SEMILLERO_INVESTIGACION' },
    );

    expect(result.components.experience).toBe(0);
  });

  it('counts a technology used in an experience even if not listed as a skill', () => {
    const result = computeMatch(
      profile(),
      person({ skills: [], experiences: [experience()] }),
      options,
    );

    expect(result.relevant).toBe(true);
    expect(result.components.skills).toBe(0);
    expect(result.components.experience).toBeCloseTo(0.5, 3);
  });
});

describe('computeMatch · disponibilidad', () => {
  it.each([
    ['DISPONIBLE', 1],
    ['PARCIAL', 0.6],
    ['NO_DISPONIBLE', 0],
  ] as const)('%s scores %s when no hours are required', (status, expected) => {
    const result = computeMatch(
      profile(),
      person({ availabilityStatus: status }),
      options,
    );

    expect(result.components.availability).toBe(expected);
  });

  it('scales by the hours the person offers against the hours required', () => {
    const result = computeMatch(
      profile({ minWeeklyHours: 20 }),
      person({ weeklyHours: 10 }),
      options,
    );

    expect(result.components.availability).toBe(0.5);
    expect(result.breakdown.availability).toEqual({
      status: 'DISPONIBLE',
      weeklyHours: 10,
      requiredHours: 20,
    });
  });

  it('does not reward offering more hours than required', () => {
    const result = computeMatch(
      profile({ minWeeklyHours: 5 }),
      person({ weeklyHours: 40 }),
      options,
    );

    expect(result.components.availability).toBe(1);
  });
});

describe('computeMatch · semántica', () => {
  it('redistributes the semantic weight when an embedding is missing', () => {
    const result = computeMatch(profile(), person(), options);

    expect(result.breakdown.semantic.similarity).toBeNull();
    expect(result.breakdown.weights.semantic).toBe(0);
    const { skills, experience, availability } = result.breakdown.weights;
    expect(skills + experience + availability).toBeCloseTo(1, 3);
    // S = 1, A = 1, E = 0: 0.5/0.8 + 0.15/0.8 = 0.8125
    expect(result.score).toBeCloseTo(81.25, 2);
  });

  it('maps the cosine similarity into a 0–1 semantic score', () => {
    const middle = (SEMANTIC_FLOOR + SEMANTIC_CEILING) / 2;
    const result = computeMatch(
      profile({ embedding: [1, 0] }),
      person({ embedding: withCosine(middle) }),
      options,
    );

    expect(result.breakdown.semantic.similarity).toBeCloseTo(middle, 3);
    expect(result.components.semantic).toBeCloseTo(0.5, 2);
  });

  it('clamps the semantic score to 0 and 1', () => {
    const low = computeMatch(
      profile({ embedding: [1, 0] }),
      person({ embedding: [0, 1] }),
      options,
    );
    const high = computeMatch(
      profile({ embedding: [1, 0] }),
      person({ embedding: [1, 0] }),
      options,
    );

    expect(low.components.semantic).toBe(0);
    expect(high.components.semantic).toBe(1);
  });

  it('uses the configured weights when both embeddings exist', () => {
    const result = computeMatch(
      profile({ embedding: [1, 0] }),
      person({ embedding: [1, 0] }),
      options,
    );

    expect(result.breakdown.weights).toEqual(DEFAULT_MATCH_WEIGHTS);
    // S = 1, M = 1, E = 0, A = 1 → 0.5 + 0.2 + 0 + 0.15
    expect(result.score).toBe(85);
  });
});

describe('computeMatch · puntaje', () => {
  it('reaches 100 with a perfect match', () => {
    const result = computeMatch(
      profile({ embedding: [1, 0] }),
      person({
        embedding: [1, 0],
        experiences: [
          { type: 'LABORAL', label: 'x', months: 30, skillIds: ['react'] },
        ],
      }),
      options,
    );

    expect(result.score).toBe(100);
  });

  it('applies custom weights', () => {
    const result = computeMatch(
      profile(),
      person({ availabilityStatus: 'NO_DISPONIBLE' }),
      {
        ...options,
        weights: { skills: 0, semantic: 0, experience: 0, availability: 1 },
      },
    );

    // Con todo el peso en disponibilidad y la persona no disponible: 0.
    expect(result.score).toBe(0);
  });

  it('normalizes custom weights that do not add up to 1', () => {
    const result = computeMatch(profile(), person(), {
      ...options,
      weights: { skills: 2, semantic: 0, experience: 0, availability: 0 },
    });

    expect(result.score).toBe(100);
  });

  it('ranks a stronger candidate above a weaker one', () => {
    const strong = computeMatch(profile(), person(), options);
    const weak = computeMatch(
      profile(),
      person({ availabilityStatus: 'PARCIAL', skills: [] }),
      options,
    );

    expect(strong.score).toBeGreaterThan(weak.score);
  });
});

describe('cosineSimilarity y normalizeWeights', () => {
  it('computes the cosine of two vectors', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1, 6);
  });

  it('returns 0 for vectors of different size or zero length', () => {
    expect(cosineSimilarity([1, 0], [1])).toBe(0);
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });

  it('falls back to the default weights when all are zero', () => {
    expect(
      normalizeWeights({
        skills: 0,
        semantic: 0,
        experience: 0,
        availability: 0,
      }),
    ).toEqual(DEFAULT_MATCH_WEIGHTS);
  });
});
