import { afterEach, expect, it, vi } from 'vitest';
import { createWhatsAppClient, WhatsAppSendError } from './client.js';
import { testConfig } from './fixtures.test-support.js';
afterEach(() => vi.useRealTimers());

it('sends text only to the fixed Meta endpoint with authorization and validates API acceptance', async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        messaging_product: 'whatsapp',
        messages: [{ id: 'wamid.outgoing' }],
      }),
    ),
  );
  expect(
    await createWhatsAppClient(testConfig, request).sendText(
      '999000000001',
      'Synthetic reply',
    ),
  ).toBe('wamid.outgoing');
  expect(request).toHaveBeenCalledWith(
    `https://graph.facebook.com/${testConfig.WHATSAPP_API_VERSION}/${testConfig.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    expect.objectContaining({
      method: 'POST',
      redirect: 'error',
      headers: expect.objectContaining({
        authorization: `Bearer ${testConfig.WHATSAPP_ACCESS_TOKEN}`,
      }),
    }),
  );
  expect(JSON.parse(request.mock.calls[0]![1]!.body as string)).toMatchObject({
    to: '999000000001',
    text: { body: 'Synthetic reply', preview_url: false },
  });
});
it.each([
  [400, 'failed'],
  [401, 'failed'],
  [429, 'retry'],
  [500, 'uncertain'],
  [503, 'uncertain'],
])('sanitizes API failure %i with outcome %s', async (status, outcome) => {
  const request = vi
    .fn<typeof fetch>()
    .mockResolvedValue(
      new Response('synthetic-access-token', { status: status as number }),
    );
  await expect(
    createWhatsAppClient(testConfig, request).sendText(
      '999000000001',
      'Synthetic',
    ),
  ).rejects.toMatchObject({ message: 'WhatsApp send failed', outcome });
  expect(request).toHaveBeenCalledTimes(1);
});
it('aborts a timed out request after five seconds and treats delivery as uncertain', async () => {
  vi.spyOn(AbortSignal, 'timeout').mockImplementationOnce((milliseconds) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), milliseconds);
    return controller.signal;
  });
  vi.useFakeTimers();
  const request = vi
    .fn<typeof fetch>()
    .mockImplementation(
      async (_url, options) =>
        new Promise((_resolve, reject) =>
          options!.signal!.addEventListener('abort', () =>
            reject(new Error('synthetic-access-token')),
          ),
        ),
    );
  const result = expect(
    createWhatsAppClient(testConfig, request).sendText(
      '999000000001',
      'Synthetic',
    ),
  ).rejects.toMatchObject({
    outcome: 'uncertain',
    message: 'WhatsApp send failed',
  });
  await vi.advanceTimersByTimeAsync(5000);
  await result;
  expect(request).toHaveBeenCalledTimes(1);
  vi.restoreAllMocks();
});
it('rejects malformed, oversized and lost success responses as uncertain', async () => {
  for (const body of ['{}', '{', 'x'.repeat(65537)]) {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(body));
    await expect(
      createWhatsAppClient(testConfig, request).sendText(
        '999000000001',
        'Synthetic',
      ),
    ).rejects.toBeInstanceOf(WhatsAppSendError);
  }
  const request = vi
    .fn<typeof fetch>()
    .mockRejectedValue(new Error('synthetic-access-token'));
  await expect(
    createWhatsAppClient(testConfig, request).sendText(
      '999000000001',
      'Synthetic',
    ),
  ).rejects.toMatchObject({
    outcome: 'uncertain',
    message: 'WhatsApp send failed',
  });
});
it('validates destination and content before any network request', async () => {
  const request = vi.fn<typeof fetch>();
  const client = createWhatsAppClient(testConfig, request);
  await expect(
    client.sendText('https://example.com', 'Synthetic'),
  ).rejects.toThrow();
  await expect(client.sendText('999000000001', '')).rejects.toThrow();
  expect(request).not.toHaveBeenCalled();
});
