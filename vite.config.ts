import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import million from 'million/compiler';

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
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries
          'vendor-react': ['react', 'react-dom', 'react-hook-form'],

          // UI framework
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-slider',
            '@radix-ui/react-scroll-area',
          ],

          // Firebase and auth
          'vendor-firebase': ['firebase/app', 'firebase/auth'],

          // Chart libraries
          'vendor-charts': ['recharts'],

          // 3D visualization (lazy loaded)
          'vendor-3d': ['three', '@react-three/fiber', '@react-three/drei'],

          // Code editor and syntax highlighting
          'vendor-editor': ['react-syntax-highlighter'],

          // Diagram libraries
          'vendor-diagrams': ['mermaid', 'cytoscape'],

          // Query and state management
          'vendor-query': ['@tanstack/react-query'],

          // Utilities
          'vendor-utils': ['date-fns', 'dompurify'],

          // Math and formatting
          'vendor-math': ['katex'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: 'esbuild',
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
