import { randomUUID } from 'node:crypto';
import express from 'express';
import { healthRouter, type Readiness } from './features/health/health.js';
import { errorHandler } from './shared/errors.js';
import type { Logger } from './shared/logger.js';
import {
  whatsappRouter,
  type WhatsAppTransport,
} from './features/whatsapp/routes.js';
export function createApp(
  readiness: Readiness,
  log: Logger,
  whatsapp?: WhatsAppTransport,
) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    const requestId = randomUUID();
    const started = performance.now();
    res.locals.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('Cache-Control', 'no-store');
    res.on('finish', () =>
      log('info', 'http_request', {
        requestId,
        status: res.statusCode,
        durationMs: Math.round(performance.now() - started),
      }),
    );
    next();
  });
  app.use(healthRouter(readiness, log));
  if (whatsapp) app.use(whatsappRouter(whatsapp, log));
  app.use((_req, res) => {
    res
      .status(404)
      .json({ error: 'not_found', requestId: res.locals.requestId });
  });
  app.use(errorHandler(log));
  return app;
}
