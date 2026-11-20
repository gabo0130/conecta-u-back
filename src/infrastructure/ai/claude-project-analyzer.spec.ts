import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisAttempt } from '../../domain/entities/analysis-attempt.type';
import {
  AnalyzerUnavailableError,
  InvalidAnalysisOutputError,
  type AnalysisInput,
} from '../../domain/repositories/project-analyzer.interface';
import { ANALYSIS_JSON_SCHEMA } from './analysis-json-schema';
import { ClaudeProjectAnalyzer } from './claude-project-analyzer';
import { ANALYSIS_PROMPT_VERSION } from './gemini-prompt';
import { QuotaCircuitBreaker } from './quota-circuit-breaker';

const input: AnalysisInput = {
  project: {
    title: 'Proyecto',
    summary: 'Resumen',
    objectives: 'Objetivos',
    type: { name: 'Curso', fields: [] },
    category: 'Desarrollo',
    program: null,
    durationMonths: null,
    deliverables: [],
    knownSkills: [],
  },
  catalog: [],
};
const budget = { timeoutMs: 25_000 };

const message = (overrides: Partial<Anthropic.Message> = {}) =>
  ({
    stop_reason: 'end_turn',
    stop_details: null,
    content: [{ type: 'text', text: '{"resumen":"x","perfiles":[]}' }],
    usage: { input_tokens: 1800, output_tokens: 600 },
    ...overrides,
  }) as unknown as Anthropic.Message;

describe('ClaudeProjectAnalyzer', () => {
  const create = jest.fn();
  const analyzer = new ClaudeProjectAnalyzer({
    apiKey: 'test',
    client: { messages: { create } } as unknown as Pick<Anthropic, 'messages'>,
  });

  beforeEach(() => create.mockReset());

  it('uses Haiku by default, the shared prompt version and structured output without thinking', async () => {
    create.mockResolvedValue(message());

    const result = await analyzer.analyze(input, budget);

    expect(analyzer).toMatchObject({
      provider: 'claude',
      model: 'claude-haiku-5-5',
      promptVersion: ANALYSIS_PROMPT_VERSION,
    });
    const [params, options] = create.mock.calls[0] as [
      Anthropic.MessageCreateParamsNonStreaming,
      { signal: AbortSignal },
    ];
    expect(params).toMatchObject({
      model: 'claude-haiku-5-5',
      thinking: { type: 'disabled' },
      output_config: {
        format: { type: 'json_schema', schema: ANALYSIS_JSON_SCHEMA },
      },
    });
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(result).toEqual({
      output: { resumen: 'x', perfiles: [] },
      usage: { inputTokens: 1800, outputTokens: 600 },
    });
  });

  it('treats a refusal as unavailable so the fallback can answer', async () => {
    create.mockResolvedValue(
      message({
        stop_reason: 'refusal',
        stop_details: {
          type: 'refusal',
          category: null,
          explanation: null,
        } as unknown as Anthropic.Message['stop_details'],
      }),
    );

    await expect(analyzer.analyze(input, budget)).rejects.toBeInstanceOf(
      AnalyzerUnavailableError,
    );
  });

  it('treats a cut or unreadable answer as invalid output (the use case retries it)', async () => {
    create.mockResolvedValueOnce(message({ stop_reason: 'max_tokens' }));
    await expect(analyzer.analyze(input, budget)).rejects.toBeInstanceOf(
      InvalidAnalysisOutputError,
    );

    create.mockResolvedValueOnce(
      message({
        content: [
          { type: 'text', text: 'no es JSON' },
        ] as unknown as Anthropic.Message['content'],
      }),
    );
    await expect(analyzer.analyze(input, budget)).rejects.toBeInstanceOf(
      InvalidAnalysisOutputError,
    );
  });

  it('maps any service failure to unavailable', async () => {
    create.mockRejectedValue(new Error('Overloaded'));

    const error = await analyzer
      .analyze(input, budget)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(AnalyzerUnavailableError);
    expect((error as Error).message).toBe('Overloaded');
  });

  it('cuts the request at its time budget and says so', async () => {
    jest.useFakeTimers();
    create.mockImplementation(
      (_params: unknown, { signal }: { signal: AbortSignal }) =>
        new Promise((_, reject) =>
          signal.addEventListener('abort', () =>
            reject(new Error('Request was aborted.')),
          ),
        ),
    );

    const outcome = analyzer.analyze(input, budget).catch((e: unknown) => e);
    await jest.advanceTimersByTimeAsync(25_000);

    const error = (await outcome) as Error;
    expect(error).toBeInstanceOf(AnalyzerUnavailableError);
    expect(error.message).toBe(
      'Claude no respondió dentro del tiempo límite (sin respuesta en 25 s)',
    );
    jest.useRealTimers();
  });
});

