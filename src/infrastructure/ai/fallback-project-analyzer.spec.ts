import { Logger } from '@nestjs/common';
import {
  AnalyzerUnavailableError,
  InvalidAnalysisOutputError,
  type AnalysisInput,
  type AnalyzerResponse,
  type ProjectAnalyzer,
} from '../../domain/repositories/project-analyzer.interface';
import { FallbackProjectAnalyzer } from './fallback-project-analyzer';

const input = {} as AnalysisInput;
const answer: AnalyzerResponse = {
  output: { resumen: 'x' },
  usage: { inputTokens: 1, outputTokens: 1 },
};

const analyzerMock = (provider: string, model: string) => ({
  provider,
  model,
  promptVersion: 'v2',
  isAvailable: jest.fn(() => true),
  analyze: jest.fn<
    Promise<AnalyzerResponse>,
    Parameters<ProjectAnalyzer['analyze']>
  >(),
});

describe('FallbackProjectAnalyzer', () => {
  let claude: ReturnType<typeof analyzerMock>;
  let gemini: ReturnType<typeof analyzerMock>;
  let analyzer: FallbackProjectAnalyzer;

  beforeEach(() => {
    claude = analyzerMock('claude', 'claude-haiku-5-5');
    gemini = analyzerMock('gemini', 'gemini-3.8-flash');
    analyzer = new FallbackProjectAnalyzer(claude, gemini, 25_000);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => jest.restoreAllMocks());

  it('reports the primary provider and model', () => {
    expect(analyzer).toMatchObject({
      provider: 'claude',
      model: 'claude-haiku-5-5',
      promptVersion: 'v2',
    });
  });

  it('answers with the primary, waiting at most its own timeout', async () => {
    claude.analyze.mockResolvedValue(answer);

    await expect(analyzer.analyze(input, { timeoutMs: 90_000 })).resolves.toBe(
      answer,
    );
    expect(claude.analyze).toHaveBeenCalledWith(input, { timeoutMs: 25_000 });
    expect(gemini.analyze).not.toHaveBeenCalled();
  });

  it('always leaves 20 s to the fallback when the budget is short', async () => {
    claude.analyze.mockResolvedValue(answer);

    await analyzer.analyze(input, { timeoutMs: 35_000 });

    const [, { timeoutMs }] = claude.analyze.mock.calls[0];
    expect(timeoutMs).toBeLessThanOrEqual(15_000);
  });

  it('uses the fallback when the primary is unavailable and records which model answered', async () => {
    claude.analyze.mockRejectedValue(new AnalyzerUnavailableError('529'));
    gemini.analyze.mockResolvedValue(answer);

    await expect(
      analyzer.analyze(input, { timeoutMs: 90_000 }),
    ).resolves.toMatchObject({
      provider: 'gemini',
      model: 'gemini-3.8-flash',
    });
  });

  it('passes the attempt recorder to both providers', async () => {
    const onAttempt = jest.fn();
    claude.analyze.mockRejectedValue(new AnalyzerUnavailableError('529'));
    gemini.analyze.mockResolvedValue(answer);

    await analyzer.analyze(input, { timeoutMs: 90_000, onAttempt });

    expect(claude.analyze.mock.calls[0][1].onAttempt).toBe(onAttempt);
    expect(gemini.analyze.mock.calls[0][1].onAttempt).toBe(onAttempt);
  });

  it('keeps the model the fallback reports (its own backup model)', async () => {
    claude.analyze.mockRejectedValue(new AnalyzerUnavailableError('caída'));
    gemini.analyze.mockResolvedValue({
      ...answer,
      model: 'gemini-3.5-flash-lite',
    });

    await expect(
      analyzer.analyze(input, { timeoutMs: 90_000 }),
    ).resolves.toMatchObject({ model: 'gemini-3.5-flash-lite' });
  });

  it('does not use the fallback for an invalid output: the use case retries it', async () => {
    claude.analyze.mockRejectedValue(new InvalidAnalysisOutputError('JSON'));

    await expect(
      analyzer.analyze(input, { timeoutMs: 90_000 }),
    ).rejects.toBeInstanceOf(InvalidAnalysisOutputError);
    expect(gemini.analyze).not.toHaveBeenCalled();
  });

  it('goes straight to the fallback when the primary already knows it cannot answer', async () => {
    claude.isAvailable.mockReturnValue(false);
    gemini.analyze.mockResolvedValue(answer);

    await analyzer.analyze(input, { timeoutMs: 90_000 });

    expect(claude.analyze).not.toHaveBeenCalled();
    expect(gemini.analyze).toHaveBeenCalled();
  });

  it('is available while either of them is', () => {
    claude.isAvailable.mockReturnValue(false);
    expect(analyzer.isAvailable()).toBe(true);
    gemini.isAvailable.mockReturnValue(false);
    expect(analyzer.isAvailable()).toBe(false);
  });

  it('gives the primary all the time when there is no room for the fallback', async () => {
    claude.analyze.mockRejectedValue(new AnalyzerUnavailableError('caída'));

    await expect(
      analyzer.analyze(input, { timeoutMs: 12_000 }),
    ).rejects.toBeInstanceOf(AnalyzerUnavailableError);
    expect(claude.analyze).toHaveBeenCalledWith(input, { timeoutMs: 12_000 });
    expect(gemini.analyze).not.toHaveBeenCalled();
  });
});
