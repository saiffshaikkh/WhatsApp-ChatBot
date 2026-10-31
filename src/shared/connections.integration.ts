import { expect, it } from 'vitest';
import { parseEnv } from './config.js';
import { createConnections } from './connections.js';
it('connects to authorized Neon and Upstash services using read-only probes', async () => {
  const connections = createConnections(parseEnv(process.env));
  try {
    await expect(connections.check()).resolves.toBeUndefined();
  } finally {
    await connections.close();
  }
});
