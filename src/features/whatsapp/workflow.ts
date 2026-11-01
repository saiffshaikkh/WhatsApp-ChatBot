import type { WhatsAppDelivery } from '../../generated/prisma/client.js';
import type { WhatsAppClient } from './client.js';
import { WhatsAppSendError } from './client.js';
import type { Logger } from '../../shared/logger.js';
import type { IncomingMessage } from './schemas.js';

export const PLACEHOLDER_REPLY =
  'Thanks for your message. This assistant is being set up and cannot answer shopping or support questions yet.';
export const UNSUPPORTED_REPLY =
  'Please send a text message. This assistant cannot process media or other message types yet.';
export const REPLY_WINDOW_MS = (24 * 60 - 5) * 60000;
export type DeliveryJob = WhatsAppDelivery & { recipient: string };
export type DeliveryRepository = {
  accept(message: IncomingMessage): Promise<boolean>;
  claim(): Promise<DeliveryJob | null>;
  complete(job: DeliveryJob, outgoingMessageId: string): Promise<void>;
  fail(
    job: DeliveryJob,
    outcome: 'failed' | 'retry' | 'uncertain' | 'expired',
  ): Promise<void>;
};
export function createWhatsAppWorkflow(
  repository: DeliveryRepository,
  client: WhatsAppClient,
  log: Logger,
) {
  return {
    async accept(messages: IncomingMessage[]) {
      for (const message of messages) {
        const created = await repository.accept(message);
        log('info', created ? 'whatsapp_accepted' : 'whatsapp_duplicate');
      }
    },
    async processNext() {
      const job = await repository.claim();
      if (!job) return;
      if (Date.now() - job.sentAt.getTime() >= REPLY_WINDOW_MS) {
        await repository.fail(job, 'expired');
        log('info', 'whatsapp_expired', { requestId: job.id });
        return;
      }
      let outgoingMessageId: string;
      try {
        outgoingMessageId = await client.sendText(job.recipient, job.reply);
      } catch (error) {
        const outcome =
          error instanceof WhatsAppSendError ? error.outcome : 'uncertain';
        await repository.fail(job, outcome);
        log(
          'error',
          outcome === 'retry' && job.attempts < 3
            ? 'whatsapp_retry'
            : outcome === 'uncertain'
              ? 'whatsapp_uncertain'
              : 'whatsapp_failed',
          { requestId: job.id },
        );
        return;
      }
      // Completion failure leaves SENDING for conservative crash recovery, never a blind resend.
      await repository.complete(job, outgoingMessageId);
      log('info', 'whatsapp_api_accepted', { requestId: job.id });
    },
  };
}

export function startWhatsAppWorker(
  workflow: Pick<ReturnType<typeof createWhatsAppWorkflow>, 'processNext'>,
  log: Logger,
) {
  let running: Promise<void> | undefined;
  let stopped = false;
  const tick = () => {
    if (stopped || running) return;
    running = workflow
      .processNext()
      .catch(() => {
        log('error', 'whatsapp_processing_failed');
      })
      .finally(() => {
        running = undefined;
      });
  };
  const timer = setInterval(tick, 1000);
  tick();
  return async () => {
    stopped = true;
    clearInterval(timer);
    await running;
  };
}
