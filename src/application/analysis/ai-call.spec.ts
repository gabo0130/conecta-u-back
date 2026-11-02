import { ConflictException, ServiceUnavailableException } from '@nestjs/common';
import {
  AnalyzerUnavailableError,
  InvalidAnalysisOutputError,
} from '../../domain/repositories/project-analyzer.interface';
import { aiErrorToHttp, withOneRetryOnInvalidOutput } from './ai-call';

describe('withOneRetryOnInvalidOutput', () => {
  const later = () => Date.now() + 60_000;

  it('reintenta una sola vez ante una salida inválida', async () => {
    const onRetry = jest.fn();
    const attempt = jest
      .fn()
      .mockRejectedValueOnce(new InvalidAnalysisOutputError('mal'))
      .mockResolvedValueOnce('ok');
    await expect(
      withOneRetryOnInvalidOutput(attempt, later(), onRetry),
    ).resolves.toBe('ok');
    expect(onRetry).toHaveBeenCalledWith('mal');

    const always = jest
      .fn()
      .mockRejectedValue(new InvalidAnalysisOutputError('mal'));
    await expect(
      withOneRetryOnInvalidOutput(always, later(), jest.fn()),
    ).rejects.toThrow(InvalidAnalysisOutputError);
    expect(always).toHaveBeenCalledTimes(2);
  });

  it('no reintenta otros errores ni sin tiempo', async () => {
    const down = jest.fn().mockRejectedValue(new AnalyzerUnavailableError('x'));
    await expect(
      withOneRetryOnInvalidOutput(down, later(), jest.fn()),
    ).rejects.toThrow(AnalyzerUnavailableError);
    expect(down).toHaveBeenCalledTimes(1);

    const invalid = jest
      .fn()
      .mockRejectedValue(new InvalidAnalysisOutputError('mal'));
    await expect(
      withOneRetryOnInvalidOutput(invalid, Date.now() + 5_000, jest.fn()),
    ).rejects.toThrow(InvalidAnalysisOutputError);
    expect(invalid).toHaveBeenCalledTimes(1);
  });
});

describe('aiErrorToHttp', () => {
  const messages = { unavailable: 'caído', invalidOutput: 'ilegible' };

  it('traduce los errores de la IA a 503 y deja pasar los HTTP', () => {
    expect(aiErrorToHttp(new AnalyzerUnavailableError('x'), messages)).toEqual(
      new ServiceUnavailableException({ message: 'caído' }),
    );
    expect(
      aiErrorToHttp(new InvalidAnalysisOutputError('x'), messages),
    ).toEqual(new ServiceUnavailableException({ message: 'ilegible' }));
    const conflict = new ConflictException();
    expect(aiErrorToHttp(conflict, messages)).toBe(conflict);
    const other = new Error('otro');
    expect(aiErrorToHttp(other, messages)).toBe(other);
  });
});
