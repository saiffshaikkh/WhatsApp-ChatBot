import { createServer } from 'node:http';
import { createApp } from './app.js';
import { parseEnv } from './shared/config.js';
import { createConnections } from './shared/connections.js';
import { createLogger } from './shared/logger.js';
import { createShutdown, startServer } from './shared/lifecycle.js';
import { whatsappConfigSchema } from './features/whatsapp/config.js';
import { createWhatsAppClient } from './features/whatsapp/client.js';
import { createWhatsAppRepository } from './features/whatsapp/repository.js';
import {
  createWhatsAppWorkflow,
  startWhatsAppWorker,
} from './features/whatsapp/workflow.js';
const log = createLogger();
let stopping = false;
let shutdown: (() => Promise<void>) | undefined;
function fail() {
  log('error', 'fatal');
  process.exitCode = 1;
  void shutdown?.().catch(() => {
    log('error', 'shutdown_failed');
  });
}
try {
  const config = parseEnv(process.env);
  const connections = createConnections(config);
  const whatsappConfig = config.WHATSAPP_ENABLED
    ? whatsappConfigSchema.parse(config)
    : undefined;
  const workflow = whatsappConfig
    ? createWhatsAppWorkflow(
        createWhatsAppRepository(
          connections.db,
          whatsappConfig.WHATSAPP_PHONE_NUMBER_ID,
        ),
        createWhatsAppClient(whatsappConfig),
        log,
      )
    : undefined;
  const check = async () => {
    await connections.check();
    if (whatsappConfig)
      await connections.db.whatsAppDelivery.findFirst({ select: { id: true } });
  };
  let stopWorker: (() => Promise<void>) | undefined;
  const server = createServer(
    createApp(
      { check, isStopping: () => stopping },
      log,
      whatsappConfig && workflow
        ? { config: whatsappConfig, accept: workflow.accept }
        : undefined,
    ),
  );
  shutdown = createShutdown(
    server,
    async () => {
      await stopWorker?.();
      await connections.close();
    },
    () => {
      stopping = true;
    },
    log,
    () => process.exit(1),
  );
  process.on('SIGINT', () => {
    void shutdown?.().catch(fail);
  });
  process.on('SIGTERM', () => {
    void shutdown?.().catch(fail);
  });
  process.on('uncaughtException', fail);
  process.on('unhandledRejection', fail);
  await startServer(server, config.PORT, check, () => stopping);
  if (stopping)
    await new Promise<void>((resolve) => server.close(() => resolve()));
  else {
    if (workflow) stopWorker = startWhatsAppWorker(workflow, log);
    log('info', 'startup');
  }
} catch {
  log('error', 'startup_failed');
  process.exitCode = 1;
  try {
    await shutdown?.();
  } catch {
    log('error', 'shutdown_failed');
  }
}
