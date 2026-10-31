import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../app.js';
import { createLogger } from '../../shared/logger.js';
const servers: ReturnType<ReturnType<typeof createApp>['listen']>[] = [];
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
  }
});
async function start(ready: () => Promise<void>, stopping = false) {
  const lines: string[] = [];
  const server = createApp(
    { check: ready, isStopping: () => stopping },
    createLogger((line) => lines.push(line)),
  ).listen(0, '127.0.0.1');
  servers.push(server);
  await once(server, 'listening');
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    lines,
  };
}
describe('HTTP health integration', () => {
  it('keeps liveness independent of unavailable dependencies', async () => {
    const { url } = await start(async () => {
      throw new Error('database-secret');
    });
    expect((await fetch(`${url}/health`)).status).toBe(200);
    const response = await fetch(`${url}/ready`);
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: 'not_ready' });
  });
  it('returns ready only when dependencies succeed and shutdown has not begun', async () => {
    const { url } = await start(async () => {});
    expect((await fetch(`${url}/ready`)).status).toBe(200);
    const stopped = await start(async () => {}, true);
    expect((await fetch(`${stopped.url}/ready`)).status).toBe(503);
  });
  it('does not log paths, headers or error secrets', async () => {
    const { url, lines } = await start(async () => {
      throw new Error('database-secret');
    });
    await fetch(`${url}/missing?token=secret-query`, {
      headers: { authorization: 'Bearer secret-header' },
    });
    await fetch(`${url}/ready`);
    expect(lines.join('')).not.toMatch(
      /secret-query|secret-header|database-secret/,
    );
    expect(lines.map((line) => JSON.parse(line))).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event: 'http_request', status: 404 }),
      ]),
    );
  });
});
