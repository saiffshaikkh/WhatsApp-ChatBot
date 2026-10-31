import type { Server } from 'node:http';
import type { Logger } from './logger.js';
export async function startServer(
  server: Server,
  port: number,
  check: () => Promise<void>,
  isStopping: () => boolean = () => false,
) {
  server.headersTimeout = 10000;
  server.requestTimeout = 10000;
  await check();
  if (isStopping()) throw new Error('Startup cancelled');
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      reject(error);
    };
    server.once('error', onError);
    server.listen(port, '0.0.0.0', () => {
      server.off('error', onError);
      resolve();
    });
  });
}
export function createShutdown(
  server: Server,
  close: () => Promise<void>,
  markStopping: () => void,
  log: Logger,
  forceExit: () => void,
) {
  let running: Promise<void> | undefined;
  return () => {
    running ??= (async () => {
      markStopping();
      const deadline = setTimeout(() => {
        log('error', 'shutdown_timeout');
        server.closeAllConnections();
        forceExit();
      }, 10000);

      try {
        if (server.listening)
          await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve())),
          );
      } finally {
        try {
          await close();
          log('info', 'shutdown');
        } finally {
          clearTimeout(deadline);
        }
      }
    })();
    return running;
  };
}
