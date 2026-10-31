import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { createConnections } from '../../shared/connections.js';
import { parseEnv } from '../../shared/config.js';
import { createLogger } from '../../shared/logger.js';
import { createMemoryRepository, resolveCustomer } from './repository.js';
import { createMemoryService } from './service.js';
import { createRecentContext } from './context.js';

const config = parseEnv(process.env);
const schema = `memory_test_${randomUUID().replaceAll('-', '')}`;
const admin = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: config.DATABASE_URL_UNPOOLED,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
    statement_timeout: 5000,
  }),
});
const makeDb = () =>
  new PrismaClient({
    adapter: new PrismaPg(
      {
        connectionString: config.DATABASE_URL_UNPOOLED,
        connectionTimeoutMillis: 5000,
        query_timeout: 5000,
        statement_timeout: 5000,
      },
      { schema },
    ),
  });
const db = makeDb();
const connections = createConnections(config);
const redis = connections.redis;
const cacheKeys = new Set<string>();
const cache = {
  get: (key: string) => redis.get(key),
  set: (
    key: string,
    value: Parameters<typeof redis.set>[1],
    options: { ex: number },
  ) => {
    cacheKeys.add(key);
    return redis.set(key, value, options);
  },
};
let created = false;
beforeAll(async () => {
  if (!/^memory_test_[a-f0-9]{32}$/.test(schema))
    throw new Error('Unsafe test schema');
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  created = true;
  const sql = readFileSync(
    'prisma/migrations/20261031000000_memory/migration.sql',
    'utf8',
  ).replace(/CREATE SCHEMA IF NOT EXISTS "public";/, '');
  await admin.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
      for (const statement of sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.replace(/--[^\n]*/g, '').trim()))
        await tx.$executeRawUnsafe(statement);
    },
    { timeout: 30000 },
  );
}, 60000);
afterAll(async () => {
  try {
    for (const key of cacheKeys) await redis.del(key);
  } finally {
    await db.$disconnect();
    if (created && /^memory_test_[a-f0-9]{32}$/.test(schema))
      await admin.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await admin.$disconnect();
    await connections.close();
  }
}, 60000);
async function fixture() {
  const identity = () =>
    '9' +
    BigInt('0x' + randomBytes(6).toString('hex'))
      .toString()
      .padStart(15, '0');
  const a = await resolveCustomer(db, identity());
  const b = await resolveCustomer(db, identity());
  const service = (id: string) =>
    createMemoryService(
      createMemoryRepository(db, id),
      createRecentContext(
        cache,
        createLogger(() => {}),
      ),
    );
  const A = service(a.id),
    B = service(b.id);
  const c = await A.createConversation(),
    other = await A.createConversation(),
    foreign = await B.createConversation();
  return { a, b, A, B, c, other, foreign };
}
it('persists customer identity, messages, preferences and summary across clients', async () => {
  const { a, A, c } = await fixture();
  expect((await resolveCustomer(db, a.whatsappId)).id).toBe(a.id);
  expect((await A.getCustomer())?.id).toBe(a.id);
  await A.saveMessage(c.id, {
    role: 'USER',
    content: 'Synthetic fixture only',
  });
  await A.saveSummary(c.id, 'Synthetic summary');
  await A.savePreference({
    key: 'style',
    value: 'synthetic style',
    consent: true,
  });
  const fresh = makeDb();
  try {
    const repository = createMemoryRepository(fresh, a.id);
    expect((await repository.recentMessages(c.id))[0]?.content).toBe(
      'Synthetic fixture only',
    );
    expect((await repository.summary(c.id))?.content).toBe('Synthetic summary');
    expect((await repository.preferences())[0]?.value).toBe('synthetic style');
  } finally {
    await fresh.$disconnect();
  }
});
it('denies cross-customer conversation, message and summary reads and writes', async () => {
  const { A, B, c } = await fixture();
  await A.saveMessage(c.id, {
    role: 'USER',
    content: 'Synthetic private text',
  });
  await A.saveSummary(c.id, 'Synthetic private summary');
  for (const operation of [
    () => B.getConversation(c.id),
    () => B.getRecentMessages(c.id),
    () => B.getSummary(c.id),
    () => B.saveMessage(c.id, { role: 'USER', content: 'forbidden' }),
    () => B.saveSummary(c.id, 'forbidden'),
  ])
    await expect(operation()).rejects.toThrow('Conversation unavailable');
  expect(await A.getRecentMessages(c.id)).toHaveLength(1);
  expect((await A.getSummary(c.id))?.content).toBe('Synthetic private summary');
});
it('separates same-customer conversations and bounds recent context to twenty', async () => {
  const { A, c, other } = await fixture();
  await db.$transaction([
    db.message.createMany({
      data: Array.from({ length: 22 }, (_, i) => ({
        customerId: c.customerId,
        conversationId: c.id,
        role: 'USER' as const,
        content: `synthetic-${i}`,
        createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)),
      })),
    }),
    db.conversation.update({
      where: { id: c.id },
      data: { contextVersion: 22 },
    }),
  ]);
  expect(await A.getRecentMessages(other.id)).toEqual([]);
  expect(await A.getSummary(other.id)).toBeNull();
  const recent = await A.getRecentMessages(c.id);
  expect(recent).toHaveLength(20);
  expect(recent[0]?.content).toBe('synthetic-2');
  expect(recent[19]?.content).toBe('synthetic-21');
  expect(await db.message.count({ where: { conversationId: c.id } })).toBe(22);
});
it('isolates preference upserts and requires explicit consent', async () => {
  const { A, B } = await fixture();
  expect(() =>
    A.savePreference({
      key: 'style',
      value: 'synthetic style',
      consent: false,
    }),
  ).toThrow();
  await A.savePreference({ key: 'style', value: 'synthetic A', consent: true });
  await B.savePreference({ key: 'style', value: 'synthetic B', consent: true });
  await A.savePreference({
    key: 'style',
    value: 'synthetic A updated',
    consent: true,
  });
  expect((await A.getPreferences()).map((p) => p.value)).toEqual([
    'synthetic A updated',
  ]);
  expect((await B.getPreferences()).map((p) => p.value)).toEqual([
    'synthetic B',
  ]);
});
it('stores expiring recent context in real Upstash and invalidates via durable version', async () => {
  const { a, A, c } = await fixture();
  await A.saveMessage(c.id, { role: 'USER', content: 'synthetic first' });
  expect(await A.getRecentMessages(c.id)).toHaveLength(1);
  const key = `memory:v1:${a.id}:${c.id}:1`;
  expect(await redis.get(key)).not.toBeNull();
  expect(await redis.ttl(key)).toBeGreaterThan(0);
  expect(await redis.ttl(key)).toBeLessThanOrEqual(300);
  await A.saveMessage(c.id, { role: 'ASSISTANT', content: 'synthetic second' });
  expect((await A.getRecentMessages(c.id)).map((m) => m.content)).toEqual([
    'synthetic first',
    'synthetic second',
  ]);
  await redis.del(key);
  expect(await A.getRecentMessages(c.id)).toHaveLength(2);
});
it('enforces ownership relationships at the database boundary', async () => {
  const { a, b, c, A } = await fixture();
  await expect(
    db.message.create({
      data: {
        customerId: b.id,
        conversationId: c.id,
        content: 'forbidden',
        role: 'USER',
      },
    }),
  ).rejects.toMatchObject({ code: 'P2003' });
  await expect(
    db.conversation.create({ data: { customerId: randomUUID() } }),
  ).rejects.toMatchObject({ code: 'P2003' });
  await A.saveMessage(c.id, {
    role: 'USER',
    content: 'synthetic cascade fixture',
  });
  await A.saveSummary(c.id, 'synthetic cascade summary');
  await A.savePreference({
    key: 'style',
    value: 'synthetic cascade preference',
    consent: true,
  });
  await A.getRecentMessages(c.id);
  await db.customer.delete({ where: { id: a.id } });
  await expect(A.getRecentMessages(c.id)).rejects.toThrow(
    'Conversation unavailable',
  );
  expect(await db.message.count({ where: { customerId: a.id } })).toBe(0);
  expect(
    await db.conversationSummary.count({ where: { customerId: a.id } }),
  ).toBe(0);
  expect(
    await db.customerPreference.count({ where: { customerId: a.id } }),
  ).toBe(0);
  expect(await db.conversation.count({ where: { customerId: a.id } })).toBe(0);
});
it('continues durable message saves and reads during a Redis outage', async () => {
  const { a, c } = await fixture();
  const offline = {
    get: async () => {
      throw new Error('offline');
    },
    set: async () => {
      throw new Error('offline');
    },
  };
  const service = createMemoryService(
    createMemoryRepository(db, a.id),
    createRecentContext(
      offline,
      createLogger(() => {}),
    ),
  );
  await service.saveMessage(c.id, {
    role: 'USER',
    content: 'synthetic durable fallback',
  });
  expect((await service.getRecentMessages(c.id))[0]?.content).toBe(
    'synthetic durable fallback',
  );
  expect(await db.message.count({ where: { conversationId: c.id } })).toBe(1);
});
