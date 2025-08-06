import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [
        react({
            jsxRuntime: 'automatic',
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    build: {
        outDir: '../../dist/public',
        emptyOutDir: true,
        // Force target to ensure proper compilation
        target: 'es2015',
        // Ensure proper module format
        rollupOptions: {
            output: {
                // Force JS extensions
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
    },
});
