import { Router } from 'express';
import type { Logger } from '../../shared/logger.js';
export type Readiness = { check(): Promise<void>; isStopping(): boolean };
export function healthRouter(readiness: Readiness, log: Logger) {
  const router = Router();
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  router.get('/ready', async (_req, res) => {
    try {
      if (readiness.isStopping()) {
        res.status(503).json({ status: 'not_ready' });
        return;
      }
      await readiness.check();
      if (readiness.isStopping()) {
        res.status(503).json({ status: 'not_ready' });
        return;
      }
      res.json({ status: 'ready' });
    } catch {
      log('error', 'dependency_failed');
      res.status(503).json({ status: 'not_ready' });
    }
  });
  return router;
}
