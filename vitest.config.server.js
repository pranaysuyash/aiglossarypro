import { defineConfig } from 'vitest/config';
import path from 'path';
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: [
            'server/**/*.test.ts',
            'server/**/*.spec.ts'
        ],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*'
        ],
        setupFiles: [],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'tests/',
                '**/*.d.ts',
                '**/*.test.ts',
                '**/*.spec.ts',
                '**/types/**',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
