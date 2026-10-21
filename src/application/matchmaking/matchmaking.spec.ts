import { SkillEntity } from '../../domain/entities/skill.entity';
import {
  buildCollaborator,
  buildCollaboratorSkill,
  buildExperience,
} from '../../testing/test-doubles.testing';
import {
  projectExperienceType,
  toPersonSpec,
  toProfileSpec,
} from './match-input';
import { parseMatchSettings } from './match-settings';
import {
  RequiredProfileEntity,
  RequiredProfileSkillEntity,
} from '../../domain/entities/required-profile.entity';

describe('parseMatchSettings', () => {
  it('parses weights and normalizes them to add up to 1', () => {
    const { weights } = parseMatchSettings('5,2,1.5,1.5', '5');

    expect(weights.skills).toBeCloseTo(0.5, 5);
    expect(weights.semantic).toBeCloseTo(0.2, 5);
    expect(weights.experience).toBeCloseTo(0.15, 5);
    expect(weights.availability).toBeCloseTo(0.15, 5);
  });

  it('uses the defaults when the values are missing or invalid', () => {
    for (const raw of [
      undefined,
      '',
      '1,2,3',
      'a,b,c,d',
      '-1,1,1,1',
      '0,0,0,0',
    ]) {
      const { weights, topN } = parseMatchSettings(raw, 'abc');
      expect(weights).toEqual({
        skills: 0.5,
        semantic: 0.2,
        experience: 0.15,
        availability: 0.15,
      });
      expect(topN).toBe(10);
    }
  });

  it('keeps TOP_N within 1 and 50', () => {
    expect(parseMatchSettings(undefined, '3').topN).toBe(3);
    expect(parseMatchSettings(undefined, '500').topN).toBe(50);
    expect(parseMatchSettings(undefined, '0').topN).toBe(10);
  });
});

describe('projectExperienceType', () => {
  it('maps research projects to semillero experience and ignores the rest', () => {
    expect(projectExperienceType('INVESTIGACION')).toBe(
      'SEMILLERO_INVESTIGACION',
    );
    expect(projectExperienceType('CURSO')).toBeNull();
    expect(projectExperienceType(null)).toBeNull();
  });
});

describe('match input mappers', () => {
  it('builds the person spec from skills, synonyms and experiences', () => {
    const react = new SkillEntity(
      'k1',
      'React',
      'react',
      'CONOCIMIENTO',
      'FRAMEWORK',
      ['ReactJS'],
    );
    const collaborator = buildCollaborator({
      skills: [buildCollaboratorSkill({ skill: react })],
      experiences: [
        buildExperience({
          startDate: '2024-01-01',
          endDate: '2024-07-01',
          technologies: [react],
        }),
      ],
    });

    const spec = toPersonSpec(collaborator, [1, 0], new Date('2026-01-01'));

    expect(spec.skills[0]).toMatchObject({
      skillId: 'k1',
      normalizedNames: ['react', 'reactjs'],
      level: 'AVANZADO',
      months: 24,
    });
    expect(spec.experiences[0]).toMatchObject({
      label: 'Desarrolladora – UFPS',
      months: 6,
      skillIds: ['k1'],
    });
    expect(spec.embedding).toEqual([1, 0]);
  });

  it('builds the profile spec using the canonical skill name', () => {
    const profile = new RequiredProfileEntity({
      id: 'rp1',
      projectId: 'p1',
      analysisId: null,
      source: 'MANUAL',
      name: 'Frontend',
      description: '',
      justification: '',
      quantity: 1,
      priority: 'ALTA',
      minWeeklyHours: 8,
      position: 0,
      active: true,
      skills: [
        new RequiredProfileSkillEntity(
          's1',
          'rp1',
          null,
          'Árboles de decisión',
          'CONOCIMIENTO',
          'BASICO',
          'MEDIA',
          null,
        ),
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const spec = toProfileSpec(profile, null);

    expect(spec.skills[0]).toMatchObject({
      skillId: null,
      name: 'Árboles de decisión',
      normalizedName: 'arboles de decision',
    });
    expect(spec.minWeeklyHours).toBe(8);
  });
});
