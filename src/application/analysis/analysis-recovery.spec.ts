import type { ProjectAnalysisRepository } from '../../domain/repositories/project-analysis.repository.interface';
import type { AppLoggerService } from '../../shared/logging/logger.service';
import { createMock } from '../../testing/test-doubles.testing';
import { AnalysisRecoveryService } from './analysis-recovery.service';
import { parseAnalysisTimeouts } from './analysis-timeouts';

describe('parseAnalysisTimeouts', () => {
  it('uses a total budget below the 60 s the front waits, and a short embedding timeout', () => {
    expect(parseAnalysisTimeouts(undefined, undefined)).toEqual({
      totalMs: 55_000,
      embeddingMs: 10_000,
      staleAfterMs: 115_000,
    });
  });

  it('derives the stale threshold from the configured budget', () => {
    expect(parseAnalysisTimeouts('90000', '5000')).toEqual({
      totalMs: 90_000,
      embeddingMs: 5_000,
      staleAfterMs: 150_000,
    });
  });

  it('keeps the values inside sane ranges', () => {
    expect(parseAnalysisTimeouts('100', '999999')).toMatchObject({
      totalMs: 10_000,
      embeddingMs: 60_000,
    });
  });

  it('falls back to the defaults on invalid values instead of failing to start', () => {
    expect(parseAnalysisTimeouts('abc', '-5')).toMatchObject({
      totalMs: 55_000,
      embeddingMs: 10_000,
    });
  });
});

describe('AnalysisRecoveryService', () => {
  const repository = createMock<ProjectAnalysisRepository>();
  const contextLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    error: jest.fn(),
  };
  const logger = {
    forContext: () => contextLogger,
  } as unknown as AppLoggerService;
  const timeouts = parseAnalysisTimeouts(undefined, undefined);
  const service = new AnalysisRecoveryService(repository, timeouts, logger);

  beforeEach(() => {
    jest.resetAllMocks();
    repository.recoverInterrupted.mockResolvedValue(0);
  });

  afterEach(() => service.onApplicationShutdown());

  it('treats as interrupted the pending analyses older than budget plus margin', async () => {
    const now = 1_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);

    await service.recover('project-1');

    expect(repository.recoverInterrupted).toHaveBeenCalledWith(
      new Date(now - 115_000),
      'project-1',
    );
    jest.restoreAllMocks();
  });

  it('logs when it closed interrupted analyses', async () => {
    repository.recoverInterrupted.mockResolvedValue(2);

    await service.recover();

    expect(contextLogger.warn).toHaveBeenCalledWith(
      'Se cerraron análisis interrumpidos',
      expect.objectContaining({ recovered: 2 }),
    );
  });

  it('never throws: a database failure is only logged', async () => {
    repository.recoverInterrupted.mockRejectedValue(new Error('db caída'));

    await expect(service.recover('project-1')).resolves.toBeUndefined();
    expect(contextLogger.error).toHaveBeenCalled();
  });

  it('recovers every project at startup and then once a minute', () => {
    jest.useFakeTimers();

    service.onApplicationBootstrap();
    expect(repository.recoverInterrupted).toHaveBeenCalledTimes(1);
    expect(repository.recoverInterrupted.mock.calls[0][1]).toBeUndefined();

    jest.advanceTimersByTime(60_000);
    expect(repository.recoverInterrupted).toHaveBeenCalledTimes(2);

    service.onApplicationShutdown();
    jest.advanceTimersByTime(120_000);
    expect(repository.recoverInterrupted).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });
});
