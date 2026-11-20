import {
  ANALYSIS_PROMPT_VERSION,
  ANALYSIS_RESPONSE_SCHEMA,
  ANALYSIS_SYSTEM_INSTRUCTION,
  buildAnalysisPrompt,
} from './gemini-prompt';
import type { AnalysisInput } from '../../domain/repositories/project-analyzer.interface';

describe('gemini-prompt', () => {
  it('is v3: the version changes whenever the text changes (RNF8)', () => {
    expect(ANALYSIS_PROMPT_VERSION).toBe('v3');
  });

  it('defines the levels, the importance and what to do with little information (IA-08)', () => {
    expect(ANALYSIS_SYSTEM_INSTRUCTION).toContain(
      'INTERMEDIO: autónomo en tareas habituales',
    );
    expect(ANALYSIS_SYSTEM_INSTRUCTION).toContain(
      'importancia: ALTA si sin ella no se cumple un objetivo o entregable',
    );
    expect(ANALYSIS_SYSTEM_INSTRUCTION).toContain(
      'Si al proyecto le falta información, dilo en el resumen',
    );
    // Estas dos reglas recortaban perfiles necesarios (comparación real del 19/11).
    expect(ANALYSIS_SYSTEM_INSTRUCTION).not.toContain('menos perfiles');
    expect(ANALYSIS_SYSTEM_INSTRUCTION).not.toContain('máximo 2 frases');
  });

  it('keeps array limits out of the schema: Gemini rejects them as too complex (IA-04)', () => {
    const perfiles = ANALYSIS_RESPONSE_SCHEMA.properties?.perfiles;
    expect(perfiles).not.toHaveProperty('maxItems');
    expect(perfiles?.items?.properties?.habilidades).not.toHaveProperty(
      'maxItems',
    );
  });

  it('describes the three types with the v2.2 classification (E6)', () => {
    expect(ANALYSIS_SYSTEM_INSTRUCTION).toContain(
      'CONOCIMIENTO: conocimiento técnico: herramientas y tecnologías',
    );
    expect(ANALYSIS_SYSTEM_INSTRUCTION).toContain(
      'COMPETENCIA: competencia técnica: el rol o la disciplina que se ejerce (p. ej. investigador, desarrollador, analista)',
    );
    expect(ANALYSIS_SYSTEM_INSTRUCTION).toContain(
      'HABILIDAD_BLANDA: competencia blanda',
    );
    expect(ANALYSIS_SYSTEM_INSTRUCTION).toContain(
      'al menos una competencia blanda (HABILIDAD_BLANDA)',
    );
  });

  it('labels the skills the leader chose as the ones the project requires', () => {
    const input = {
      project: {
        title: 'Monitoreo del agua',
        summary: 'Resumen',
        objectives: 'Objetivos',
        type: { name: 'Investigación', fields: [] },
        category: 'Ambiental',
        program: null,
        deliverables: [],
        knownSkills: [{ name: 'Python', type: 'CONOCIMIENTO' }],
      },
      catalog: [],
    } as unknown as AnalysisInput;

    expect(buildAnalysisPrompt(input)).toContain(
      '## Competencias técnicas y blandas requeridas por el proyecto (según el líder)\n- Python (CONOCIMIENTO)',
    );
  });
});

describe('buildAnalysisPrompt v3', () => {
  const catalog = [
    { name: 'Python', type: 'CONOCIMIENTO', category: 'LENGUAJE' },
    { name: 'AutoCAD', type: 'CONOCIMIENTO', category: 'HERRAMIENTA' },
    { name: 'Investigación', type: 'COMPETENCIA', category: 'METODOLOGIA' },
    { name: 'Liderazgo', type: 'HABILIDAD_BLANDA', category: 'LIDERAZGO' },
  ];
  const promptWith = (durationMonths: number | null) =>
    buildAnalysisPrompt({
      project: {
        title: 'Monitoreo del agua',
        summary: 'Resumen',
        objectives: 'Objetivos',
        type: { name: 'Curso', fields: [] },
        category: 'Ambiental',
        program: null,
        durationMonths,
        deliverables: [],
        knownSkills: [],
      },
      catalog,
    } as unknown as AnalysisInput);

  it('groups the catalog by type, every name once and without the category (IA-05)', () => {
    const prompt = promptWith(null);

    expect(prompt).toContain('CONOCIMIENTO: Python, AutoCAD');
    expect(prompt).toContain('COMPETENCIA: Investigación');
    expect(prompt).toContain('HABILIDAD_BLANDA: Liderazgo');
    expect(prompt).not.toMatch(/LENGUAJE|HERRAMIENTA|METODOLOGIA/);
    for (const { name } of catalog) {
      expect(prompt.split(name)).toHaveLength(2);
    }
  });

  it('includes the duration of the project when it has one (IA-17)', () => {
    expect(promptWith(12)).toContain('Duración: 12 meses');
    expect(promptWith(null)).not.toContain('Duración');
  });
});
