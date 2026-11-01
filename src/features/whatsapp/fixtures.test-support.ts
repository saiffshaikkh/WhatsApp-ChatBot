// Synthetic transport fixtures only, never real customer data or usable credentials.
export const testConfig = {
  WHATSAPP_ACCESS_TOKEN: 'synthetic-access-token',
  WHATSAPP_VERIFY_TOKEN: 'synthetic-verify-token',
  WHATSAPP_APP_SECRET: 'synthetic-app-secret',
  WHATSAPP_PHONE_NUMBER_ID: '100000000001',
  WHATSAPP_API_VERSION: 'v25.0',
};
export function webhook(id = 'wamid.synthetic', from = '999000000001') {
  return {
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
              contacts: [{ wa_id: '999000000099' }],
              messages: [
                {
                  from,
                  id,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  type: 'text',
                  text: { body: 'Synthetic test message' },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}
