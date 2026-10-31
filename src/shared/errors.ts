import type { ErrorRequestHandler } from 'express';
import type { Logger } from './logger.js';
export function errorHandler(log: Logger): ErrorRequestHandler {
  return (_error: unknown, _req, res, next) => {
    log('error', 'request_failed', {
      requestId: res.locals.requestId as string,
    });
    if (res.headersSent) {
      res.destroy();
      return;
    }
    res
      .status(500)
      .json({ error: 'internal_error', requestId: res.locals.requestId });
    void next;
  };
}
