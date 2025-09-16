import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

const monorepoRoot = resolve(__dirname, '../..');

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    setupFiles: ['src/test/setup.js'],
  },
  resolve: {
    alias: {
      '@atlasit/core': resolve(monorepoRoot, 'packages/core/index.ts'),
      '@atlasit/shared': resolve(monorepoRoot, 'atlasit/shared/src/index.ts'),
    },
  },
});
