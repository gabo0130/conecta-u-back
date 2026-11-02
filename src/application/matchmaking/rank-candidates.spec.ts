import { DEFAULT_MATCH_WEIGHTS } from '../../domain/services/match-score';
import {
  buildCollaborator,
  buildCollaboratorSkill,
  buildSkill,
} from '../../testing/test-doubles.testing';
import { rankCandidates } from './rank-candidates';

const react = buildSkill({ id: 'k-react', name: 'React' });
const person = (id: string, lastName: string, withSkill = true) => ({
  collaborator: buildCollaborator({
    id,
    lastName,
    firstName: 'Ana',
    availabilityStatus: 'DISPONIBLE',
    weeklyHours: 10,
    skills: withSkill ? [buildCollaboratorSkill({ skill: react })] : [],
  }),
  embedding: null,
});

describe('rankCandidates', () => {
  const profile = {
    skills: [
      {
        skillId: 'k-react',
        name: 'React',
        normalizedName: 'react',
        minLevel: 'BASICO' as const,
        importance: 'ALTA' as const,
      },
    ],
    minWeeklyHours: null,
    embedding: null,
  };
  const options = {
    weights: DEFAULT_MATCH_WEIGHTS,
    projectExperienceType: null,
    topN: 2,
    now: new Date('2026-11-02'),
  };

  it('deja fuera a quien no es pertinente, desempata por apellido e id y corta en topN', () => {
    const ranked = rankCandidates(
      profile,
      [
        person('c3', 'Zapata'),
        person('c2', 'Arias'),
        person('c1', 'Arias'),
        person('c4', 'Sin', false),
      ],
      options,
    );
    expect(ranked.map(({ collaborator }) => collaborator.id)).toEqual([
      'c1',
      'c2',
    ]);
  });
});
