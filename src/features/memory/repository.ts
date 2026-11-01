import type {
  PrismaClient,
  MessageRole,
  Prisma,
} from '../../generated/prisma/client.js';
import { idSchema, whatsappIdSchema } from './schemas.js';
// This resolver is for verified transport identity only, never a customer-supplied lookup key.
export async function resolveCustomer(
  db: Pick<PrismaClient, 'customer'>,
  verifiedWhatsappId: string,
) {
  const whatsappId = whatsappIdSchema.parse(verifiedWhatsappId);
  return db.customer.upsert({
    where: { whatsappId },
    create: { whatsappId },
    update: { whatsappId },
  });
}
export async function persistMessage(
  tx: Prisma.TransactionClient,
  customerId: string,
  conversationId: string,
  role: MessageRole,
  content: string,
) {
  const result = await tx.conversation.updateMany({
    where: { id: conversationId, customerId },
    data: { contextVersion: { increment: 1 } },
  });
  if (result.count !== 1) throw new Error('Conversation unavailable');
  return tx.message.create({
    data: { customerId, conversationId, role, content },
  });
}
export function createMemoryRepository(
  db: PrismaClient,
  trustedCustomerId: string,
) {
  const customerId = idSchema.parse(trustedCustomerId);
  async function conversation(conversationId: string) {
    const found = await db.conversation.findUnique({
      where: {
        id_customerId: { id: idSchema.parse(conversationId), customerId },
      },
    });
    if (!found) throw new Error('Conversation unavailable');
    return found;
  }
  return {
    customerId,
    customer: () => db.customer.findUnique({ where: { id: customerId } }),
    createConversation: () => db.conversation.create({ data: { customerId } }),
    conversation,
    async saveMessage(
      conversationId: string,
      role: MessageRole,
      content: string,
    ) {
      return db.$transaction(
        (tx) => persistMessage(tx, customerId, conversationId, role, content),
        { maxWait: 5000, timeout: 5000 },
      );
    },
    async recentMessages(conversationId: string) {
      await conversation(conversationId);
      const messages = await db.message.findMany({
        where: { customerId, conversationId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 20,
      });
      return messages
        .reverse()
        .map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));
    },
    async saveSummary(conversationId: string, content: string) {
      const current = await conversation(conversationId);
      return db.conversationSummary.upsert({
        where: { conversationId_customerId: { conversationId, customerId } },
        create: {
          conversationId,
          customerId,
          content,
          sourceVersion: current.contextVersion,
        },
        update: { content, sourceVersion: current.contextVersion },
      });
    },
    async summary(conversationId: string) {
      await conversation(conversationId);
      return db.conversationSummary.findUnique({
        where: { conversationId_customerId: { conversationId, customerId } },
      });
    },
    savePreference: (key: string, value: string) =>
      db.customerPreference.upsert({
        where: { customerId_key: { customerId, key } },
        create: { customerId, key, value, consentedAt: new Date() },
        update: { value, consentedAt: new Date() },
      }),
    preferences: () =>
      db.customerPreference.findMany({
        where: { customerId },
        orderBy: { key: 'asc' },
      }),
  };
}
export type MemoryRepository = ReturnType<typeof createMemoryRepository>;
