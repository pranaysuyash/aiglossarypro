import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
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
    build: {
        outDir: path.resolve(import.meta.dirname, 'dist/public'),
        emptyOutDir: true,
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
