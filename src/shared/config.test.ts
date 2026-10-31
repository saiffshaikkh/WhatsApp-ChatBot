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
