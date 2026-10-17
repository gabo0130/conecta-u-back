import { InvalidAnalysisOutputError } from '../../domain/repositories/project-analyzer.interface';
import { parseAnalysisOutput } from './analysis-output.validator';

const skill = (overrides: Record<string, unknown> = {}) => ({
  nombre: 'React',
  tipo: 'CONOCIMIENTO',
  nivelMinimo: 'INTERMEDIO',
  importancia: 'ALTA',
  ...overrides,
});

const profile = (overrides: Record<string, unknown> = {}) => ({
  nombre: 'Desarrollador frontend',
  descripcion: 'Construye la interfaz',
  justificacion: 'El entregable principal es una aplicación web.',
  cantidad: 2,
  prioridad: 'ALTA',
  horasSemanaSugeridas: 10,
  habilidades: [
    skill(),
    skill({ nombre: 'Trabajo en equipo', tipo: 'HABILIDAD_BLANDA' }),
  ],
  ...overrides,
});

const output = (perfiles: unknown[] = [profile()]) => ({
  resumen: 'Se necesita un equipo web.',
  perfiles,
});

describe('parseAnalysisOutput', () => {
  it('parses a valid output into profiles', () => {
    const result = parseAnalysisOutput(output());

    expect(result.summary).toBe('Se necesita un equipo web.');
    expect(result.profiles).toHaveLength(1);
    expect(result.profiles[0]).toMatchObject({
      name: 'Desarrollador frontend',
      quantity: 2,
      priority: 'ALTA',
      suggestedWeeklyHours: 10,
    });
    expect(result.profiles[0].skills[1].type).toBe('HABILIDAD_BLANDA');
  });

  it('tolerates case, accents and spaces in enum values', () => {
    const result = parseAnalysisOutput(
      output([
        profile({
          prioridad: 'alta',
          habilidades: [
            skill({ nivelMinimo: 'Básico ', tipo: 'Habilidad blanda' }),
            skill({ importancia: 'media' }),
          ],
        }),
      ]),
    );

    expect(result.profiles[0].priority).toBe('ALTA');
    expect(result.profiles[0].skills[0]).toMatchObject({
      minLevel: 'BASICO',
      type: 'HABILIDAD_BLANDA',
    });
    expect(result.profiles[0].skills[1].importance).toBe('MEDIA');
  });

  it('clamps quantity and drops absurd weekly hours', () => {
    const result = parseAnalysisOutput(
      output([profile({ cantidad: 99, horasSemanaSugeridas: 500 })]),
    );

    expect(result.profiles[0].quantity).toBe(10);
    expect(result.profiles[0].suggestedWeeklyHours).toBeNull();
  });

  it('defaults a missing quantity to 1', () => {
    const result = parseAnalysisOutput(
      output([profile({ cantidad: undefined })]),
    );

    expect(result.profiles[0].quantity).toBe(1);
  });

  it.each([
    ['not an object', 'texto'],
    ['an array', []],
    ['null', null],
  ])('rejects %s', (_label, raw) => {
    expect(() => parseAnalysisOutput(raw)).toThrow(InvalidAnalysisOutputError);
  });

  it('rejects an output without profiles', () => {
    expect(() => parseAnalysisOutput(output([]))).toThrow(
      InvalidAnalysisOutputError,
    );
  });

  it('rejects more profiles than allowed', () => {
    const many = Array.from({ length: 6 }, () => profile());

    expect(() => parseAnalysisOutput(output(many))).toThrow(/entre 1 y 5/);
  });

  it('rejects a profile with too few skills', () => {
    expect(() =>
      parseAnalysisOutput(output([profile({ habilidades: [skill()] })])),
    ).toThrow(/habilidades/);
  });

  it('reports every problem found, not only the first', () => {
    const broken = output([
      profile({
        prioridad: 'URGENTE',
        habilidades: [skill({ tipo: 'MAGIA' }), skill({ nivelMinimo: 'GURU' })],
      }),
    ]);

    let message = '';
    try {
      parseAnalysisOutput(broken);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain('prioridad');
    expect(message).toContain('tipo');
    expect(message).toContain('nivelMinimo');
  });
});
