import { z } from 'zod';
import { whatsappIdSchema } from '../memory/schemas.js';

export const providerIdSchema = z.string().min(1).max(256);
const messageSchema = z
  .object({
    from: whatsappIdSchema,
    id: providerIdSchema,
    timestamp: z.string().regex(/^\d{1,12}$/),
    type: z.string().min(1).max(64),
    text: z.object({ body: z.string().trim().min(1).max(4096) }).optional(),
  })
  .refine((message) => message.type !== 'text' || message.text !== undefined);

export const webhookSchema = z.object({
  object: z.literal('whatsapp_business_account'),
  entry: z
    .array(
      z.object({
        id: z.string().regex(/^\d{1,32}$/),
        changes: z
          .array(
            z.object({
              field: z.literal('messages'),
              value: z
                .object({
                  messaging_product: z.literal('whatsapp'),
                  metadata: z.object({
                    phone_number_id: z.string().regex(/^\d{1,32}$/),
                  }),
                  messages: z.array(messageSchema).min(1).max(20).optional(),
                  statuses: z
                    .array(
                      z.object({
                        id: providerIdSchema,
                        status: z.string().min(1).max(64),
                      }),
                    )
                    .min(1)
                    .max(20)
                    .optional(),
                })
                .refine((value) => Boolean(value.messages || value.statuses)),
            }),
          )
          .min(1)
          .max(10),
      }),
    )
    .min(1)
    .max(10),
});

export type IncomingMessage = {
  phoneNumberId: string;
  messageId: string;
  whatsappId: string;
  sentAt: Date;
  content: string;
  supported: boolean;
};

export function normalizeWebhook(
  input: unknown,
  phoneNumberId: string,
  now = new Date(),
): IncomingMessage[] {
  const payload = webhookSchema.parse(input);
  const messages: IncomingMessage[] = [];
  for (const entry of payload.entry) {
    for (const { value } of entry.changes) {
      if (value.metadata.phone_number_id !== phoneNumberId)
        throw new Error('Unexpected WhatsApp receiver');
      for (const message of value.messages ?? []) {
        const sentAt = new Date(Number(message.timestamp) * 1000);
        if (sentAt.getTime() > now.getTime() + 300000)
          throw new Error('Invalid WhatsApp timestamp');
        messages.push({
          phoneNumberId,
          messageId: message.id,
          whatsappId: message.from,
          sentAt,
          content:
            message.type === 'text'
              ? message.text!.body
              : '[Unsupported WhatsApp message]',
          supported: message.type === 'text',
        });
        if (messages.length > 20) throw new Error('WhatsApp batch too large');
      }
    }
  }
  return messages;
}
