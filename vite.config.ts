import path from 'node:path';
import react from '@vitejs/plugin-react';
import million from 'million/compiler';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import { devToolsPlugin } from './client/vite-dev-tools-plugin';
import { lucideTreeShakePlugin } from './client/vite-lucide-plugin';

export default defineConfig({
  plugins: [
    million.vite({
      auto: {
        threshold: 0.05,
        skip: [
          'ExitIntentPopup',
          'FloatingPricingWidget',
          'TrustBadges',
          'MediaLogos',
          'LandingHeader',
          'useCountryPricing',
          'useExperiment',
          'ComparisonTable',
          'Pricing',
        ],
      },
    }),
    react(),
    lucideTreeShakePlugin(),
    // Enhanced development tools (only in development)
    ...(process.env.NODE_ENV === 'development'
      ? [
          devToolsPlugin({
            enableErrorOverlay: true,
            enablePerformanceMonitoring: true,
            enableSourceMapOptimization: true,
            errorOverlayPosition: 'center',
          }),
        ]
      : []),
    // Bundle compression for production
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // Only compress files larger than 1KB
      deleteOriginFile: false,
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false,
    }),
    // Bundle analyzer (only in analyze mode)
    ...(process.env.NODE_ENV === 'analyze'
      ? [
          visualizer({
            filename: 'dist/bundle-analysis.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
            template: 'treemap', // 'treemap', 'sunburst', 'network'
          }),
        ]
      : []),
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
    }),
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
    cssCodeSplit: true, // Enable CSS code splitting
    reportCompressedSize: false, // Faster builds
    chunkSizeWarningLimit: 1000,
    // Enhanced source map generation for better debugging
    sourcemap: process.env.NODE_ENV === 'development' ? true : false,
    rollupOptions: {
      external: id => {
        // Exclude test and story files from build
        return (
          id.includes('.test.') ||
          id.includes('.spec.') ||
          id.includes('.stories.') ||
          id.includes('__tests__')
        );
      },
      output: {
        manualChunks: id => {
          // React core libraries (critical path)
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-hook-form')) {
            return 'vendor-react';
          }

          // UI framework (high priority)
          if (id.includes('@radix-ui')) {
            return 'vendor-ui';
          }

          // Firebase and auth (separate for caching)
          if (id.includes('firebase')) {
            return 'vendor-firebase';
          }

          // Chart libraries (medium priority)
          if (id.includes('recharts')) {
            return 'vendor-charts';
          }

          // 3D visualization (lazy loaded, lowest priority)
          if (id.includes('three') || id.includes('@react-three')) {
            return 'vendor-3d';
          }

          // Code editor and syntax highlighting (lazy loaded)
          if (id.includes('react-syntax-highlighter') || id.includes('prismjs')) {
            return 'vendor-editor';
          }

          // Diagram libraries (lazy loaded)
          if (id.includes('mermaid') || id.includes('cytoscape')) {
            return 'vendor-diagrams';
          }

          // Query and state management
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }

          // Utilities (small but frequent)
          if (id.includes('date-fns') || id.includes('dompurify')) {
            return 'vendor-utils';
          }

          // Math and formatting (specialized)
          if (id.includes('katex')) {
            return 'vendor-math';
          }

          // Icons (separate chunk for better caching)
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }

          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor-other';
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: chunkInfo => {
          if (chunkInfo.facadeModuleId?.includes('node_modules')) {
            return 'vendor/[name]-[hash].js';
          }
          return 'chunks/[name]-[hash].js';
        },
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: assetInfo => {
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
      'lucide-react', // Keep main lucide-react for broad usage
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
    // Enhanced development server configuration
    hmr: {
      overlay: true, // Show error overlay in development
    },
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/logs/**',
        '**/.git/**',
        '**/.vscode/**',
        '**/cache/**',
        '**/tmp/**',
        '**/temp/**',
        '**/artifacts/**',
        '**/reports/**',
        '**/test-results/**',
        '**/playwright-report/**',
        '**/coverage/**',
      ],
    },
    // Better error reporting
    fs: {
      strict: false, // Allow serving files from outside root
    },
  },
  // Enhanced development configuration
  esbuild: {
    // Better source map support for debugging
    sourcemap: process.env.NODE_ENV === 'development',
    // Keep function names for better debugging
    keepNames: process.env.NODE_ENV === 'development',
  },
});
