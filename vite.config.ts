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
        manualChunks: {
          // Core React bundle
          'react-vendor': ['react', 'react-dom', 'react-router-dom', 'wouter'],
          
          // UI Components - Large shadcn/ui bundle
          'ui-components': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
          ],
          
          // Charts and visualizations - Heavy components
          'charts': ['recharts', 'cytoscape'],
          
          // Mathematical notation - KaTeX is heavy
          'math': ['katex'],
          
          // Diagrams - Mermaid is large
          'diagrams': ['mermaid'],
          
          // Data handling
          'data-utils': ['exceljs', 'date-fns'],
          
          // Query and state management
          'query': ['@tanstack/react-query'],
          
          // Icons - Lucide React
          'icons': ['lucide-react'],
          
          // Markdown and syntax highlighting
          'content': ['react-markdown', 'react-syntax-highlighter', 'prismjs'],
        },
        // Ensure consistent chunk naming
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000, // Warn for chunks > 1MB
    // Enable source maps for production debugging
    sourcemap: process.env.NODE_ENV !== 'production',
  },
});
