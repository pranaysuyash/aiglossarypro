import path from 'node:path';
import react from '@vitejs/plugin-react';
import million from 'million/compiler';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { lucideTreeShakePlugin } from './client/vite-lucide-plugin';

export default defineConfig({
  plugins: [
    million.vite({ auto: true }), 
    react(),
    lucideTreeShakePlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    })
  ],
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

          // Icons (separate chunk for better caching)
          'vendor-icons': ['lucide-react'],
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
    include: [
      'react', 
      'react-dom',
      // Pre-bundle commonly used lucide icons
      'lucide-react/dist/esm/icons/search',
      'lucide-react/dist/esm/icons/menu',
      'lucide-react/dist/esm/icons/user',
      'lucide-react/dist/esm/icons/home',
      'lucide-react/dist/esm/icons/settings',
      'lucide-react/dist/esm/icons/book-open',
      'lucide-react/dist/esm/icons/heart',
      'lucide-react/dist/esm/icons/star',
      'lucide-react/dist/esm/icons/eye',
      'lucide-react/dist/esm/icons/check',
      'lucide-react/dist/esm/icons/x',
      'lucide-react/dist/esm/icons/arrow-right',
      'lucide-react/dist/esm/icons/chevron-down',
      'lucide-react/dist/esm/icons/loader-2'
    ],
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
