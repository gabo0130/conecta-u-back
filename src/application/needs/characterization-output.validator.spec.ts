import { InvalidAnalysisOutputError } from '../../domain/repositories/project-analyzer.interface';
import { SkillEntity } from '../../domain/entities/skill.entity';
import { SkillCatalogIndex } from '../analysis/skill-catalog-index';
import { parseCharacterization } from './characterization-output.validator';

const skill = (id: string, name: string, synonyms: string[] = []) =>
  new SkillEntity(
    id,
    name,
    name.toLowerCase(),
    'CONOCIMIENTO',
    'OTRA',
    synonyms,
  );

const context = {
  catalog: new SkillCatalogIndex([
    skill('s1', 'Python'),
    skill('s2', 'PostgreSQL', ['Postgres']),
  ]),
  projectTypeCodes: ['INVESTIGACION', 'CURSO'],
};

describe('parseCharacterization (T2)', () => {
  it('empareja competencias con el catálogo (también por sinónimo) y separa las que no están', () => {
    const result = parseCharacterization(
      {
        problema: '  Los estudiantes no pueden reservar citas.  ',
        objetivo: 'Ofrecer reservas en línea',
        beneficiarios: 'Estudiantes',
        resultadosEsperados: ['Prototipo', 'prototipo', '', 7],
        competencias: ['python', 'Postgres', 'PostgreSQL', 'Blockchain'],
        tipoProyectoSugerido: 'curso',
        informacionFaltante: ['Plazo esperado'],
      },
      context,
    );
    expect(result).toEqual({
      problem: 'Los estudiantes no pueden reservar citas.',
      objective: 'Ofrecer reservas en línea',
      beneficiaries: 'Estudiantes',
      expectedResults: ['Prototipo'],
      competencies: [
        { skillId: 's1', name: 'Python' },
        { skillId: 's2', name: 'PostgreSQL' },
      ],
      unmatchedCompetencies: ['Blockchain'],
      suggestedProjectTypeCode: 'CURSO',
      missingInformation: ['Plazo esperado'],
    });
  });

  it('tolera campos ausentes y un tipo de proyecto que no existe', () => {
    const result = parseCharacterization(
      { problema: 'Problema', tipoProyectoSugerido: 'OTRO' },
      context,
    );
    expect(result).toMatchObject({
      objective: '',
      beneficiaries: '',
      expectedResults: [],
      competencies: [],
      suggestedProjectTypeCode: null,
    });
  });

  it('recorta listas y textos largos', () => {
    const result = parseCharacterization(
      {
        problema: 'x'.repeat(1500),
        resultadosEsperados: Array.from({ length: 20 }, (_, i) => `R${i}`),
      },
      context,
    );
    expect(result.problem).toHaveLength(1000);
    expect(result.expectedResults).toHaveLength(10);
  });

  it.each([[null], [[]], ['texto'], [{ objetivo: 'sin problema' }]])(
    'rechaza una salida sin sentido: %j',
    (raw) => {
      expect(() => parseCharacterization(raw, context)).toThrow(
        InvalidAnalysisOutputError,
      );
    },
  );
});
