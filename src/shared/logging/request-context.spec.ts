import { RequestContext } from './request-context';

describe('RequestContext', () => {
  it('returns undefined traceId outside of run()', () => {
    expect(RequestContext.traceId).toBeUndefined();
  });

  it('exposes the traceId set by run() inside the callback', () => {
    RequestContext.run({ traceId: 'trace-1' }, () => {
      expect(RequestContext.traceId).toBe('trace-1');
    });
  });

  it('propagates the traceId across an async chain', async () => {
    const readTraceIdLater = async () => {
      await Promise.resolve();
      return RequestContext.traceId;
    };

    const result = await RequestContext.run({ traceId: 'trace-2' }, () =>
      readTraceIdLater(),
    );

    expect(result).toBe('trace-2');
  });

  it('does not leak the traceId outside of run()', () => {
    RequestContext.run({ traceId: 'trace-3' }, () => {
      // no-op, just establishes and exits the context
    });

    expect(RequestContext.traceId).toBeUndefined();
  });

  it('isolates concurrent contexts from each other', async () => {
    const results = await Promise.all([
      RequestContext.run({ traceId: 'a' }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return RequestContext.traceId;
      }),
      RequestContext.run({ traceId: 'b' }, async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return RequestContext.traceId;
      }),
    ]);

    expect(results).toEqual(['a', 'b']);
  });
});
