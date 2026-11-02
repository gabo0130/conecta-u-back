import { normalizeSkillName } from '../../../shared/utils/normalize-skill-name';
import { UFPS_CAREER_SKILLS } from './ufps-career-skills';

describe('UFPS_CAREER_SKILLS (v2.2, E6)', () => {
  it('adds about 60 skills covering the three types', () => {
    expect(UFPS_CAREER_SKILLS.length).toBeGreaterThanOrEqual(60);
    const types = new Set(UFPS_CAREER_SKILLS.map((skill) => skill.type));
    expect([...types].sort()).toEqual([
      'COMPETENCIA',
      'CONOCIMIENTO',
      'HABILIDAD_BLANDA',
    ]);
  });

  it('never repeats a name or a synonym once normalized (the seed matches by it)', () => {
    const owner = new Map<string, string>();
    for (const skill of UFPS_CAREER_SKILLS) {
      for (const term of [skill.name, ...(skill.synonyms ?? [])]) {
        const key = normalizeSkillName(term);
        expect([key, owner.get(key) ?? skill.name]).toEqual([key, skill.name]);
        owner.set(key, skill.name);
      }
    }
  });
});
