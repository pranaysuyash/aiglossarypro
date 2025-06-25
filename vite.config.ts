import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
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
          // Custom function for more granular chunk splitting
          
          // Node modules chunking
          if (id.includes('node_modules')) {
            // Core React libraries
            if (id.includes('react') || id.includes('wouter')) {
              return 'react-vendor';
            }
            
            // Large UI libraries
            if (id.includes('@radix-ui')) {
              return 'ui-components';
            }
            
            // Heavy visualization libraries
            if (id.includes('recharts') || id.includes('cytoscape') || id.includes('d3')) {
              return 'charts';
            }
            
            // Mathematical and diagram libraries
            if (id.includes('mermaid')) {
              return 'diagrams';
            }
            if (id.includes('katex')) {
              return 'math';
            }
            
            // Content processing
            if (id.includes('react-markdown') || id.includes('react-syntax-highlighter') || id.includes('prismjs')) {
              return 'content';
            }
            
            // Data utilities
            if (id.includes('exceljs') || id.includes('date-fns') || id.includes('lodash')) {
              return 'data-utils';
            }
            
            // Query management
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            
            // Icons
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            
            // Everything else from node_modules
            return 'vendor';
          }
          
          // Application code chunking
          if (id.includes('/pages/')) {
            // Split each page into its own chunk
            const pageName = id.split('/pages/')[1].split('.')[0].toLowerCase();
            return `page-${pageName}`;
          }
          
          if (id.includes('/components/lazy/')) {
            return 'lazy-components';
          }
          
          if (id.includes('/components/interactive/')) {
            return 'interactive-components';
          }
          
          if (id.includes('/components/ui/')) {
            return 'ui-shared';
          }
          
          // Main application chunk for everything else
          return 'main';
        },
        // Ensure consistent chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
      // Tree shaking and optimization
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
      external: (id) => {
        // Don't bundle node built-ins in client code
        return id.startsWith('node:');
      },
    },
    // Optimize build settings
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    chunkSizeWarningLimit: 800, // Reduced warning limit for better optimization
    sourcemap: process.env.NODE_ENV !== 'production',
  },
});
