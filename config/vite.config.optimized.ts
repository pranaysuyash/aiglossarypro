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
        manualChunks(id) {
          // React and core libraries
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-core';
          }

          // Router
          if (id.includes('wouter')) {
            return 'router';
          }

          // State management
          if (id.includes('@tanstack/react-query')) {
            return 'query-client';
          }

          // UI Components
          if (id.includes('@radix-ui')) {
            return 'ui-radix';
          }

          // Icons
          if (id.includes('lucide-react')) {
            return 'icons';
          }

          // Charts and visualization - lazy loaded
          if (id.includes('recharts') || id.includes('ComposedChart')) {
            return 'charts';
          }

          // Mermaid diagrams - heavy library
          if (id.includes('mermaid') || id.includes('MermaidDiagram')) {
            return 'mermaid';
          }

          // Code highlighting - heavy library
          if (
            id.includes('katex') ||
            id.includes('prismjs') ||
            id.includes('react-syntax-highlighter') ||
            id.includes('CodeBlock')
          ) {
            return 'syntax-highlighting';
          }

          // Cytoscape - very heavy library
          if (id.includes('cytoscape')) {
            return 'cytoscape';
          }

          // Forms
          if (id.includes('react-hook-form') || id.includes('@hookform')) {
            return 'forms';
          }

          // Animation
          if (id.includes('framer-motion')) {
            return 'animation';
          }

          // Date utilities
          if (id.includes('date-fns')) {
            return 'date-utils';
          }

          // Firebase - heavy library
          if (id.includes('firebase')) {
            return 'firebase';
          }

          // Admin pages - lazy loaded
          if (id.includes('/Admin') || id.includes('AdminPage')) {
            return 'admin-pages';
          }

          // Landing page components
          if (id.includes('LandingPage')) {
            return 'landing-page';
          }

          // Legal pages
          if (id.includes('PrivacyPolicy') || id.includes('TermsOfService')) {
            return 'legal-pages';
          }

          // Other vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimized chunk naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: assetInfo => {
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
      // Enhanced tree shaking
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },
    // Performance optimizations
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
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
