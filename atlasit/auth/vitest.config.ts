import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    environment: 'node',
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@atlasit/shared': resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
