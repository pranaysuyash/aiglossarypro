import path from 'node:path';
import react from '@vitejs/plugin-react';
import million from 'million/compiler';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [million.vite({ auto: true }), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
    },
  },
  root: path.resolve(__dirname, 'client'),
  build: {
    outDir: path.resolve(__dirname, 'dist/public'),
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    reportCompressedSize: false, // Faster builds
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries (critical path)
          'vendor-react': ['react', 'react-dom', 'react-hook-form'],

          // UI framework (high priority)
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-slider',
            '@radix-ui/react-scroll-area',
          ],

          // Firebase and auth (separate for caching)
          'vendor-firebase': ['firebase/app', 'firebase/auth'],

          // Chart libraries (medium priority)
          'vendor-charts': ['recharts'],

          // 3D visualization (lazy loaded, lowest priority)
          'vendor-3d': ['three', '@react-three/fiber', '@react-three/drei'],

          // Code editor and syntax highlighting (lazy loaded)
          'vendor-editor': ['react-syntax-highlighter'],

          // Diagram libraries (lazy loaded)
          'vendor-diagrams': ['mermaid', 'cytoscape'],

          // Query and state management
          'vendor-query': ['@tanstack/react-query'],

          // Utilities (small but frequent)
          'vendor-utils': ['date-fns', 'dompurify'],

          // Math and formatting (specialized)
          'vendor-math': ['katex'],
        },
        // Optimize chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.facadeModuleId?.includes('node_modules')) {
            return 'vendor/[name]-[hash].js';
          }
          return 'chunks/[name]-[hash].js';
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/styles/[name]-[hash].css';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['three', 'mermaid', 'cytoscape', 'katex'], // Heavy libs that should be lazy loaded
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
