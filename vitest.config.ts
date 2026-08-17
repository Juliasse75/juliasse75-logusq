import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['tests/**/*.spec.ts', 'node_modules', 'dist'],
  },
});

