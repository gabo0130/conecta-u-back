import { TraceIdMiddleware, TRACE_ID_HEADER } from './trace-id.middleware';
import { RequestContext } from './request-context';

describe('TraceIdMiddleware', () => {
  const middleware = new TraceIdMiddleware();

  const createRequest = (headers: Record<string, string | string[]> = {}) =>
    ({ headers }) as never;

  const createResponse = () => ({ setHeader: jest.fn() }) as never;

  it('generates a new traceId when the header is missing', () => {
    const req = createRequest();
    const res = createResponse();
    let capturedTraceId: string | undefined;

    middleware.use(req, res, () => {
      capturedTraceId = RequestContext.traceId;
    });

    expect(capturedTraceId).toEqual(expect.any(String));
    expect(capturedTraceId).not.toHaveLength(0);
    expect(res.setHeader).toHaveBeenCalledWith(
      TRACE_ID_HEADER,
      capturedTraceId,
    );
  });

  it('reuses an incoming traceId header instead of generating one', () => {
    const req = createRequest({ [TRACE_ID_HEADER]: 'incoming-trace-id' });
    const res = createResponse();
    let capturedTraceId: string | undefined;

    middleware.use(req, res, () => {
      capturedTraceId = RequestContext.traceId;
    });

    expect(capturedTraceId).toBe('incoming-trace-id');
    expect(res.setHeader).toHaveBeenCalledWith(
      TRACE_ID_HEADER,
      'incoming-trace-id',
    );
  });

  it('calls next()', () => {
    const req = createRequest();
    const res = createResponse();
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
