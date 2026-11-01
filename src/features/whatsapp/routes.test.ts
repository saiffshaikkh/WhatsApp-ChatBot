import { createHmac } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { afterEach, expect, it, vi } from 'vitest';
import { createApp } from '../../app.js';
import { createLogger } from '../../shared/logger.js';
import { testConfig, webhook } from './fixtures.test-support.js';
import { normalizeWebhook } from './schemas.js';

const servers: ReturnType<ReturnType<typeof createApp>['listen']>[] = [];
afterEach(async () => {
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
async function setup() {
  const lines: string[] = [];
  const accept = vi.fn(async () => {});
  const server = createApp(
    { check: async () => {}, isStopping: () => false },
    createLogger((line) => lines.push(line)),
    { config: testConfig, accept },
  ).listen(0, '127.0.0.1');
  servers.push(server);
  await once(server, 'listening');
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/webhooks/whatsapp`;
  const post = (payload: unknown, signature?: string) => {
    const body =
      typeof payload === 'string' ? payload : JSON.stringify(payload);
    return fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-hub-signature-256':
          signature ??
          `sha256=${createHmac('sha256', testConfig.WHATSAPP_APP_SECRET).update(body).digest('hex')}`,
      },
      body,
    });
  };
  return { url, post, accept, lines };
}

it('verifies the subscription and returns a plain challenge only with matching token and mode', async () => {
  const { url } = await setup();
  const query = new URLSearchParams({
    'hub.mode': 'subscribe',
    'hub.verify_token': testConfig.WHATSAPP_VERIFY_TOKEN,
    'hub.challenge': '12345',
  });
  const response = await fetch(`${url}?${query}`);
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('text/plain');
  expect(await response.text()).toBe('12345');
  query.set('hub.verify_token', 'wrong');
  expect((await fetch(`${url}?${query}`)).status).toBe(403);
  query.set('hub.verify_token', testConfig.WHATSAPP_VERIFY_TOKEN);
  query.set('hub.mode', 'invalid');
  expect((await fetch(`${url}?${query}`)).status).toBe(403);
  expect((await fetch(url)).status).toBe(403);
});
it('authenticates raw bytes and extracts identity from message.from, never contacts or supplied scope', async () => {
  const { post, accept } = await setup();
  const response = await post(webhook());
  expect(response.status).toBe(200);
  expect(accept).toHaveBeenCalledWith([
    expect.objectContaining({
      whatsappId: '999000000001',
      content: 'Synthetic test message',
      supported: true,
    }),
  ]);
  expect((await post(webhook(), 'sha256=' + '0'.repeat(64))).status).toBe(401);
  expect((await post(webhook(), 'bad')).status).toBe(401);
  expect(accept).toHaveBeenCalledTimes(1);
});
it('does not acknowledge until durable acceptance completes', async () => {
  const { post, accept } = await setup();
  let release: (() => void) | undefined;
  let entered: (() => void) | undefined;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  accept.mockImplementationOnce(async () => {
    entered!();
    await new Promise<void>((resolve) => {
      release = resolve;
    });
  });
  let completed = false;
  const response = post(webhook()).then((result) => {
    completed = true;
    return result;
  });
  await started;
  expect(completed).toBe(false);
  release!();
  expect((await response).status).toBe(200);
});
it('rejects malformed JSON, messages, foreign receiver and oversized payload without persistence', async () => {
  const { post, accept } = await setup();
  expect((await post('{')).status).toBe(400);
  expect(
    (await post({ object: 'whatsapp_business_account', entry: [] })).status,
  ).toBe(400);
  const payload = webhook();
  payload.entry[0]!.changes[0]!.value.messages[0]!.text.body = '';
  expect((await post(payload)).status).toBe(400);
  payload.entry[0]!.changes[0]!.value.messages[0]!.text.body = 'Synthetic';
  payload.entry[0]!.changes[0]!.value.metadata.phone_number_id = '200000000001';
  expect((await post(payload)).status).toBe(400);
  expect((await post('x'.repeat(262145))).status).toBe(413);
  expect(accept).not.toHaveBeenCalled();
});
it('returns a retryable error on durable failure and never logs secrets or customer content', async () => {
  const { url, post, accept, lines } = await setup();
  accept.mockRejectedValueOnce(
    new Error(`${testConfig.WHATSAPP_ACCESS_TOKEN} Synthetic test message`),
  );
  expect((await post(webhook())).status).toBe(500);
  await fetch(`${url}?hub.verify_token=${testConfig.WHATSAPP_VERIFY_TOKEN}`);
  expect(lines.join('')).not.toMatch(
    /synthetic-access-token|synthetic-verify-token|synthetic-app-secret|Synthetic test message|999000000001/,
  );
});
it('normalizes unsupported media without storing media payload and ignores status notifications', () => {
  const payload = webhook();
  payload.entry[0]!.changes[0]!.value.messages[0]!.type = 'image';
  expect(
    normalizeWebhook(payload, testConfig.WHATSAPP_PHONE_NUMBER_ID)[0],
  ).toMatchObject({
    supported: false,
    content: '[Unsupported WhatsApp message]',
  });
  const status = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '100000000002',
        changes: [
          {
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                phone_number_id: testConfig.WHATSAPP_PHONE_NUMBER_ID,
              },
              statuses: [{ id: 'wamid.synthetic', status: 'delivered' }],
            },
          },
        ],
      },
    ],
  };
  expect(normalizeWebhook(status, testConfig.WHATSAPP_PHONE_NUMBER_ID)).toEqual(
    [],
  );
});
it('rejects missing text, forged sender, future timestamps and excessive message batches', () => {
  const payload = webhook();
  const value = payload.entry[0]!.changes[0]!.value;
  expect(() =>
    normalizeWebhook(
      {
        ...payload,
        entry: [
          {
            ...payload.entry[0],
            changes: [
              {
                field: 'messages',
                value: {
                  ...value,
                  messages: [{ ...value.messages[0], text: undefined }],
                },
              },
            ],
          },
        ],
      },
      testConfig.WHATSAPP_PHONE_NUMBER_ID,
    ),
  ).toThrow();
  value.messages[0]!.from = 'invalid';
  expect(() =>
    normalizeWebhook(payload, testConfig.WHATSAPP_PHONE_NUMBER_ID),
  ).toThrow();
  value.messages[0]!.from = '999000000001';
  value.messages[0]!.timestamp = String(Math.floor(Date.now() / 1000) + 3600);
  expect(() =>
    normalizeWebhook(payload, testConfig.WHATSAPP_PHONE_NUMBER_ID),
  ).toThrow();
  value.messages = Array.from(
    { length: 21 },
    () => webhook().entry[0]!.changes[0]!.value.messages[0]!,
  );
  expect(() =>
    normalizeWebhook(payload, testConfig.WHATSAPP_PHONE_NUMBER_ID),
  ).toThrow();
});
