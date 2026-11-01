import { createHmac, timingSafeEqual } from 'node:crypto';
export function validSignature(
  body: Buffer,
  signature: string | undefined,
  secret: string,
) {
  if (!signature || !/^sha256=[a-f0-9]{64}$/.test(signature)) return false;
  return timingSafeEqual(
    createHmac('sha256', secret).update(body).digest(),
    Buffer.from(signature.slice(7), 'hex'),
  );
}
