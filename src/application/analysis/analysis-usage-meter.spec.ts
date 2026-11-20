import type { ProjectAnalyzer } from '../../domain/repositories/project-analyzer.interface';
import { AnalysisUsageMeter } from './analysis-usage-meter';

const analyzer = { provider: 'fake', model: 'fake-1' } as ProjectAnalyzer;

describe('AnalysisUsageMeter', () => {
  it('adds up the tokens of every call, and keeps them in order', () => {
    const meter = new AnalysisUsageMeter();
    meter.record({
      provider: 'claude',
      model: 'claude-haiku-5-5',
      outcome: 'timeout',
      durationMs: 25_000,
      inputTokens: null,
      outputTokens: null,
    });
    meter.record({
      provider: 'gemini',
      model: 'gemini-3.8-flash',
      outcome: 'answered',
      durationMs: 9_000,
      inputTokens: 2000,
      outputTokens: 700,
    });

    expect(meter.usage()).toMatchObject({
      inputTokens: 2000,
      outputTokens: 700,
      attempts: [{ outcome: 'timeout' }, { outcome: 'answered' }],
    });
  });

  it('reports null tokens, not zero, when no call reported them', () => {
    const meter = new AnalysisUsageMeter();

    expect(meter.usage()).toEqual({
      inputTokens: null,
      outputTokens: null,
      attempts: [],
    });
  });

  it('counts an unreported response as one call of the configured model', () => {
    const meter = new AnalysisUsageMeter();
    meter.recordUnreportedResponse(analyzer, {
      output: {},
      usage: { inputTokens: 10, outputTokens: 5 },
    });

    expect(meter.count).toBe(1);
    expect(meter.usage().attempts[0]).toMatchObject({
      provider: 'fake',
      model: 'fake-1',
      outcome: 'answered',
      inputTokens: 10,
    });
  });
});
