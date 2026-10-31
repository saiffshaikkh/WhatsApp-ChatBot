import { createServer } from 'node:http';
import { createApp } from './app.js';
import { parseEnv } from './shared/config.js';
import { createConnections } from './shared/connections.js';
import { createLogger } from './shared/logger.js';
import { createShutdown, startServer } from './shared/lifecycle.js';
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
  const server = createServer(
    createApp({ check: connections.check, isStopping: () => stopping }, log),
  );
  shutdown = createShutdown(
    server,
    connections.close,
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
  await startServer(server, config.PORT, connections.check, () => stopping);
  if (stopping)
    await new Promise<void>((resolve) => server.close(() => resolve()));
  else log('info', 'startup');
} catch {
  log('error', 'startup_failed');
  process.exitCode = 1;
  try {
    await shutdown?.();
  } catch {
    log('error', 'shutdown_failed');
  }
}
