import { createServer } from 'node:http';
import { expect, it, vi } from 'vitest';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { createShutdown, startServer } from './lifecycle.js';
import { createLogger } from './logger.js';
it('does not bind a socket when startup probes fail', async () => {
  const server = createServer();
  await expect(
    startServer(server, 0, async () => {
      throw new Error('offline');
    }),
  ).rejects.toThrow('offline');
  expect(server.listening).toBe(false);
});
it('drains HTTP before closing resources and coalesces shutdown signals', async () => {
  const server = createServer((_req, res) => {
    setTimeout(() => res.end('finished'), 30);
  });
  await startServer(server, 0, async () => {});
  const arrived = once(server, 'request');
  const response = fetch(
    `http://127.0.0.1:${(server.address() as AddressInfo).port}/`,
  ).then((r) => r.text());
  await arrived;
  let stopped = false;
  let closures = 0;
  const shutdown = createShutdown(
    server,
    async () => {
      expect(server.listening).toBe(false);
      closures++;
    },
    () => {
      stopped = true;
    },
    createLogger(() => {}),
    () => {
      throw new Error('Unexpected timeout');
    },
  );
  const first = shutdown();
  expect(shutdown()).toBe(first);
  await first;
  expect(await response).toBe('finished');
  expect(stopped).toBe(true);
  expect(closures).toBe(1);
});

it('does not start listening after shutdown was requested during dependency checks', async () => {
  const server = createServer();
  let stopping = false;
  await expect(
    startServer(
      server,
      0,
      async () => {
        stopping = true;
      },
      () => stopping,
    ),
  ).rejects.toThrow('Startup cancelled');
  expect(server.listening).toBe(false);
});

it('forces exit when resource cleanup exceeds the shutdown deadline', async () => {
  vi.useFakeTimers();
  let release!: () => void;
  let forced = false;
  const shutdown = createShutdown(
    createServer(),
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
    () => {},
    createLogger(() => {}),
    () => {
      forced = true;
    },
  );
  try {
    const done = shutdown();
    await vi.advanceTimersByTimeAsync(10000);
    expect(forced).toBe(true);
    release();
    await done;
  } finally {
    vi.useRealTimers();
  }
});
