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
          // Only split if modules actually exist and are large enough
          if (id.includes('node_modules')) {
            // Core React libraries - always present
            if (id.includes('react') || id.includes('wouter') || id.includes('@tanstack/react-query')) {
              return 'vendor';
            }
            
            // UI libraries - only if they exist
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'vendor';
            }
            
            // Heavy libraries - lazy load these
            if (id.includes('recharts') || id.includes('cytoscape') || id.includes('d3') || 
                id.includes('mermaid') || id.includes('katex') || id.includes('react-markdown')) {
              return 'vendor';
            }
            
            return 'vendor';
          }
          
          // Keep application code together for better caching
          return undefined;
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
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
