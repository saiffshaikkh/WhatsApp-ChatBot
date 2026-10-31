import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { expect, it } from 'vitest';
import { errorHandler } from './errors.js';
import { createLogger } from './logger.js';
it('central error handling hides raw exception details', async () => {
  const lines: string[] = [];
  const app = express();
  app.get('/', () => {
    throw new Error('secret-connection-string');
  });
  app.use(errorHandler(createLogger((line) => lines.push(line))));
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const response = await fetch(
      `http://127.0.0.1:${(server.address() as AddressInfo).port}/`,
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'internal_error' });
    expect(lines.join('')).not.toContain('secret-connection-string');
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
