import { describe, expect, it } from 'vitest';
import { parseEnv } from './config.js';
const valid = {
  DATABASE_URL:
    'postgresql://test:placeholder@ep-example-pooler.eu-west-2.aws.neon.tech/test?sslmode=verify-full',
  DATABASE_URL_UNPOOLED:
    'postgresql://test:placeholder@ep-example.eu-west-2.aws.neon.tech/test?sslmode=verify-full',
  UPSTASH_REDIS_REST_URL: 'https://example.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test-placeholder',
};
describe('environment validation', () => {
  it('uses a valid port default without requiring future feature credentials', () => {
    expect(parseEnv(valid).PORT).toBe(3000);
  });
  it.each([
    { DATABASE_URL_UNPOOLED: 'not-a-url' },
    { UPSTASH_REDIS_REST_URL: 'not-a-url' },
    { PORT: '0' },
    { PORT: '65536' },
    { UPSTASH_REDIS_REST_URL: 'http://example.upstash.io' },
    { DATABASE_URL: 'postgresql://localhost/test' },
  ])('rejects invalid configuration %j', (override) => {
    expect(() => parseEnv({ ...valid, ...override })).toThrow(
      'Invalid environment configuration',
    );
  });
  it('never includes supplied secrets in validation errors', () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: 'secret-value' })).toThrow(
      /^Invalid environment configuration$/,
    );
  });
});

it('requires complete WhatsApp config when enabled and rejects invalid credentials safely', () => {
  expect(parseEnv(valid).WHATSAPP_ENABLED).toBe(false);
  expect(() => parseEnv({ ...valid, WHATSAPP_ENABLED: 'true' })).toThrow(
    /^Invalid environment configuration$/,
  );
  const whatsapp = {
    WHATSAPP_ENABLED: 'true',
    WHATSAPP_ACCESS_TOKEN: 'synthetic-access-token',
    WHATSAPP_VERIFY_TOKEN: 'synthetic-verify-token',
    WHATSAPP_APP_SECRET: 'synthetic-app-secret',
    WHATSAPP_PHONE_NUMBER_ID: '100000000001',
    WHATSAPP_API_VERSION: 'v25.0',
  };
  expect(parseEnv({ ...valid, ...whatsapp }).WHATSAPP_ENABLED).toBe(true);
  for (const override of [
    { WHATSAPP_API_VERSION: 'v25.0/../evil' },
    { WHATSAPP_PHONE_NUMBER_ID: 'not-a-number' },
    { WHATSAPP_APP_SECRET: '' },
    { WHATSAPP_ACCESS_TOKEN: '' },
    { WHATSAPP_ENABLED: 'yes' },
  ]) {
    expect(() => parseEnv({ ...valid, ...whatsapp, ...override })).toThrow(
      /^Invalid environment configuration$/,
    );
  }
});
