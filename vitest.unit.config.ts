/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup-env.ts'],
    include: [
      'tests/components/**/*.test.{ts,tsx}',
      'tests/api/**/*.test.{ts,tsx}',
      'tests/service-worker/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
      'client/src/components/**/__tests__/**/*.test.{ts,tsx}',
    ],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'tests/visual/**/*'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});
