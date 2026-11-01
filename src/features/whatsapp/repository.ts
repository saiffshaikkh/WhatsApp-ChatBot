import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import { persistMessage } from '../memory/repository.js';
import { resolveConversation } from './conversations.js';
import {
  PLACEHOLDER_REPLY,
  UNSUPPORTED_REPLY,
  type DeliveryRepository,
} from './workflow.js';

export function createWhatsAppRepository(
  db: PrismaClient,
  phoneNumberId: string,
): DeliveryRepository {
  return {
    async accept(message) {
      if (message.phoneNumberId !== phoneNumberId)
        throw new Error('Unexpected WhatsApp receiver');
      const where = {
        phoneNumberId_messageId: {
          phoneNumberId,
          messageId: message.messageId,
        },
      };
      const existing = await db.whatsAppDelivery.findUnique({
        where,
        include: { conversation: { include: { customer: true } } },
      });
      if (existing) {
        if (existing.conversation.customer.whatsappId !== message.whatsappId)
          throw new Error('WhatsApp identity conflict');
        return false;
      }
      try {
        await db.$transaction(
          async (tx) => {
            const scope = await resolveConversation(
              tx,
              message.whatsappId,
              phoneNumberId,
            );
            await tx.whatsAppDelivery.create({
              data: {
                ...scope,
                phoneNumberId,
                messageId: message.messageId,
                sentAt: message.sentAt,
                reply: message.supported
                  ? PLACEHOLDER_REPLY
                  : UNSUPPORTED_REPLY,
              },
            });
            await persistMessage(
              tx,
              scope.customerId,
              scope.conversationId,
              'USER',
              message.content,
            );
          },
          { maxWait: 5000, timeout: 5000 },
        );
        return true;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          const duplicate = await db.whatsAppDelivery.findUnique({
            where,
            include: { conversation: { include: { customer: true } } },
          });
          if (
            duplicate?.conversation.customer.whatsappId === message.whatsappId
          )
            return false;
        }
        throw new Error('WhatsApp persistence failed', { cause: error });
      }
    },
    async claim() {
      const now = new Date();
      await db.whatsAppDelivery.updateMany({
        where: {
          phoneNumberId,
          status: 'SENDING',
          claimedAt: { lt: new Date(now.getTime() - 60000) },
        },
        data: { status: 'UNCERTAIN' },
      });
      const job = await db.whatsAppDelivery.findFirst({
        where: {
          phoneNumberId,
          status: 'PENDING',
          nextAttemptAt: { lte: now },
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: { conversation: { include: { customer: true } } },
      });
      if (!job) return null;
      const result = await db.whatsAppDelivery.updateMany({
        where: { id: job.id, status: 'PENDING', attempts: job.attempts },
        data: { status: 'SENDING', claimedAt: now, attempts: { increment: 1 } },
      });
      return result.count === 1
        ? {
            ...job,
            status: 'SENDING',
            attempts: job.attempts + 1,
            claimedAt: now,
            recipient: job.conversation.customer.whatsappId,
          }
        : null;
    },
    async complete(job, outgoingMessageId) {
      await db.$transaction(
        async (tx) => {
          const result = await tx.whatsAppDelivery.updateMany({
            where: {
              id: job.id,
              customerId: job.customerId,
              conversationId: job.conversationId,
              status: 'SENDING',
            },
            data: { status: 'ACCEPTED', outgoingMessageId },
          });
          if (result.count !== 1) throw new Error('WhatsApp claim unavailable');
          await persistMessage(
            tx,
            job.customerId,
            job.conversationId,
            'ASSISTANT',
            job.reply,
          );
        },
        { maxWait: 5000, timeout: 5000 },
      );
    },
    async fail(job, outcome) {
      const status =
        outcome === 'retry' && job.attempts < 3
          ? 'PENDING'
          : outcome === 'uncertain'
            ? 'UNCERTAIN'
            : outcome === 'expired'
              ? 'EXPIRED'
              : 'FAILED';
      const result = await db.whatsAppDelivery.updateMany({
        where: {
          id: job.id,
          customerId: job.customerId,
          conversationId: job.conversationId,
          status: 'SENDING',
        },
        data: { status, nextAttemptAt: new Date(Date.now() + 60000) },
      });
      if (result.count !== 1) throw new Error('WhatsApp claim unavailable');
    },
  };
}
