import { Logger } from '@nestjs/common';
import { ApiError, GoogleGenAI } from '@google/genai';
import {
  AnalyzerUnavailableError,
  InvalidAnalysisOutputError,
  type AnalysisInput,
} from '../../domain/repositories/project-analyzer.interface';

const generateContent = jest.fn();
const embedContent = jest.fn();

// Se reemplaza solo el cliente; ApiError y los enums siguen siendo los reales.
jest.mock('@google/genai', () => ({
  ...jest.requireActual<object>('@google/genai'),
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: { generateContent, embedContent },
  })),
}));

import { GeminiEmbeddingProvider } from './gemini-embedding-provider';
import { GeminiProjectAnalyzer } from './gemini-project-analyzer';
import { QuotaCircuitBreaker } from './quota-circuit-breaker';

const input: AnalysisInput = {
  project: {
    title: 'Proyecto',
    summary: 'Resumen',
    objectives: 'Objetivos',
    type: { name: 'Curso', fields: [] },
    category: 'Desarrollo',
    program: null,
    deliverables: [],
    knownSkills: [],
  },
  catalog: [],
};

describe('GeminiProjectAnalyzer', () => {
  const analyzer = new GeminiProjectAnalyzer({
    apiKey: 'test',
    model: 'gemini-3.8-flash',
  });
  // El presupuesto ya no es del adaptador: lo reparte el caso de uso en cada llamada.
  const budget = { timeoutMs: 55_000 };

  beforeEach(() => jest.resetAllMocks());

  it('parses the JSON and reports tokens, counting thinking tokens as output', async () => {
    generateContent.mockResolvedValue({
      text: '{"resumen":"x","perfiles":[]}',
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 40,
        thoughtsTokenCount: 10,
      },
    });

    const result = await analyzer.analyze(input, budget);

    expect(result.output).toEqual({ resumen: 'x', perfiles: [] });
    expect(result.usage).toEqual({ inputTokens: 100, outputTokens: 50 });
  });

  it('accepts JSON wrapped in a markdown fence', async () => {
    generateContent.mockResolvedValue({
      text: '```json\n{"resumen":"x"}\n```',
    });

    await expect(analyzer.analyze(input, budget)).resolves.toMatchObject({
      output: { resumen: 'x' },
      usage: { inputTokens: null, outputTokens: null },
    });
  });

  it('sends the structured-output configuration', async () => {
    generateContent.mockResolvedValue({ text: '{}' });

    await analyzer.analyze(input, budget);

    const { model, config } = generateContent.mock.calls[0][0];
    expect(model).toBe('gemini-3.8-flash');
    expect(config.responseMimeType).toBe('application/json');
    expect(config.responseSchema).toBeDefined();
    expect(config.abortSignal).toBeInstanceOf(AbortSignal);
  });

  it('throws InvalidAnalysisOutputError for text that is not JSON', async () => {
    generateContent.mockResolvedValue({ text: 'lo siento, no puedo' });

    await expect(analyzer.analyze(input, budget)).rejects.toBeInstanceOf(
      InvalidAnalysisOutputError,
    );
  });

  it('throws InvalidAnalysisOutputError for an empty answer', async () => {
    generateContent.mockResolvedValue({ text: '' });

    await expect(analyzer.analyze(input, budget)).rejects.toBeInstanceOf(
      InvalidAnalysisOutputError,
    );
  });

  it('treats a blocked request as the service being unavailable', async () => {
    generateContent.mockResolvedValue({
      text: '',
      promptFeedback: { blockReason: 'SAFETY' },
    });

    await expect(analyzer.analyze(input, budget)).rejects.toBeInstanceOf(
      AnalyzerUnavailableError,
    );
  });

  it('maps a permanent API error to AnalyzerUnavailableError', async () => {
    generateContent.mockRejectedValue(
      new ApiError({ message: 'modelo no disponible', status: 404 }),
    );

    await expect(analyzer.analyze(input, budget)).rejects.toBeInstanceOf(
      AnalyzerUnavailableError,
    );
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it('maps a timeout to AnalyzerUnavailableError', async () => {
    const timeout = new Error('timeout');
    timeout.name = 'TimeoutError';
    generateContent.mockRejectedValue(timeout);

    await expect(analyzer.analyze(input, budget)).rejects.toThrow(
      /tiempo límite/,
    );
  });

  it('does not report a model when the main one answers', async () => {
    generateContent.mockResolvedValue({ text: '{}' });

    const result = await analyzer.analyze(input, budget);

    expect(result.model).toBeUndefined();
  });
});

describe('GeminiProjectAnalyzer fallback model', () => {
  const overloaded = () =>
    new ApiError({ message: 'alta demanda', status: 503 });
  // Se construyen aquí: `resetAllMocks` borra la implementación del cliente simulado.
  const analyzerWith = (options: { fallbackModel?: string }) =>
    new GeminiProjectAnalyzer({
      apiKey: 'test',
      model: 'gemini-3.8-flash',
      ...options,
    });
  const withFallback = analyzerWith({ fallbackModel: 'gemini-3.5-flash-lite' });
  const withoutFallback = analyzerWith({});
  const fullBudget = { timeoutMs: 55_000 };
  const littleTime = { timeoutMs: 12_000 };
  const modelsCalled = () =>
    generateContent.mock.calls.map(
      ([request]: [{ model: string }]) => request.model,
    );

  // Los reintentos esperan 1,5 s y 4 s: se adelanta el reloj en vez de esperarlos.
  const settle = async <T>(promise: Promise<T>) => {
    const outcome = promise.then(
      (value) => ({ value }),
      (error: unknown) => ({ error }),
    );
    await jest.runAllTimersAsync();
    return outcome;
  };

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => jest.useRealTimers());

  it('switches to the fallback model once the main one exhausts its retries', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    generateContent
      .mockRejectedValueOnce(overloaded())
      .mockRejectedValueOnce(overloaded())
      .mockRejectedValueOnce(overloaded())
      .mockResolvedValueOnce({ text: '{"resumen":"x"}' });

    const outcome = await settle(withFallback.analyze(input, fullBudget));

    expect(outcome).toMatchObject({
      value: { output: { resumen: 'x' }, model: 'gemini-3.5-flash-lite' },
    });
    expect(modelsCalled()).toEqual([
      'gemini-3.8-flash',
      'gemini-3.8-flash',
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
    ]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('modelo de respaldo gemini-3.5-flash-lite'),
    );
    warn.mockRestore();
  });

  it('goes straight to the fallback on a 429 without retrying the main model', async () => {
    generateContent
      .mockRejectedValueOnce(
        new ApiError({ message: 'PerMinute quota', status: 429 }),
      )
      .mockResolvedValueOnce({ text: '{"resumen":"x"}' });

    const outcome = await settle(withFallback.analyze(input, fullBudget));

    expect(outcome).toMatchObject({
      value: { model: 'gemini-3.5-flash-lite' },
    });
    expect(modelsCalled()).toEqual([
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
    ]);
  });

  it('does not use the fallback for a permanent error', async () => {
    generateContent.mockRejectedValue(
      new ApiError({ message: 'llave inválida', status: 403 }),
    );

    const outcome = await settle(withFallback.analyze(input, fullBudget));

    expect(outcome).toMatchObject({
      error: expect.any(AnalyzerUnavailableError),
    });
    expect(modelsCalled()).toEqual(['gemini-3.8-flash']);
  });

  it('fails as unavailable when no fallback is configured', async () => {
    generateContent.mockRejectedValue(overloaded());

    const outcome = await settle(withoutFallback.analyze(input, fullBudget));

    expect(outcome).toMatchObject({
      error: expect.any(AnalyzerUnavailableError),
    });
    expect(modelsCalled()).not.toContain('gemini-3.5-flash-lite');
  });

  it('skips the fallback when too little time is left', async () => {
    // 12 s: los 3 intentos del principal consumen 5,5 s de espera y dejan menos de 8 s.
    generateContent.mockRejectedValue(overloaded());

    const outcome = await settle(withFallback.analyze(input, littleTime));

    expect(outcome).toMatchObject({
      error: expect.any(AnalyzerUnavailableError),
    });
    expect(modelsCalled()).toEqual([
      'gemini-3.8-flash',
      'gemini-3.8-flash',
      'gemini-3.8-flash',
    ]);
  });

  it('reports the fallback failure when both models are overloaded', async () => {
    generateContent.mockRejectedValue(overloaded());

    const outcome = await settle(withFallback.analyze(input, fullBudget));

    const { error } = outcome as { error: Error };
    expect(error).toBeInstanceOf(AnalyzerUnavailableError);
    expect(error.message).toMatch(/503/);
    expect(modelsCalled()).toContain('gemini-3.5-flash-lite');
  });
});

