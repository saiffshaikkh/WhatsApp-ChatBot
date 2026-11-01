import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { PrismaClient } from '../../generated/prisma/client.js';
import { parseEnv } from '../../shared/config.js';
import { createLogger } from '../../shared/logger.js';
import { createWhatsAppRepository } from './repository.js';
import { createWhatsAppWorkflow } from './workflow.js';
import { normalizeWebhook } from './schemas.js';
import { testConfig, webhook } from './fixtures.test-support.js';
import { WhatsAppSendError } from './client.js';
import { createApp } from '../../app.js';
import { once } from 'node:events';
import { createHmac } from 'node:crypto';
import type { AddressInfo } from 'node:net';

const config = parseEnv(process.env);
const schema = `whatsapp_test_${randomUUID().replaceAll('-', '')}`;
const connection = {
  connectionString: config.DATABASE_URL_UNPOOLED,
  connectionTimeoutMillis: 5000,
  query_timeout: 5000,
  statement_timeout: 5000,
};
const admin = new PrismaClient({ adapter: new PrismaPg(connection) });
const makeDb = () =>
  new PrismaClient({ adapter: new PrismaPg(connection, { schema }) });
const db = makeDb();
let created = false;
beforeAll(async () => {
  if (!/^whatsapp_test_[a-f0-9]{32}$/.test(schema))
    throw new Error('Unsafe test schema');
  await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
  created = true;
  const sql = ['20261031000000_memory', '20261101000000_whatsapp']
    .map((name) =>
      readFileSync(`prisma/migrations/${name}/migration.sql`, 'utf8'),
    )
    .join('\n')
    .replace(/CREATE SCHEMA IF NOT EXISTS "public";/, '');
  await admin.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO "${schema}"`);
      for (const statement of sql
        .split(';')
        .map((part) => part.trim())
        .filter((part) => part.replace(/--[^\n]*/g, '').trim()))
        await tx.$executeRawUnsafe(statement);
    },
    { maxWait: 5000, timeout: 30000 },
  );
}, 60000);
afterAll(async () => {
  await db.$disconnect();
  try {
    if (created && /^whatsapp_test_[a-f0-9]{32}$/.test(schema))
      await admin.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
  } finally {
    await admin.$disconnect();
  }
}, 60000);
function fixture() {
  const phoneNumberId = BigInt(
    '0x' + randomUUID().replaceAll('-', '').slice(0, 12),
  ).toString();
  const whatsappId =
    '9' +
    BigInt('0x' + randomUUID().replaceAll('-', '').slice(0, 12))
      .toString()
      .padStart(15, '0');
  const repository = createWhatsAppRepository(db, phoneNumberId);
  const message = {
    ...normalizeWebhook(
      webhook(`wamid.${randomUUID()}`, whatsappId),
      testConfig.WHATSAPP_PHONE_NUMBER_ID,
    )[0]!,
    phoneNumberId,
  };
  const client = { sendText: vi.fn(async () => `wamid.${randomUUID()}`) };
  const log = createLogger(() => {});
  const workflow = createWhatsAppWorkflow(repository, client, log);
  return { repository, message, client, workflow, phoneNumberId, log };
}
it('creates a new customer, conversation, incoming message and durable pending reply atomically', async () => {
  const { repository, message } = fixture();
  expect(await repository.accept(message)).toBe(true);
  const customer = await db.customer.findUniqueOrThrow({
    where: { whatsappId: message.whatsappId },
  });
  const conversations = await db.conversation.findMany({
    where: { customerId: customer.id },
  });
  expect(conversations).toHaveLength(1);
  expect(conversations[0]!.contextVersion).toBe(1);
  expect(
    await db.message.count({
      where: { customerId: customer.id, role: 'USER' },
    }),
  ).toBe(1);
  expect(
    await db.whatsAppDelivery.count({
      where: { customerId: customer.id, status: 'PENDING' },
    }),
  ).toBe(1);
});
it('reuses an existing customer and conversation for subsequent messages', async () => {
  const { repository, message } = fixture();
  const existing = await db.customer.create({
    data: { whatsappId: message.whatsappId },
  });
  await repository.accept(message);
  await repository.accept({ ...message, messageId: `wamid.${randomUUID()}` });
  expect(
    await db.customer.count({ where: { whatsappId: message.whatsappId } }),
  ).toBe(1);
  expect(
    await db.conversation.count({ where: { customerId: existing.id } }),
  ).toBe(1);
  expect(await db.message.count({ where: { customerId: existing.id } })).toBe(
    2,
  );
});
it('deduplicates concurrent deliveries and permits only one worker to claim a reply', async () => {
  const { repository, message, phoneNumberId } = fixture();
  const results = await Promise.all([
    repository.accept(message),
    repository.accept(message),
  ]);
  expect(results.sort()).toEqual([false, true]);
  const claims = await Promise.all([
    repository.claim(),
    createWhatsAppRepository(db, phoneNumberId).claim(),
  ]);
  expect(claims.filter(Boolean)).toHaveLength(1);
  expect(await db.whatsAppDelivery.count({ where: { phoneNumberId } })).toBe(1);
  expect(
    await db.message.count({
      where: { conversation: { whatsappPhoneNumberId: phoneNumberId } },
    }),
  ).toBe(1);
});
it('recovers pending work after reconnect and prevents duplicate replies after completion', async () => {
  const { repository, message, client, phoneNumberId, log } = fixture();
  await repository.accept(message);
  const reconnected = makeDb();
  try {
    const restarted = createWhatsAppWorkflow(
      createWhatsAppRepository(reconnected, phoneNumberId),
      client,
      log,
    );
    await restarted.processNext();
    await restarted.accept([message]);
    await restarted.processNext();
    expect(client.sendText).toHaveBeenCalledTimes(1);
    const delivery = await db.whatsAppDelivery.findFirstOrThrow({
      where: { phoneNumberId },
    });
    expect(delivery.status).toBe('ACCEPTED');
    expect(delivery.outgoingMessageId).toMatch(/^wamid\./);
    expect(
      await db.message.count({
        where: { conversationId: delivery.conversationId, role: 'ASSISTANT' },
      }),
    ).toBe(1);
    expect(
      (
        await db.conversation.findUniqueOrThrow({
          where: { id: delivery.conversationId },
        })
      ).contextVersion,
    ).toBe(2);
  } finally {
    await reconnected.$disconnect();
  }
});
it('keeps customers, receiver channels and duplicate identity checks isolated', async () => {
  const a = fixture(),
    b = fixture();
  await a.repository.accept(a.message);
  await b.repository.accept({ ...b.message, messageId: a.message.messageId });
  await expect(
    a.repository.accept({ ...a.message, whatsappId: b.message.whatsappId }),
  ).rejects.toThrow('WhatsApp identity conflict');
  await expect(a.repository.accept(b.message)).rejects.toThrow(
    'Unexpected WhatsApp receiver',
  );
  const first = await a.repository.claim();
  const second = await b.repository.claim();
  expect(first!.recipient).toBe(a.message.whatsappId);
  expect(second!.recipient).toBe(b.message.whatsappId);
  expect(first!.customerId).not.toBe(second!.customerId);
  await expect(
    a.repository.complete(
      { ...first!, customerId: second!.customerId },
      'wamid.invalid',
    ),
  ).rejects.toThrow('WhatsApp claim unavailable');
});
it('rolls back partial writes when message persistence fails', async () => {
  const { repository, message, phoneNumberId } = fixture();
  await expect(
    repository.accept({ ...message, content: 'x'.repeat(8001) }),
  ).rejects.toThrow('WhatsApp persistence failed');
  expect(
    await db.customer.count({ where: { whatsappId: message.whatsappId } }),
  ).toBe(0);
  expect(await db.whatsAppDelivery.count({ where: { phoneNumberId } })).toBe(0);
});
it('records API failures without assistant history and bounds rate-limit retries to three attempts', async () => {
  const { repository, message, workflow, client, phoneNumberId } = fixture();
  await repository.accept(message);
  client.sendText.mockRejectedValue(new WhatsAppSendError('retry'));
  for (let attempt = 1; attempt <= 3; attempt++) {
    await workflow.processNext();
    const delivery = await db.whatsAppDelivery.findFirstOrThrow({
      where: { phoneNumberId },
    });
    expect(delivery.attempts).toBe(attempt);
    expect(delivery.status).toBe(attempt < 3 ? 'PENDING' : 'FAILED');
    expect(delivery.nextAttemptAt.getTime()).toBeGreaterThan(
      Date.now() + 50000,
    );
    if (attempt < 3)
      await db.whatsAppDelivery.update({
        where: { id: delivery.id },
        data: { nextAttemptAt: new Date(0) },
      });
  }
  await workflow.processNext();
  expect(client.sendText).toHaveBeenCalledTimes(3);
  expect(
    await db.message.count({
      where: {
        conversation: { whatsappPhoneNumberId: phoneNumberId },
        role: 'ASSISTANT',
      },
    }),
  ).toBe(0);
});
it('does not retry uncertain timeouts and recovers abandoned sending claims conservatively', async () => {
  const a = fixture();
  await a.repository.accept(a.message);
  a.client.sendText.mockRejectedValueOnce(new WhatsAppSendError('uncertain'));
  await a.workflow.processNext();
  await a.workflow.processNext();
  expect(a.client.sendText).toHaveBeenCalledTimes(1);
  expect(
    (
      await db.whatsAppDelivery.findFirstOrThrow({
        where: { phoneNumberId: a.phoneNumberId },
      })
    ).status,
  ).toBe('UNCERTAIN');
  const b = fixture();
  await b.repository.accept(b.message);
  const claimed = await b.repository.claim();
  await db.whatsAppDelivery.update({
    where: { id: claimed!.id },
    data: { claimedAt: new Date(Date.now() - 61000) },
  });
  expect(await b.repository.claim()).toBeNull();
  expect(
    (
      await db.whatsAppDelivery.findUniqueOrThrow({
        where: { id: claimed!.id },
      })
    ).status,
  ).toBe('UNCERTAIN');
});
it('expires delayed messages and persists only a bounded media placeholder', async () => {
  const a = fixture();
  await a.repository.accept({
    ...a.message,
    sentAt: new Date(Date.now() - 24 * 60 * 60000),
  });
  await a.workflow.processNext();
  expect(a.client.sendText).not.toHaveBeenCalled();
  expect(
    (
      await db.whatsAppDelivery.findFirstOrThrow({
        where: { phoneNumberId: a.phoneNumberId },
      })
    ).status,
  ).toBe('EXPIRED');
  const b = fixture();
  await b.repository.accept({
    ...b.message,
    supported: false,
    content: '[Unsupported WhatsApp message]',
  });
  await b.workflow.processNext();
  expect(b.client.sendText).toHaveBeenCalledWith(
    b.message.whatsappId,
    expect.stringContaining('Please send a text message'),
  );
});
it('runs signed HTTP input through real persistence and mocked outgoing delivery end to end', async () => {
  const { workflow, client, phoneNumberId } = fixture();
  const server = createApp(
    { check: async () => {}, isStopping: () => false },
    createLogger(() => {}),
    {
      config: { ...testConfig, WHATSAPP_PHONE_NUMBER_ID: phoneNumberId },
      accept: workflow.accept,
    },
  ).listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const payload = webhook(`wamid.${randomUUID()}`);
    payload.entry[0]!.changes[0]!.value.metadata.phone_number_id =
      phoneNumberId;
    const body = JSON.stringify(payload);
    const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/webhooks/whatsapp`;
    const options = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256': `sha256=${createHmac('sha256', testConfig.WHATSAPP_APP_SECRET).update(body).digest('hex')}`,
      },
      body,
    };
    expect((await fetch(url, options)).status).toBe(200);
    expect((await fetch(url, options)).status).toBe(200);
    await workflow.processNext();
    await workflow.processNext();
    expect(client.sendText).toHaveBeenCalledTimes(1);
    expect(
      await db.whatsAppDelivery.count({
        where: { phoneNumberId, status: 'ACCEPTED' },
      }),
    ).toBe(1);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
