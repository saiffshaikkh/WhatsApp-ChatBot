import { z } from 'zod';
import type { WhatsAppConfig } from './config.js';
import { providerIdSchema } from './schemas.js';
import { whatsappIdSchema } from '../memory/schemas.js';

export class WhatsAppSendError extends Error {
  constructor(readonly outcome: 'failed' | 'retry' | 'uncertain') {
    super('WhatsApp send failed');
  }
}
const responseSchema = z.object({
  messaging_product: z.literal('whatsapp'),
  messages: z.array(z.object({ id: providerIdSchema })).length(1),
});

export function createWhatsAppClient(
  config: WhatsAppConfig,
  request: typeof fetch = fetch,
) {
  return {
    async sendText(to: string, body: string) {
      const recipient = whatsappIdSchema.parse(to);
      const text = z.string().trim().min(1).max(4096).parse(body);
      try {
        const response = await request(
          `https://graph.facebook.com/${config.WHATSAPP_API_VERSION}/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`,
          {
            method: 'POST',
            headers: {
              authorization: `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: recipient,
              type: 'text',
              text: { preview_url: false, body: text },
            }),
            signal: AbortSignal.timeout(5000),
            redirect: 'error',
          },
        );
        if (!response.ok) {
          await response.body?.cancel();
          throw new WhatsAppSendError(
            response.status === 429
              ? 'retry'
              : response.status >= 500
                ? 'uncertain'
                : 'failed',
          );
        }
        const reader = response.body?.getReader();
        if (!reader) throw new WhatsAppSendError('uncertain');
        const chunks: Uint8Array[] = [];
        let size = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 65536) throw new WhatsAppSendError('uncertain');
            chunks.push(value);
          }
        } finally {
          await reader.cancel();
        }
        const parsed = responseSchema.parse(
          JSON.parse(Buffer.concat(chunks).toString('utf8')),
        );
        return parsed.messages[0]!.id;
      } catch (error) {
        if (error instanceof WhatsAppSendError) throw error;
        // A lost response can follow an accepted send; automatic resend could duplicate it.
        throw new WhatsAppSendError('uncertain');
      }
    },
  };
}
export type WhatsAppClient = ReturnType<typeof createWhatsAppClient>;
