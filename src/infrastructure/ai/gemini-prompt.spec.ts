import {
  ANALYSIS_PROMPT_VERSION,
  ANALYSIS_SYSTEM_INSTRUCTION,
  buildAnalysisPrompt,
} from './gemini-prompt';
import type { AnalysisInput } from '../../domain/repositories/project-analyzer.interface';

describe('gemini-prompt', () => {
  it('is v2: the version changes whenever the text changes (RNF8)', () => {
    expect(ANALYSIS_PROMPT_VERSION).toBe('v2');
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
