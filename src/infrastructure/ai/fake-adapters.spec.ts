import { parseAnalysisOutput } from '../../application/analysis/analysis-output.validator';
import type { AnalysisInput } from '../../domain/repositories/project-analyzer.interface';
import { FakeEmbeddingProvider } from './fake-embedding-provider';
import { FakeProjectAnalyzer } from './fake-project-analyzer';
import { buildAnalysisPrompt } from './gemini-prompt';

const input: AnalysisInput = {
  project: {
    title: 'Plataforma de laboratorios',
    summary: 'Sistema web para reservar laboratorios con React',
    objectives: 'Digitalizar la reserva de laboratorios de la facultad',
    type: {
      name: 'Curso',
      fields: [{ label: 'Asignatura', value: 'Seminario III' }],
    },
    category: 'Desarrollo de software',
    program: 'Ingeniería de Sistemas',
    deliverables: [{ name: 'PMV', scope: 'Reserva básica' }],
    knownSkills: [{ name: 'React', type: 'CONOCIMIENTO' }],
  },
  catalog: [
    { name: 'React', type: 'CONOCIMIENTO', category: 'FRAMEWORK' },
    { name: 'Gestión de proyectos', type: 'COMPETENCIA', category: 'OTRA' },
    { name: 'Comunicación', type: 'HABILIDAD_BLANDA', category: 'OTRA' },
  ],
};

describe('FakeProjectAnalyzer', () => {
  const analyzer = new FakeProjectAnalyzer();

  it('produces output that passes the real validator', async () => {
    const { output } = await analyzer.analyze(input);

    const parsed = parseAnalysisOutput(output);

    expect(parsed.profiles).toHaveLength(2);
    expect(parsed.summary).toContain('2 perfiles');
    parsed.profiles.forEach((p) =>
      expect(p.skills.some((s) => s.type === 'HABILIDAD_BLANDA')).toBe(true),
    );
  });

  it('is deterministic', async () => {
    const first = await analyzer.analyze(input);
    const second = await analyzer.analyze(input);

    expect(second).toEqual(first);
  });

  it('picks catalog skills the project text mentions', async () => {
    const { output } = await analyzer.analyze(input);
    const names = parseAnalysisOutput(output).profiles[0].skills.map(
      (s) => s.name,
    );

    expect(names).toContain('React');
  });
});

describe('FakeEmbeddingProvider', () => {
  const provider = new FakeEmbeddingProvider(64);

  it('identifies its vector space so it is never compared with Gemini vectors', () => {
    expect(provider.model).toBe('fake/hash-v1@64');
  });

  it('returns unit vectors of the configured size', async () => {
    const [vector] = await provider.embed(['desarrollador react']);

    expect(vector).toHaveLength(64);
    expect(Math.hypot(...vector)).toBeCloseTo(1, 6);
  });

  it('is deterministic and puts similar texts closer than unrelated ones', async () => {
    const [a, b, c] = await provider.embed([
      'desarrollador web react node',
      'desarrollador web react angular',
      'contabilidad tributaria auditoria',
    ]);
    const dot = (x: number[], y: number[]) =>
      x.reduce((sum, value, i) => sum + value * y[i], 0);

    expect(dot(a, b)).toBeGreaterThan(dot(a, c));
    expect((await provider.embed(['desarrollador web react node']))[0]).toEqual(
      a,
    );
  });
});

describe('buildAnalysisPrompt', () => {
  it('includes project data and the catalog', () => {
    const prompt = buildAnalysisPrompt(input);

    expect(prompt).toContain('Plataforma de laboratorios');
    expect(prompt).toContain('- Asignatura: Seminario III');
    expect(prompt).toContain('PMV: Reserva básica');
    expect(prompt).toContain('React | CONOCIMIENTO | FRAMEWORK');
  });
});
