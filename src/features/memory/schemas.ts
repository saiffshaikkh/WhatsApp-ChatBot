import { z } from 'zod';
export const idSchema = z.uuid();
export const whatsappIdSchema = z.string().regex(/^[1-9]\d{5,19}$/);
export const contentSchema = z.string().trim().min(1).max(8000);
export const messageSchema = z
  .object({
    id: idSchema,
    customerId: idSchema,
    conversationId: idSchema,
    role: z.enum(['USER', 'ASSISTANT']),
    content: contentSchema,
    createdAt: z.iso.datetime(),
  })
  .strict();
export type RecentMessage = z.infer<typeof messageSchema>;
export const preferenceSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
    value: z.string().trim().min(1).max(1000),
    consent: z.literal(true),
  })
  .strict();
