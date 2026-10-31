import { z } from 'zod';
const neonUrl = z.url().refine((value) => {
  if (!URL.canParse(value)) return false;
  const url = new URL(value);
  return (
    ['postgres:', 'postgresql:'].includes(url.protocol) &&
    url.hostname.endsWith('.neon.tech') &&
    url.searchParams.get('sslmode') === 'verify-full' &&
    Boolean(url.username && url.password)
  );
});
const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: neonUrl,
  DATABASE_URL_UNPOOLED: neonUrl.refine(
    (value) =>
      !URL.canParse(value) || !new URL(value).hostname.includes('-pooler.'),
  ),
  UPSTASH_REDIS_REST_URL: z.url().refine((value) => {
    if (!URL.canParse(value)) return false;
    const u = new URL(value);
    return (
      u.protocol === 'https:' &&
      u.hostname.endsWith('.upstash.io') &&
      !u.username &&
      !u.password &&
      !u.search &&
      u.pathname === '/'
    );
  }),
  UPSTASH_REDIS_REST_TOKEN: z.string().trim().min(1),
});
export function parseEnv(input: NodeJS.ProcessEnv) {
  const result = schema.safeParse(input);
  if (!result.success) throw new Error('Invalid environment configuration');
  return result.data;
}
export type Config = ReturnType<typeof parseEnv>;
