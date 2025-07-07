/// <reference types="vitest/config" />
/// <reference types="../tests/vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      '../tests/setup-env.ts',
      '../client/src/components/sections/__tests__/setup.ts'
    ],
    include: [
      '../tests/component/TermCard.test.tsx',
      '../tests/components/**/*.test.{ts,tsx}',
      '../tests/api/**/*.test.{ts,tsx}',
      '../tests/service-worker/**/*.test.{ts,tsx}',
      '../client/src/types/__tests__/**/*.test.{ts,tsx}',
      '../client/src/components/sections/__tests__/**/*.test.{ts,tsx}'
    ],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'tests/visual/**/*'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../client/src'),
      '@shared': path.resolve(__dirname, '../shared')
    }
  }
});