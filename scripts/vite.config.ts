import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'client', 'src'),
      '@shared': path.resolve(import.meta.dirname, 'shared'),
      '@assets': path.resolve(import.meta.dirname, 'attached_assets'),
    },
  },
  root: path.resolve(import.meta.dirname, 'client'),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries
          react: ['react', 'react-dom'],
          // Router and state management
          router: ['wouter', '@tanstack/react-query'],
          // UI component libraries
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
          ],
          // Icons and utilities
          utils: ['lucide-react', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          // Analytics and other vendor libs
          vendor: ['posthog-js', 'next-themes', 'date-fns', 'dompurify'],
          // Charts (heavy library)
          charts: ['recharts'],
          // Code syntax highlighting (heavy library)
          katex: ['katex'],
          // Mermaid diagrams (heavy library)
          mermaid: ['mermaid'],
          // Cytoscape (heavy library)
          cytoscape: ['cytoscape'],
        },
        // Optimized chunk naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || 'asset';
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(name)) {
            return `assets/images/[name]-[hash].[ext]`;
          }
          if (/\.(css)$/i.test(name)) {
            return `assets/css/[name]-[hash].[ext]`;
          }
          return `assets/[name]-[hash].[ext]`;
        },
      },
    },
    // Performance optimizations
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 700, // Increased for heavy libraries like mermaid, cytoscape
    sourcemap: false, // Disable for production
    reportCompressedSize: false,
    assetsInlineLimit: 4096,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
