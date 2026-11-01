import { randomUUID } from 'node:crypto';
import { afterEach, expect, it, vi } from 'vitest';
import {
  createWhatsAppWorkflow,
  startWhatsAppWorker,
  PLACEHOLDER_REPLY,
  type DeliveryJob,
  type DeliveryRepository,
} from './workflow.js';
import { WhatsAppSendError } from './client.js';
import { createLogger } from '../../shared/logger.js';
import { normalizeWebhook } from './schemas.js';
import { testConfig, webhook } from './fixtures.test-support.js';

function setup() {
  const job: DeliveryJob = {
    id: randomUUID(),
    phoneNumberId: testConfig.WHATSAPP_PHONE_NUMBER_ID,
    messageId: 'wamid.synthetic',
    customerId: randomUUID(),
    conversationId: randomUUID(),
    sentAt: new Date(),
    reply: PLACEHOLDER_REPLY,
    status: 'SENDING',
    attempts: 1,
    nextAttemptAt: new Date(),
    claimedAt: new Date(),
    outgoingMessageId: null,
    createdAt: new Date(),
    recipient: '999000000001',
  };
  const repository = {
    accept: vi.fn<DeliveryRepository['accept']>().mockResolvedValue(true),
    claim: vi.fn<DeliveryRepository['claim']>().mockResolvedValue(job),
    complete: vi
      .fn<DeliveryRepository['complete']>()
      .mockResolvedValue(undefined),
    fail: vi.fn<DeliveryRepository['fail']>().mockResolvedValue(undefined),
  };
  const client = { sendText: vi.fn().mockResolvedValue('wamid.outgoing') };
  const lines: string[] = [];
  const workflow = createWhatsAppWorkflow(
    repository,
    client,
    createLogger((line) => lines.push(line)),
  );
  return { workflow, repository, client, lines, job };
}
afterEach(() => vi.useRealTimers());
it('accepts normalized messages and records duplicate outcomes without secrets', async () => {
  const { workflow, repository, lines } = setup();
  repository.accept.mockResolvedValueOnce(false);
  await workflow.accept(
    normalizeWebhook(webhook(), testConfig.WHATSAPP_PHONE_NUMBER_ID),
  );
  expect(lines.join('')).toContain('whatsapp_duplicate');
  expect(lines.join('')).not.toMatch(
    /999000000001|Synthetic|synthetic-access-token/,
  );
});
it('sends the placeholder and records API acceptance after the send succeeds', async () => {
  const { workflow, repository, client, job } = setup();
  await workflow.processNext();
  expect(client.sendText).toHaveBeenCalledWith(
    job.recipient,
    PLACEHOLDER_REPLY,
  );
  expect(repository.complete).toHaveBeenCalledWith(job, 'wamid.outgoing');
  expect(repository.fail).not.toHaveBeenCalled();
});
it.each(['failed', 'retry', 'uncertain'] as const)(
  'persists %s send outcome without claiming success',
  async (outcome) => {
    const { workflow, repository, client, job } = setup();
    client.sendText.mockRejectedValueOnce(new WhatsAppSendError(outcome));
    await workflow.processNext();
    expect(repository.fail).toHaveBeenCalledWith(job, outcome);
    expect(repository.complete).not.toHaveBeenCalled();
  },
);
it('does not resend after API success when completion persistence fails', async () => {
  const { workflow, repository, client } = setup();
  repository.complete.mockRejectedValueOnce(
    new Error('Synthetic storage failure'),
  );
  await expect(workflow.processNext()).rejects.toThrow(
    'Synthetic storage failure',
  );
  expect(client.sendText).toHaveBeenCalledTimes(1);
  expect(repository.fail).not.toHaveBeenCalled();
});
it('expires old messages without sending and leaves empty queues untouched', async () => {
  const { workflow, repository, client, job } = setup();
  job.sentAt = new Date(Date.now() - 24 * 60 * 60000);
  await workflow.processNext();
  expect(repository.fail).toHaveBeenCalledWith(job, 'expired');
  expect(client.sendText).not.toHaveBeenCalled();
  repository.claim.mockResolvedValueOnce(null);
  await workflow.processNext();
  expect(client.sendText).not.toHaveBeenCalled();
});
it('prevents overlapping worker runs and drains in-flight work on shutdown', async () => {
  vi.useFakeTimers();
  let release: (() => void) | undefined;
  const processNext = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  const stop = startWhatsAppWorker(
    { processNext },
    createLogger(() => {}),
  );
  await vi.advanceTimersByTimeAsync(3000);
  expect(processNext).toHaveBeenCalledTimes(1);
  let stopped = false;
  const stopping = stop().then(() => {
    stopped = true;
  });
  expect(stopped).toBe(false);
  release!();
  await stopping;
  await vi.advanceTimersByTimeAsync(3000);
  expect(processNext).toHaveBeenCalledTimes(1);
});
it('keeps polling after a sanitized worker failure', async () => {
  vi.useFakeTimers();
  const lines: string[] = [];
  const processNext = vi.fn(async () => {
    throw new Error('synthetic-access-token');
  });
  const stop = startWhatsAppWorker(
    { processNext },
    createLogger((line) => lines.push(line)),
  );
  await vi.advanceTimersByTimeAsync(1000);
  await stop();
  expect(processNext).toHaveBeenCalledTimes(2);
  expect(lines.join('')).toContain('whatsapp_processing_failed');
  expect(lines.join('')).not.toContain('synthetic-access-token');
});

it('reports a final failure when the rate-limit retry budget is exhausted', async () => {
  const { workflow, client, job, lines } = setup();
  job.attempts = 3;
  client.sendText.mockRejectedValueOnce(new WhatsAppSendError('retry'));
  await workflow.processNext();
  expect(lines.join('')).toContain('whatsapp_failed');
  expect(lines.join('')).not.toContain('whatsapp_retry');
});
