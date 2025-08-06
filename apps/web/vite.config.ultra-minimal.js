import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
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
        outDir: '../../dist/public',
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
