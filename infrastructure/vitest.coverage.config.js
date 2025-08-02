/// <reference types="vitest/config" />
import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests/setup.ts'],
        css: true,
        include: [
            'tests/**/*.{test,spec}.{ts,tsx}',
            'client/src/**/*.{test,spec}.{ts,tsx}',
            'server/**/*.{test,spec}.{ts,tsx}',
        ],
        exclude: [
            'node_modules',
            'dist',
            '.idea',
            '.git',
            '.cache',
            'tests/visual/**/*',
            'tests/e2e/**/*',
            '**/*.stories.{ts,tsx}',
            '**/*.d.ts',
            '**/build/**',
            '**/coverage/**',
        ],
        coverage: {
            enabled: true,
            provider: 'v8',
            reporter: ['text', 'text-summary', 'html', 'json', 'lcov', 'clover'],
            reportsDirectory: './coverage',
            clean: true,
            cleanOnRerun: true,
            // Include patterns for coverage analysis
            include: ['client/src/**/*.{ts,tsx}', 'server/**/*.{ts,js}', 'shared/**/*.{ts,js}'],
            // Exclude patterns from coverage
            exclude: [
                'node_modules/**',
                'dist/**',
                'coverage/**',
                '**/*.d.ts',
                '**/*.config.{ts,js}',
                '**/*.stories.{ts,tsx}',
                '**/types/**',
                '**/public/**',
                '**/build/**',
                'tests/**',
                'scripts/**',
                'vite.config*.ts',
                'tailwind.config.js',
                'postcss.config.js',
                'eslint.config.js',
                'playwright.config.ts',
                '.storybook/**',
                // UI components with minimal logic
                'client/src/components/ui/**',
                // Config and setup files
                'client/src/main.tsx',
                'server/vite.ts',
                'server/config/**',
                // Migration and seed files
                'server/migrations/**',
                'server/seed.ts',
                'server/scripts/**',
                // Auto-generated files
                'server/public/**',
                // Third-party integrations
                'server/swagger/**',
                // Utilities with external dependencies
                'server/utils/authUtils.ts',
                'client/src/utils/sentry.ts',
            ],
            // Coverage thresholds
            thresholds: {
                // Global thresholds
                global: {
                    branches: 70,
                    functions: 70,
                    lines: 70,
                    statements: 70,
                },
                // Critical business logic modules - 80% threshold
                'client/src/services/**/*.{ts,tsx}': {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
                'server/services/**/*.{ts,js}': {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
                'client/src/utils/**/*.{ts,tsx}': {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
                'server/utils/**/*.{ts,js}': {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
                'client/src/hooks/**/*.{ts,tsx}': {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
                'server/middleware/**/*.{ts,js}': {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
                // Core application components - 75% threshold
                'client/src/components/!(ui)/**/*.{ts,tsx}': {
                    branches: 75,
                    functions: 75,
                    lines: 75,
                    statements: 75,
                },
                'server/routes/**/*.{ts,js}': {
                    branches: 75,
                    functions: 75,
                    lines: 75,
                    statements: 75,
                },
                'client/src/pages/**/*.{ts,tsx}': {
                    branches: 75,
                    functions: 75,
                    lines: 75,
                    statements: 75,
                },
                // Database and data handling - 80% threshold
                'server/db.ts': {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
                'server/storage.ts': {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
                'server/enhancedStorage.ts': {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
                // AI and ML services - 80% threshold
                'server/aiService.ts': {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
                'client/src/components/AI*.{ts,tsx}': {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
                // Authentication and security - 85% threshold
                'server/auth/**/*.{ts,js}': {
                    branches: 85,
                    functions: 85,
                    lines: 85,
                    statements: 85,
                },
                'server/middleware/security.ts': {
                    branches: 85,
                    functions: 85,
                    lines: 85,
                    statements: 85,
                },
                'server/middleware/firebaseAuth.ts': {
                    branches: 85,
                    functions: 85,
                    lines: 85,
                    statements: 85,
                },
                // Payment and revenue critical paths - 90% threshold
                'server/routes/gumroad.ts': {
                    branches: 90,
                    functions: 90,
                    lines: 90,
                    statements: 90,
                },
                'client/src/components/TestPurchaseButton.tsx': {
                    branches: 90,
                    functions: 90,
                    lines: 90,
                    statements: 90,
                },
                'client/src/components/PurchaseVerification.tsx': {
                    branches: 90,
                    functions: 90,
                    lines: 90,
                    statements: 90,
                },
            },
            // Coverage watermarks for color coding
            watermarks: {
                statements: [70, 80],
                functions: [70, 80],
                branches: [70, 80],
                lines: [70, 80],
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './client/src'),
            '@shared': path.resolve(__dirname, './shared'),
            '@server': path.resolve(__dirname, './server'),
        },
    },
});
