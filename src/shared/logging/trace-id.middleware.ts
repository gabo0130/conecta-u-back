import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { RequestContext } from './request-context';

export const TRACE_ID_HEADER = 'x-request-id';

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers[TRACE_ID_HEADER];
    const traceId =
      (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();

    res.setHeader(TRACE_ID_HEADER, traceId);
    RequestContext.run({ traceId }, () => next());
  }
}
