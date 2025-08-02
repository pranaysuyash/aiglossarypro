#!/usr/bin/env node
import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
async function buildServer() {
    try {
        await build({
            entryPoints: [resolve(__dirname, '../server/index.ts')],
            bundle: true,
            platform: 'node',
            format: 'esm',
            outdir: 'dist',
            target: 'node18',
            // Bundle shared dependencies but keep node_modules external
            external: [
                // Node built-ins
                'assert',
                'buffer',
                'child_process',
                'cluster',
                'crypto',
                'dgram',
                'dns',
                'events',
                'fs',
                'http',
                'https',
                'net',
                'os',
                'path',
                'querystring',
                'readline',
                'stream',
                'string_decoder',
                'timers',
                'tls',
                'tty',
                'url',
                'util',
                'v8',
                'vm',
                'zlib',
                // Keep these external
                'pg',
                'redis',
                'ioredis',
                'bullmq',
                '@google-cloud/storage',
                'firebase-admin',
                'aws-sdk',
                '@aws-sdk/*',
                'sharp',
                'canvas',
                'sqlite3',
                'better-sqlite3',
                'mysql2',
                'bcrypt',
                'argon2',
                '@mapbox/node-pre-gyp',
                'nock',
                'mock-aws-s3',
                'swagger-ui-express',
                'swagger-jsdoc',
                // Keep all node_modules external except shared
                './node_modules/*',
                '../node_modules/*',
                '../../node_modules/*',
                // But include shared modules
                '!./shared/*',
                '!../shared/*',
                '!../../shared/*',
                '!@shared/*'
            ],
            alias: {
                '@shared': resolve(__dirname, '../shared'),
                '@server': resolve(__dirname, '../server'),
                '@': resolve(__dirname, '..')
            },
            loader: {
                '.ts': 'ts',
                '.tsx': 'tsx',
                '.js': 'js',
                '.jsx': 'jsx',
                '.json': 'json'
            },
            minify: false,
            sourcemap: true,
            metafile: true,
            logLevel: 'info',
            // Handle ESM properly
            mainFields: ['module', 'main'],
            conditions: ['import', 'require', 'node', 'default'],
            resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.mjs'],
            // Ensure proper module resolution
            absWorkingDir: resolve(__dirname, '..'),
            nodePaths: [resolve(__dirname, '../node_modules')],
            // Keep import.meta.url working
            keepNames: true,
            // Handle __dirname and __filename
            define: {
                'import.meta.url': 'import.meta.url'
            },
            banner: {
                js: `
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
`
            }
        });
        console.log('✅ Server build completed successfully');
    }
    catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}
buildServer();
