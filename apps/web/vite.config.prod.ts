import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [
    react() // SWC handles TypeScript compilation properly
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, '../../packages/shared/dist'),
      '@aiglossarypro/shared': path.resolve(__dirname, '../../packages/shared/dist'),
      '@aiglossarypro/database': path.resolve(__dirname, '../../packages/database/dist'),
      '@aiglossarypro/auth': path.resolve(__dirname, '../../packages/auth/dist'),
      '@aiglossarypro/config': path.resolve(__dirname, '../../packages/config/dist'),
      '@assets': path.resolve(__dirname, '../../attached_assets'),
    },
  },
  build: {
    outDir: '../../dist/public',
    emptyOutDir: true,
    modulePreload: {
      polyfill: true,
      resolveDependencies: (filename, deps, { hostId, hostType }) => {
        // Filter out any TSX/JSX files from modulepreload
        return deps.filter(dep => !dep.endsWith('.tsx') && !dep.endsWith('.jsx'))
      }
    },
    // Explicitly set the input to ensure Vite processes HTML correctly
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
      external: id => {
        return (
          id.includes('.test.') ||
          id.includes('.spec.') ||
          id.includes('.stories.') ||
          id.includes('__tests__') ||
          id.includes('storybook') ||
          id.includes('@storybook')
        );
      },
      output: {
        // Force JS extensions for all chunks
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});