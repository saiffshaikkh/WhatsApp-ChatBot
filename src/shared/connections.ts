import { PrismaPg } from '@prisma/adapter-pg';
import { Redis } from '@upstash/redis';
import { PrismaClient } from '../generated/prisma/client.js';
import type { Config } from './config.js';
export function createConnections(config: Config) {
  const db = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: config.DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
      statement_timeout: 5000,
      query_timeout: 5000,
    }),
    log: [],
  });
  const redis = new Redis({
    url: config.UPSTASH_REDIS_REST_URL,
    token: config.UPSTASH_REDIS_REST_TOKEN,
    retry: { retries: 0 },
    signal: () => AbortSignal.timeout(5000),
    enableTelemetry: false,
  });
  return {
    db,
    redis,
    async check() {
      const results = await Promise.allSettled([
        db.$queryRaw`SELECT 1`,
        redis.ping(),
      ]);
      if (
        results.some((r) => r.status === 'rejected') ||
        (results[1]?.status === 'fulfilled' && results[1].value !== 'PONG')
      )
        throw new Error('Dependencies unavailable');
    },
    async close() {
      await db.$disconnect();
    },
  };
}
export type Connections = ReturnType<typeof createConnections>;
