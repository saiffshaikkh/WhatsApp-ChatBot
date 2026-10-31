import { z } from 'zod';
import { messageSchema, type RecentMessage } from './schemas.js';
import type { Logger } from '../../shared/logger.js';
export type ContextScope = {
  customerId: string;
  conversationId: string;
  version: number;
};
export type ContextStore = {
  get(key: string): Promise<unknown>;
  set(
    key: string,
    value: RecentMessage[],
    options: { ex: number },
  ): Promise<unknown>;
};
const messagesSchema = z.array(messageSchema).max(20);
export function createRecentContext(redis: ContextStore, log: Logger) {
  return {
    async get(scope: ContextScope, load: () => Promise<RecentMessage[]>) {
      const key = `memory:v1:${scope.customerId}:${scope.conversationId}:${scope.version}`;
      try {
        const cached = messagesSchema.safeParse(await redis.get(key));
        if (
          cached.success &&
          cached.data.every(
            (m) =>
              m.customerId === scope.customerId &&
              m.conversationId === scope.conversationId,
          )
        )
          return cached.data;
      } catch {
        log('error', 'memory_cache_failed');
      }
      const messages = await load();
      try {
        await redis.set(key, messages, { ex: 300 });
      } catch {
        log('error', 'memory_cache_failed');
      }
      return messages;
    },
  };
}
