import { z } from 'zod';

export const whatsappConfigSchema = z.object({
  WHATSAPP_ACCESS_TOKEN: z.string().trim().min(1).max(4096),
  WHATSAPP_VERIFY_TOKEN: z.string().trim().min(16).max(256),
  WHATSAPP_APP_SECRET: z.string().trim().min(16).max(256),
  WHATSAPP_PHONE_NUMBER_ID: z.string().regex(/^\d{1,32}$/),
  WHATSAPP_API_VERSION: z.string().regex(/^v\d{1,3}\.0$/),
});
export type WhatsAppConfig = z.infer<typeof whatsappConfigSchema>;
