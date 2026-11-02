import type { CharacterizationInput } from '../../domain/repositories/need-characterizer.interface';

const generateContent = jest.fn();

// Se reemplaza solo el cliente; ApiError y los enums siguen siendo los reales.
jest.mock('@google/genai', () => ({
  ...jest.requireActual<object>('@google/genai'),
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent },
  })),
}));

import { ApiError } from '@google/genai';
import { AnalyzerUnavailableError } from '../../domain/repositories/project-analyzer.interface';
import { FakeNeedCharacterizer } from './fake-need-characterizer';
import { GeminiNeedCharacterizer } from './gemini-need-characterizer';
import {
  buildCharacterizationPrompt,
  CHARACTERIZATION_PROMPT_VERSION,
} from './need-characterization-prompt';
import { QuotaCircuitBreaker } from './quota-circuit-breaker';

const input: CharacterizationInput = {
  need: {
    title: 'Plataforma de citas',
    description:
      'Bienestar necesita una plataforma web para que los estudiantes reserven citas. Debe usar Python.',
    kind: 'ADMINISTRATIVA',
    dependency: null,
    hasDeadline: false,
  },
  catalog: [
    { name: 'Python', type: 'CONOCIMIENTO' },
    { name: 'C', type: 'CONOCIMIENTO' },
    { name: 'Comunicación', type: 'HABILIDAD_BLANDA' },
  ],
  projectTypes: [
    { code: 'INTERDISCIPLINARIO', name: 'Interdisciplinario' },
    { code: 'CURSO', name: 'Curso' },
  ],
};
const budget = { timeoutMs: 30_000 };

describe('FakeNeedCharacterizer', () => {
  it('empareja nombres completos del catálogo y declara lo que falta', async () => {
    const { output } = await new FakeNeedCharacterizer().characterize(input);
    expect(output).toEqual({
      problema:
        'Bienestar necesita una plataforma web para que los estudiantes reserven citas.',
      objetivo: 'Dar respuesta a la necesidad: Plataforma de citas.',
      beneficiarios: 'Estudiantes',
      resultadosEsperados: ['Prototipo funcional'],
      // "C" no se empareja dentro de otras palabras.
      competencias: ['Python'],
      tipoProyectoSugerido: 'INTERDISCIPLINARIO',
      informacionFaltante: [
        'Plazo esperado',
        'Dependencia que plantea la necesidad',
      ],
    });
  });

  it('no sugiere un tipo de proyecto que no está en el catálogo', async () => {
    const { output } = await new FakeNeedCharacterizer().characterize({
      ...input,
      need: { ...input.need, kind: 'INVESTIGATIVA' },
    });
    expect(output).toMatchObject({ tipoProyectoSugerido: null });
  });
});

describe('GeminiNeedCharacterizer', () => {
  beforeEach(() => generateContent.mockReset());

  it('pide JSON estructurado con el prompt de caracterización', async () => {
    generateContent.mockResolvedValue({
      text: '{"problema":"x"}',
      usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
    });
    const characterizer = new GeminiNeedCharacterizer({
      apiKey: 'test',
      model: 'gemini-3.8-flash',
    });

    const result = await characterizer.characterize(input, budget);

    expect(result).toEqual({
      output: { problema: 'x' },
      usage: { inputTokens: 10, outputTokens: 5 },
    });
    const { model, contents, config } = generateContent.mock.calls[0][0];
    expect(model).toBe('gemini-3.8-flash');
    expect(contents).toBe(buildCharacterizationPrompt(input));
    expect(config).toMatchObject({ responseMimeType: 'application/json' });
    expect(characterizer.promptVersion).toBe(CHARACTERIZATION_PROMPT_VERSION);
  });

  it('comparte el cortacircuitos: con la cuota diaria agotada no está disponible', async () => {
    const breaker = new QuotaCircuitBreaker();
    const characterizer = new GeminiNeedCharacterizer({
      apiKey: 'test',
      model: 'gemini-3.8-flash',
      quotaBreaker: breaker,
    });
    generateContent.mockRejectedValue(
      new ApiError({
        status: 429,
        message: 'quotaId: GenerateRequestsPerDayPerProjectPerModel',
      }),
    );

    await expect(characterizer.characterize(input, budget)).rejects.toThrow(
      AnalyzerUnavailableError,
    );
    expect(breaker.isOpen('gemini-3.8-flash')).toBe(true);
    expect(characterizer.isAvailable()).toBe(false);
  });
});

describe('buildCharacterizationPrompt', () => {
  it('incluye la necesidad, los tipos de proyecto y el catálogo', () => {
    const prompt = buildCharacterizationPrompt(input);
    expect(prompt).toContain('Título: Plataforma de citas');
    expect(prompt).toContain('Dependencia que la plantea: (no indicada)');
    expect(prompt).toContain('Plazo esperado: (no indicado)');
    expect(prompt).toContain('CURSO | Curso');
    expect(prompt).toContain('Python | CONOCIMIENTO');
  });
});