describe('GeminiProjectAnalyzer daily quota', () => {
  const dailyQuota = () =>
    new ApiError({
      message:
        'got status: 429. {"quotaId":"GenerateRequestsPerDayPerProjectPerModel"}',
      status: 429,
    });
  const budget = { timeoutMs: 55_000 };
  const modelsCalled = () =>
    generateContent.mock.calls.map(
      ([request]: [{ model: string }]) => request.model,
    );
  // Cada prueba con su propio cortacircuitos: el estado no debe pasar de una a otra.
  const freshAnalyzer = (fallbackModel?: string) =>
    new GeminiProjectAnalyzer({
      apiKey: 'test',
      model: 'gemini-3.8-flash',
      fallbackModel,
      quotaBreaker: new QuotaCircuitBreaker(),
    });

  // Estos analizadores se crean en cada prueba: el cliente simulado se repone tras los reset.
  beforeEach(() => {
    jest.resetAllMocks();
    jest
      .mocked(GoogleGenAI)
      .mockImplementation(
        () => ({ models: { generateContent, embedContent } }) as never,
      );
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });
  afterEach(() => jest.restoreAllMocks());

  it('stops calling a model once it exhausts its daily quota and uses the fallback', async () => {
    const analyzer = freshAnalyzer('gemini-3.5-flash-lite');
    generateContent
      .mockRejectedValueOnce(dailyQuota())
      .mockResolvedValue({ text: '{"resumen":"x"}' });

    await analyzer.analyze(input, budget);
    await analyzer.analyze(input, budget);

    expect(modelsCalled()).toEqual([
      'gemini-3.8-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash-lite',
    ]);
    expect(analyzer.isAvailable()).toBe(true);
  });

  it('reports itself unavailable and makes no call once every model is out of quota', async () => {
    const analyzer = freshAnalyzer('gemini-3.5-flash-lite');
    generateContent.mockRejectedValue(dailyQuota());

    await expect(analyzer.analyze(input, budget)).rejects.toBeInstanceOf(
      AnalyzerUnavailableError,
    );
    expect(analyzer.isAvailable()).toBe(false);

    generateContent.mockClear();
    await expect(analyzer.analyze(input, budget)).rejects.toThrow(
      /cuota diaria/,
    );
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('keeps a model available after a per-minute 429', async () => {
    const analyzer = freshAnalyzer();
    generateContent.mockRejectedValue(
      new ApiError({ message: 'PerMinute quota', status: 429 }),
    );

    await expect(analyzer.analyze(input, budget)).rejects.toBeInstanceOf(
      AnalyzerUnavailableError,
    );
    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(analyzer.isAvailable()).toBe(true);
  });
});

describe('GeminiEmbeddingProvider', () => {
  const provider = new GeminiEmbeddingProvider({
    apiKey: 'test',
    model: 'gemini-embedding-001',
    dimensions: 3,
    timeoutMs: 55_000,
  });

  beforeEach(() => jest.resetAllMocks());

  it('identifies its vector space by provider, model and dimensions', () => {
    expect(provider.model).toBe('gemini/gemini-embedding-001@3');
  });

  it('gives every call the provider timeout, or a shorter one when asked', async () => {
    const timeout = jest.spyOn(AbortSignal, 'timeout');
    embedContent.mockResolvedValue({ embeddings: [{ values: [1, 0, 0] }] });

    await provider.embed(['texto']);
    await provider.embed(['texto'], { timeoutMs: 2_000 });

    const [first, second] = timeout.mock.calls.map(([ms]) => ms);
    expect(first).toBeGreaterThan(50_000);
    expect(first).toBeLessThanOrEqual(55_000);
    expect(second).toBeLessThanOrEqual(2_000);
    timeout.mockRestore();
  });

  it('normalizes the vectors to unit length', async () => {
    embedContent.mockResolvedValue({ embeddings: [{ values: [3, 0, 4] }] });

    const [vector] = await provider.embed(['texto']);

    expect(vector).toEqual([0.6, 0, 0.8]);
  });

  it('asks for the configured dimensions', async () => {
    embedContent.mockResolvedValue({ embeddings: [{ values: [1, 0, 0] }] });

    await provider.embed(['texto']);

    expect(embedContent.mock.calls[0][0].config.outputDimensionality).toBe(3);
  });

  it('sends the texts in batches of 50', async () => {
    embedContent.mockImplementation(({ contents }: { contents: string[] }) =>
      Promise.resolve({
        embeddings: contents.map(() => ({ values: [1, 0, 0] })),
      }),
    );

    const vectors = await provider.embed(
      Array.from({ length: 120 }, (_, i) => `t${i}`),
    );

    expect(vectors).toHaveLength(120);
    expect(embedContent).toHaveBeenCalledTimes(3);
  });

  it('rejects an answer with a different number of embeddings', async () => {
    embedContent.mockResolvedValue({ embeddings: [] });

    await expect(provider.embed(['texto'])).rejects.toThrow(/0 embeddings/);
  });

  it('rejects a vector with the wrong dimension', async () => {
    embedContent.mockResolvedValue({ embeddings: [{ values: [1, 0] }] });

    await expect(provider.embed(['texto'])).rejects.toThrow(/dimensiones/);
  });

  it('keeps a zero vector as is instead of dividing by zero', async () => {
    embedContent.mockResolvedValue({ embeddings: [{ values: [0, 0, 0] }] });

    await expect(provider.embed(['texto'])).resolves.toEqual([[0, 0, 0]]);
  });
});
