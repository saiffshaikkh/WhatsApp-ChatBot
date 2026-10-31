import { z } from 'zod';
import type { MemoryRepository } from './repository.js';
import { contentSchema, idSchema, preferenceSchema } from './schemas.js';
import { createRecentContext } from './context.js';
export function createMemoryService(
  repository: MemoryRepository,
  context: ReturnType<typeof createRecentContext>,
) {
  return {
    getCustomer: repository.customer,
    createConversation: repository.createConversation,
    getConversation: (id: string) =>
      repository.conversation(idSchema.parse(id)),
    saveMessage: (id: string, input: unknown) => {
      const message = z
        .object({ role: z.enum(['USER', 'ASSISTANT']), content: contentSchema })
        .strict()
        .parse(input);
      return repository.saveMessage(
        idSchema.parse(id),
        message.role,
        message.content,
      );
    },
    async getRecentMessages(id: string) {
      const conversation = await repository.conversation(idSchema.parse(id));
      return context.get(
        {
          customerId: repository.customerId,
          conversationId: conversation.id,
          version: conversation.contextVersion,
        },
        () => repository.recentMessages(conversation.id),
      );
    },
    saveSummary: (id: string, content: unknown) =>
      repository.saveSummary(idSchema.parse(id), contentSchema.parse(content)),
    getSummary: (id: string) => repository.summary(idSchema.parse(id)),
    savePreference: (input: unknown) => {
      const preference = preferenceSchema.parse(input);
      return repository.savePreference(preference.key, preference.value);
    },
    getPreferences: repository.preferences,
  };
}
