import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// CDN Configuration
const CDN_CONFIG = {
  // Cloudflare CDN Configuration
  cloudflare: {
    baseUrl: process.env.CLOUDFLARE_CDN_URL || 'https://cdn.aiglossarypro.com',
    enabled: process.env.USE_CLOUDFLARE_CDN === 'true',
    zones: {
      assets: '/assets/',
      images: '/images/',
      fonts: '/fonts/',
    },
  },
  // AWS CloudFront Configuration
  cloudfront: {
    baseUrl: process.env.CLOUDFRONT_CDN_URL || 'https://d1234567890.cloudfront.net',
    enabled: process.env.USE_CLOUDFRONT_CDN === 'true',
    zones: {
      assets: '/assets/',
      images: '/images/',
      fonts: '/fonts/',
    },
  },
  // Fallback to local serving
  local: {
    baseUrl: '',
    enabled: !process.env.USE_CLOUDFLARE_CDN && !process.env.USE_CLOUDFRONT_CDN,
    zones: {
      assets: '/assets/',
      images: '/images/',
      fonts: '/fonts/',
    },
  },
};

// Determine active CDN configuration
const getActiveCDN = () => {
  if (CDN_CONFIG.cloudflare.enabled) return CDN_CONFIG.cloudflare;
  if (CDN_CONFIG.cloudfront.enabled) return CDN_CONFIG.cloudfront;
  return CDN_CONFIG.local;
};

const activeCDN = getActiveCDN();
const isProd = process.env.NODE_ENV === 'production';
const useCDN = isProd && (CDN_CONFIG.cloudflare.enabled || CDN_CONFIG.cloudfront.enabled);

// CDN Asset URL Builder
const buildCDNUrl = (assetPath: string) => {
  if (!useCDN) return assetPath;

  // Don't modify absolute URLs
  if (assetPath.startsWith('http')) return assetPath;

  // Build CDN URL
  const cdnBase = activeCDN.baseUrl.replace(/\/$/, '');
  const cleanPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;

  return `${cdnBase}${cleanPath}`;
};

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

  // CDN Configuration
  base: useCDN ? activeCDN.baseUrl : '/',

  define: {
    // Make CDN config available at runtime
    __CDN_CONFIG__: JSON.stringify({
      enabled: useCDN,
      baseUrl: activeCDN.baseUrl,
      zones: activeCDN.zones,
      provider: CDN_CONFIG.cloudflare.enabled
        ? 'cloudflare'
        : CDN_CONFIG.cloudfront.enabled
          ? 'cloudfront'
          : 'local',
    }),
    __PRODUCTION__: JSON.stringify(isProd),
  },

  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,

    // CDN-optimized build settings
    assetsDir: 'assets',
    assetsInlineLimit: 4096, // Inline small assets

    // Production optimizations
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: !isProd, // No sourcemaps in production for CDN
    reportCompressedSize: false,
    chunkSizeWarningLimit: 500, // Stricter limits for CDN optimization

    // Rollup options for CDN optimization
    rollupOptions: {
      ...((useCDN && {
        external: [
          // External CDN resources can be added here
          // 'react', 'react-dom' // Example: if using React from CDN
        ],
        output: {
          paths: {
            // Map external modules to CDN URLs
            // 'react': 'https://unpkg.com/react@18/umd/react.production.min.js'
          },
        },
      }) ||
        {}),
    },
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

  // Preview server configuration (for testing CDN setup)
  preview: {
    port: 4173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  // Experimental features for CDN optimization
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      // Custom URL building for CDN assets
      if (hostType === 'js' && useCDN) {
        return buildCDNUrl(filename);
      }
      return { relative: true };
    },
  },

  // CSS optimization for CDN
  css: {
    postcss: {
      plugins: [
        // Add PostCSS plugins for CDN optimization
        ...(isProd
          ? [
              require('autoprefixer'),
              require('cssnano')({
                preset: [
                  'default',
                  {
                    discardComments: { removeAll: true },
                    normalizeWhitespace: true,
                    minifyFontValues: true,
                    minifySelectors: true,
                  },
                ],
              }),
            ]
          : []),
      ],
    },
  },

  // Optimizations for CDN delivery
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'lucide-react',
      'clsx',
      'tailwind-merge',
    ],
    exclude: [
      // Exclude heavy libraries from pre-bundling for better chunking
      'recharts',
      'mermaid',
      'cytoscape',
      'katex',
    ],
  },
});
