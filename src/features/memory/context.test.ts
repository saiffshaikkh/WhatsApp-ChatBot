import { expect, it, vi } from 'vitest';
import { createRecentContext } from './context.js';
import { createLogger } from '../../shared/logger.js';
const scope = {
  customerId: '00000000-0000-4000-8000-000000000001',
  conversationId: '00000000-0000-4000-8000-000000000002',
  version: 1,
};
const message = {
  id: '00000000-0000-4000-8000-000000000003',
  customerId: scope.customerId,
  conversationId: scope.conversationId,
  role: 'USER' as const,
  content: 'synthetic context',
  createdAt: '2026-10-31T00:00:00.000Z',
};
function setup() {
  const values = new Map<string, unknown>();
  const redis = {
    get: vi.fn(async (key: string) => values.get(key) ?? null),
    set: vi.fn(async (key: string, value: unknown) => {
      values.set(key, value);
      return 'OK';
    }),
  };
  const lines: string[] = [];
  const context = createRecentContext(
    redis,
    createLogger((line) => lines.push(line)),
  );
  return { values, redis, lines, context };
}
it('reuses scoped cached context and refreshes on durable version change', async () => {
  const { context } = setup();
  let reads = 0;
  const load = async () => {
    reads++;
    return [message];
  };
  expect(await context.get(scope, load)).toEqual([message]);
  expect(await context.get(scope, load)).toEqual([message]);
  expect(reads).toBe(1);
  await context.get({ ...scope, version: 2 }, load);
  expect(reads).toBe(2);
});
it('rejects cached content belonging to another customer or conversation', async () => {
  const { context, values } = setup();
  await context.get(scope, async () => [message]);
  for (const key of values.keys())
    values.set(key, [
      { ...message, customerId: '00000000-0000-4000-8000-000000000099' },
    ]);
  expect(await context.get(scope, async () => [])).toEqual([]);
  for (const key of values.keys())
    values.set(key, [
      { ...message, conversationId: '00000000-0000-4000-8000-000000000099' },
    ]);
  expect(await context.get(scope, async () => [])).toEqual([]);
});
it('falls back to durable data when Redis reads and writes fail without logging content', async () => {
  const { context, redis, lines } = setup();
  redis.get.mockRejectedValue(new Error('private-token'));
  redis.set.mockRejectedValue(new Error('private-token'));
  expect(await context.get(scope, async () => [message])).toEqual([message]);
  expect(lines.join('')).not.toMatch(/private-token|synthetic context/);
});
it('does not use Redis to hide a durable read failure', async () => {
  const { context, redis } = setup();
  redis.get.mockRejectedValue(new Error('cache down'));
  await expect(
    context.get(scope, async () => {
      throw new Error('database down');
    }),
  ).rejects.toThrow('database down');
});
