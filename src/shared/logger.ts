type Event =
  | 'startup'
  | 'startup_failed'
  | 'shutdown'
  | 'shutdown_failed'
  | 'shutdown_timeout'
  | 'http_request'
  | 'request_failed'
  | 'dependency_failed'
  | 'memory_cache_failed'
  | 'fatal';
type Fields = { requestId?: string; status?: number; durationMs?: number };
export function createLogger(
  write: (line: string) => void = (line) => {
    process.stdout.write(line + '\n');
  },
) {
  return (level: 'info' | 'error', event: Event, fields: Fields = {}) => {
    // Only allowlisted fields are serialized; never serialize errors, URLs or request bodies.
    write(
      JSON.stringify({
        time: new Date().toISOString(),
        level,
        event,
        requestId: fields.requestId,
        status: fields.status,
        durationMs: fields.durationMs,
      }),
    );
  };
}
export type Logger = ReturnType<typeof createLogger>;
