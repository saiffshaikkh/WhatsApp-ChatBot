import type { Prisma } from '../../generated/prisma/client.js';
import { resolveCustomer } from '../memory/repository.js';

export async function resolveConversation(
  tx: Prisma.TransactionClient,
  whatsappId: string,
  phoneNumberId: string,
) {
  const customer = await resolveCustomer(tx, whatsappId);
  const conversation = await tx.conversation.upsert({
    where: {
      customerId_whatsappPhoneNumberId: {
        customerId: customer.id,
        whatsappPhoneNumberId: phoneNumberId,
      },
    },
    create: { customerId: customer.id, whatsappPhoneNumberId: phoneNumberId },
    update: { whatsappPhoneNumberId: phoneNumberId },
  });
  return { customerId: customer.id, conversationId: conversation.id };
}
