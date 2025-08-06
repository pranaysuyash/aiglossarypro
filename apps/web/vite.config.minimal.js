import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({
    base: '/',
    plugins: [
        react({
            // Use classic JSX runtime to avoid any experimental features
            jsxRuntime: 'classic',
            // Disable Fast Refresh for production builds
            fastRefresh: false,
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@shared': path.resolve(__dirname, '../../packages/shared/dist'),
            '@aiglossarypro/shared': path.resolve(__dirname, '../../packages/shared/dist'),
            '@aiglossarypro/database': path.resolve(__dirname, '../../packages/database/dist'),
            '@aiglossarypro/auth': path.resolve(__dirname, '../../packages/auth/dist'),
            '@aiglossarypro/config': path.resolve(__dirname, '../../packages/config/dist'),
            '@assets': path.resolve(__dirname, '../../attached_assets'),
        },
    },
    build: {
        outDir: path.resolve(__dirname, '../../dist/public'),
        emptyOutDir: true,
        rollupOptions: {
            external: id => {
                return (id.includes('.test.') ||
                    id.includes('.spec.') ||
                    id.includes('.stories.') ||
                    id.includes('__tests__'));
            },
        },
    },
});
