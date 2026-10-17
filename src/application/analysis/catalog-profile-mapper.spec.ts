import { SkillEntity } from '../../domain/entities/skill.entity';
import type { AnalyzedProfile } from '../../domain/repositories/project-analyzer.interface';
import {
  mapProfilesToCatalog,
  profileEmbeddingText,
} from './catalog-profile-mapper';
import { SkillCatalogIndex } from './skill-catalog-index';

const catalog = [
  new SkillEntity('s-react', 'React', 'react', 'CONOCIMIENTO', 'FRAMEWORK', [
    'ReactJS',
    'React.js',
  ]),
  new SkillEntity(
    's-team',
    'Trabajo en equipo',
    'trabajo en equipo',
    'HABILIDAD_BLANDA',
    'OTRA',
  ),
];

const profile = (skills: AnalyzedProfile['skills']): AnalyzedProfile => ({
  name: 'Frontend',
  description: 'Interfaz',
  justification: 'Porque el proyecto lo necesita',
  quantity: 1,
  priority: 'ALTA',
  suggestedWeeklyHours: 8,
  skills,
});

describe('SkillCatalogIndex', () => {
  const index = new SkillCatalogIndex(catalog);

  it('resolves by canonical name ignoring case and spaces', () => {
    expect(index.resolve('  REACT ')?.id).toBe('s-react');
  });

  it('resolves by synonym', () => {
    expect(index.resolve('ReactJS')?.id).toBe('s-react');
  });

  it('returns null for unknown or empty names', () => {
    expect(index.resolve('Cobol')).toBeNull();
    expect(index.resolve('   ')).toBeNull();
  });
});

describe('mapProfilesToCatalog', () => {
  it('links catalog skills and leaves the rest uncatalogued', () => {
    const [mapped] = mapProfilesToCatalog(
      [
        profile([
          {
            name: 'ReactJS',
            type: 'CONOCIMIENTO',
            minLevel: 'AVANZADO',
            importance: 'ALTA',
          },
          {
            name: 'Cobol',
            type: 'CONOCIMIENTO',
            minLevel: 'BASICO',
            importance: 'BAJA',
          },
        ]),
      ],
      catalog,
    );

    expect(mapped.skills[0]).toMatchObject({
      skillId: 's-react',
      rawName: 'ReactJS',
    });
    expect(mapped.skills[1]).toMatchObject({ skillId: null, rawName: 'Cobol' });
    expect(mapped.embedding).toBeNull();
    expect(mapped.minWeeklyHours).toBe(8);
  });

  it('takes the type from the catalog when it disagrees with the AI', () => {
    const [mapped] = mapProfilesToCatalog(
      [
        profile([
          {
            name: 'Trabajo en equipo',
            type: 'CONOCIMIENTO',
            minLevel: 'BASICO',
            importance: 'MEDIA',
          },
        ]),
      ],
      catalog,
    );

    expect(mapped.skills[0].type).toBe('HABILIDAD_BLANDA');
  });

  it('keeps the most important entry when two names resolve to the same skill', () => {
    const [mapped] = mapProfilesToCatalog(
      [
        profile([
          {
            name: 'React',
            type: 'CONOCIMIENTO',
            minLevel: 'BASICO',
            importance: 'BAJA',
          },
          {
            name: 'React.js',
            type: 'CONOCIMIENTO',
            minLevel: 'AVANZADO',
            importance: 'ALTA',
          },
        ]),
      ],
      catalog,
    );

    expect(mapped.skills).toHaveLength(1);
    expect(mapped.skills[0]).toMatchObject({
      importance: 'ALTA',
      minLevel: 'AVANZADO',
    });
  });

  it('keeps the profile order as position', () => {
    const mapped = mapProfilesToCatalog(
      [profile([]), profile([]), profile([])],
      catalog,
    );

    expect(mapped.map((p) => p.position)).toEqual([0, 1, 2]);
  });
});

describe('profileEmbeddingText', () => {
  it('joins name, description and skill names', () => {
    const [mapped] = mapProfilesToCatalog(
      [
        profile([
          {
            name: 'React',
            type: 'CONOCIMIENTO',
            minLevel: 'BASICO',
            importance: 'ALTA',
          },
          {
            name: 'Cobol',
            type: 'CONOCIMIENTO',
            minLevel: 'BASICO',
            importance: 'BAJA',
          },
        ]),
      ],
      catalog,
    );

    expect(profileEmbeddingText(mapped)).toBe(
      'Frontend. Interfaz. React, Cobol',
    );
  });

  it('strips contact data the leader may write in a manual profile', () => {
    expect(
      profileEmbeddingText({
        name: 'Diseñador',
        description: 'Escribir a lider@ufps.edu.co o al 3001234567',
        skills: [{ rawName: 'Figma' }],
      }),
    ).toBe('Diseñador. Escribir a o al. Figma');
  });
});