describe('ClaudeProjectAnalyzer limits and attempts (RT7)', () => {
  const create = jest.fn();
  const apiError = (
    status: number,
    type: Anthropic.ErrorType,
    headers: Record<string, string> = {},
  ) =>
    new Anthropic.APIError(
      status,
      { type: 'error', error: { type, message: type } },
      type,
      new Headers(headers),
      type,
    );
  const analyzerWith = (now: () => number = Date.now) =>
    new ClaudeProjectAnalyzer({
      apiKey: 'test',
      client: { messages: { create } } as unknown as Pick<
        Anthropic,
        'messages'
      >,
      quotaBreaker: new QuotaCircuitBreaker(30 * 60_000, now),
    });

  beforeEach(() => create.mockReset());

  it('does not retry a 429: one call, then unavailable so the fallback answers', async () => {
    create.mockRejectedValue(apiError(429, 'rate_limit_error'));
    const analyzer = analyzerWith();

    await expect(analyzer.analyze(input, budget)).rejects.toBeInstanceOf(
      AnalyzerUnavailableError,
    );
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('stops calling the model for the retry-after time after a 429', async () => {
    let now = 0;
    create.mockRejectedValue(
      apiError(429, 'rate_limit_error', { 'retry-after': '30' }),
    );
    const analyzer = analyzerWith(() => now);

    await analyzer.analyze(input, budget).catch(() => undefined);

    expect(analyzer.isAvailable()).toBe(false);
    now = 30_000;
    expect(analyzer.isAvailable()).toBe(true);
  });

  it('stays off for half an hour when the account is out of credit', async () => {
    let now = 0;
    create.mockRejectedValue(apiError(400, 'billing_error'));
    const analyzer = analyzerWith(() => now);

    await analyzer.analyze(input, budget).catch(() => undefined);

    now = 29 * 60_000;
    expect(analyzer.isAvailable()).toBe(false);
  });

  it('retries an overload (529) once and then answers', async () => {
    jest.useFakeTimers();
    create
      .mockRejectedValueOnce(apiError(529, 'overloaded_error'))
      .mockResolvedValueOnce(message());

    const outcome = analyzerWith().analyze(input, budget);
    await jest.advanceTimersByTimeAsync(1500);

    await expect(outcome).resolves.toMatchObject({
      output: { resumen: 'x', perfiles: [] },
    });
    expect(create).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  it('reports every call with its outcome and tokens', async () => {
    jest.useFakeTimers();
    const attempts: AnalysisAttempt[] = [];
    create
      .mockRejectedValueOnce(apiError(529, 'overloaded_error'))
      .mockResolvedValueOnce(message({ stop_reason: 'max_tokens' }));

    const outcome = analyzerWith()
      .analyze(input, { ...budget, onAttempt: (a) => attempts.push(a) })
      .catch((e: unknown) => e);
    await jest.advanceTimersByTimeAsync(1500);

    expect(await outcome).toBeInstanceOf(InvalidAnalysisOutputError);
    expect(attempts).toEqual([
      expect.objectContaining({
        provider: 'claude',
        outcome: 'unavailable',
        httpStatus: 529,
      }),
      expect.objectContaining({
        outcome: 'answered',
        inputTokens: 1800,
        outputTokens: 600,
        truncated: true,
      }),
    ]);
    jest.useRealTimers();
  });
});
