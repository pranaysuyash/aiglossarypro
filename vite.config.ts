import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import million from "million/compiler";
import path from "path";

export default defineConfig({
  plugins: [
    million.vite({ auto: true }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Improved chunk splitting for better caching and loading
          if (id.includes('node_modules')) {
            // Core React libraries - critical path
            if (id.includes('react') || id.includes('wouter')) {
              return 'react-core';
            }
            
            // Query/State management libraries
            if (id.includes('@tanstack/react-query') || id.includes('zustand')) {
              return 'state-management';
            }
            
            // UI Component libraries
            if (id.includes('@radix-ui')) {
              return 'ui-components';
            }
            
            // Icon libraries
            if (id.includes('lucide-react') || id.includes('@heroicons')) {
              return 'icons';
            }
            
            // Heavy/optional libraries - separate chunks for lazy loading
            if (id.includes('recharts') || id.includes('cytoscape') || id.includes('d3')) {
              return 'charts';
            }
            
            if (id.includes('mermaid') || id.includes('katex') || id.includes('react-markdown')) {
              return 'content-rendering';
            }
            
            // Form libraries
            if (id.includes('react-hook-form') || id.includes('@hookform')) {
              return 'forms';
            }
            
            // Other vendor code
            return 'vendor';
          }
          
          // Application code chunking
          if (id.includes('/components/landing/')) {
            return 'landing';
          }
          
          if (id.includes('/components/admin/') || id.includes('/components/AIAdmin')) {
            return 'admin';
          }
          
          // Keep core app code together
          return undefined;
        },
        // Optimized chunk naming with content hashing
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || 'asset';
          const info = name.split('.');
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
      external: (id) => {
        return id.startsWith('node:');
      },
    },
    // Optimized build settings for performance
    target: 'es2022',
    minify: 'esbuild',
    cssMinify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500, // Smaller chunks for better loading
    sourcemap: process.env.NODE_ENV !== 'production',
    reportCompressedSize: false, // Faster builds
    // Add compression and optimization
    assetsInlineLimit: 4096, // Inline small assets
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
