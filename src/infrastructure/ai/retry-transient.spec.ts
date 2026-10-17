import { ApiError } from '@google/genai';
import { callWithTransientRetry, isDailyQuotaError } from './retry-transient';

const apiError = (status: number, message = `error ${status}`) =>
  new ApiError({ message, status });

describe('callWithTransientRetry', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns the result without retrying when the call succeeds', async () => {
    const call = jest.fn().mockResolvedValue('ok');

    await expect(callWithTransientRetry(call, 55_000)).resolves.toBe('ok');
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('retries a transient 503 and then succeeds', async () => {
    const call = jest
      .fn()
      .mockRejectedValueOnce(apiError(503))
      .mockResolvedValue('ok');

    const result = callWithTransientRetry(call, 55_000);
    await jest.advanceTimersByTimeAsync(1500);

    await expect(result).resolves.toBe('ok');
    expect(call).toHaveBeenCalledTimes(2);
  });

  it('gives up after two retries', async () => {
    const call = jest.fn().mockRejectedValue(apiError(503));

    const result = callWithTransientRetry(call, 55_000);
    const assertion = expect(result).rejects.toMatchObject({ status: 503 });
    await jest.advanceTimersByTimeAsync(1500 + 4000);

    await assertion;
    expect(call).toHaveBeenCalledTimes(3);
  });

  it('does not retry a 429: the quota does not come back in seconds', async () => {
    const call = jest.fn().mockRejectedValue(apiError(429));

    await expect(callWithTransientRetry(call, 55_000)).rejects.toMatchObject({
      status: 429,
    });
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('does not retry a permanent error such as 404', async () => {
    const call = jest.fn().mockRejectedValue(apiError(404));

    await expect(callWithTransientRetry(call, 55_000)).rejects.toMatchObject({
      status: 404,
    });
    expect(call).toHaveBeenCalledTimes(1);
  });

  it('does not retry when there is not enough time left', async () => {
    const call = jest.fn().mockRejectedValue(apiError(503));

    await expect(callWithTransientRetry(call, 4000)).rejects.toMatchObject({
      status: 503,
    });
    expect(call).toHaveBeenCalledTimes(1);
  });
});

describe('isDailyQuotaError', () => {
  const dailyQuota =
    'got status: 429 Too Many Requests. {"error":{"code":429,"status":"RESOURCE_EXHAUSTED","details":[{"violations":[{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier"}]}]}}';
  const perMinute =
    'got status: 429 Too Many Requests. {"error":{"code":429,"details":[{"violations":[{"quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier"}]}]}}';

  it('recognizes a 429 caused by the daily quota', () => {
    expect(isDailyQuotaError(apiError(429, dailyQuota))).toBe(true);
  });

  it('does not treat a per-minute 429 as the daily quota', () => {
    expect(isDailyQuotaError(apiError(429, perMinute))).toBe(false);
  });

  it('ignores other statuses and non-API errors', () => {
    expect(isDailyQuotaError(apiError(503, dailyQuota))).toBe(false);
    expect(isDailyQuotaError(new Error(dailyQuota))).toBe(false);
  });
});
