import express, { Router, type ErrorRequestHandler } from 'express';
import { z } from 'zod';
import type { WhatsAppConfig } from './config.js';
import { validSignature } from './security.js';
import { normalizeWebhook, type IncomingMessage } from './schemas.js';
import type { Logger } from '../../shared/logger.js';

const verificationSchema = z.object({
  'hub.mode': z.literal('subscribe'),
  'hub.verify_token': z.string().max(256),
  'hub.challenge': z.string().min(1).max(256),
});
export type WhatsAppTransport = {
  config: WhatsAppConfig;
  accept: (messages: IncomingMessage[]) => Promise<void>;
};
export function whatsappRouter(
  { config, accept }: WhatsAppTransport,
  log: Logger,
) {
  const router = Router();
  router.get('/webhooks/whatsapp', (req, res) => {
    const query = verificationSchema.safeParse(req.query);
    if (
      !query.success ||
      query.data['hub.verify_token'] !== config.WHATSAPP_VERIFY_TOKEN
    ) {
      res.sendStatus(403);
      return;
    }
    res.status(200).type('text/plain').send(query.data['hub.challenge']);
  });
  router.post(
    '/webhooks/whatsapp',
    express.raw({ type: 'application/json', limit: '256kb', inflate: false }),
    async (req, res) => {
      if (
        !Buffer.isBuffer(req.body) ||
        !validSignature(
          req.body,
          req.get('x-hub-signature-256'),
          config.WHATSAPP_APP_SECRET,
        )
      ) {
        log('info', 'whatsapp_rejected', {
          requestId: res.locals.requestId as string,
        });
        res.sendStatus(401);
        return;
      }
      let messages: IncomingMessage[];
      try {
        messages = normalizeWebhook(
          JSON.parse(req.body.toString('utf8')),
          config.WHATSAPP_PHONE_NUMBER_ID,
        );
      } catch {
        res.sendStatus(400);
        return;
      }
      await accept(messages);
      res.sendStatus(200);
    },
  );
  const invalidBody: ErrorRequestHandler = (
    error: unknown,
    _req,
    res,
    next,
  ) => {
    const status = z.object({ status: z.number() }).safeParse(error);
    if (status.success && [400, 413, 415].includes(status.data.status)) {
      res.sendStatus(status.data.status);
      return;
    }
    next(error);
  };
  router.use(invalidBody);
  return router;
}
