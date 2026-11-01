import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['src/**/*.integration.ts'],
    // These isolated suites share the same remote Neon and Upstash services.
    fileParallelism: false,
    testTimeout: 20000,
  },
});
