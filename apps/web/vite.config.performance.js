import path from 'node:path';
import react from '@vitejs/plugin-react';
import million from 'million/compiler';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';
import viteImagemin from 'vite-plugin-imagemin';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
    plugins: [
        million.vite({ auto: true }),
        react(),
        // Bundle analyzer
        visualizer({
            filename: './dist/bundle-stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
        }),
        // Compression
        viteCompression({
            algorithm: 'brotliCompress',
            ext: '.br',
            threshold: 1024,
        }),
        viteCompression({
            algorithm: 'gzip',
            ext: '.gz',
            threshold: 1024,
        }),
        // PWA
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'AI/ML Glossary Pro',
                short_name: 'AI Glossary',
                description: 'Comprehensive AI/ML terms and concepts glossary',
                theme_color: '#000000',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    {
                        src: '/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: '/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/api\./i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24, // 24 hours
                            },
                            cacheableResponse: {
                                statuses: [0, 200],
                            },
                        },
                    },
                    {
                        urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'image-cache',
                            expiration: {
                                maxEntries: 100,
                                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                            },
                        },
                    },
                    {
                        urlPattern: /\.(woff|woff2|ttf|eot)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'font-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                            },
                        },
                    },
                ],
            },
        }),
        // Image optimization
        viteImagemin({
            gifsicle: {
                optimizationLevel: 7,
                interlaced: false,
            },
            optipng: {
                optimizationLevel: 7,
            },
            mozjpeg: {
                quality: 80,
            },
            pngquant: {
                quality: [0.8, 0.9],
                speed: 4,
            },
            svgo: {
                plugins: [
                    {
                        name: 'removeViewBox',
                    },
                    {
                        name: 'removeEmptyAttrs',
                        active: false,
                    },
                ],
            },
            webp: {
                quality: 80,
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'client', 'src'),
            '@shared': path.resolve(__dirname, 'shared'),
            '@assets': path.resolve(__dirname, 'attached_assets'),
        },
    },
    root: path.resolve(__dirname, 'client'),
    build: {
        outDir: path.resolve(__dirname, 'dist/public'),
        emptyOutDir: true,
        target: 'esnext',
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
                pure_funcs: ['console.log', 'console.info', 'console.debug'],
            },
        },
        cssMinify: true,
        reportCompressedSize: false,
        chunkSizeWarningLimit: 1500,
        rollupOptions: {
            output: {
                manualChunks: id => {
                    // Core vendor chunks
                    if (id.includes('node_modules')) {
                        // React ecosystem (critical)
                        if (id.includes('react') ||
                            id.includes('react-dom') ||
                            id.includes('react-router') ||
                            id.includes('wouter')) {
                            return 'vendor-react';
                        }
                        // UI framework (high priority)
                        if (id.includes('@radix-ui') || id.includes('cmdk') || id.includes('vaul')) {
                            return 'vendor-ui';
                        }
                        // Firebase (auth critical)
                        if (id.includes('firebase')) {
                            return 'vendor-firebase';
                        }
                        // State management
                        if (id.includes('@tanstack/react-query') || id.includes('zustand')) {
                            return 'vendor-state';
                        }
                        // Charts (medium priority)
                        if (id.includes('recharts') || id.includes('d3')) {
                            return 'vendor-charts';
                        }
                        // 3D/WebXR (low priority, lazy loaded)
                        if (id.includes('three') || id.includes('@react-three') || id.includes('webxr')) {
                            return 'vendor-3d';
                        }
                        // Code highlighting (lazy loaded)
                        if (id.includes('prism') ||
                            id.includes('react-syntax-highlighter') ||
                            id.includes('highlight.js')) {
                            return 'vendor-code';
                        }
                        // Diagrams (lazy loaded)
                        if (id.includes('mermaid') || id.includes('cytoscape')) {
                            return 'vendor-diagrams';
                        }
                        // Icons
                        if (id.includes('lucide-react') || id.includes('react-icons')) {
                            return 'vendor-icons';
                        }
                        // Forms
                        if (id.includes('react-hook-form') || id.includes('@hookform')) {
                            return 'vendor-forms';
                        }
                        // Utilities
                        if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
                            return 'vendor-utils';
                        }
                        // Markdown/Content
                        if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) {
                            return 'vendor-markdown';
                        }
                        // Animation
                        if (id.includes('framer-motion') || id.includes('react-spring')) {
                            return 'vendor-animation';
                        }
                        // Math (specialized)
                        if (id.includes('katex') || id.includes('mathjax')) {
                            return 'vendor-math';
                        }
                    }
                    // Application chunks by feature
                    if (id.includes('src/pages')) {
                        const pageName = id.split('/pages/')[1].split('/')[0].replace('.tsx', '');
                        // Group related pages
                        if (['Admin', 'Analytics', 'Dashboard'].includes(pageName)) {
                            return 'pages-admin';
                        }
                        if (['3DVisualization', 'ARViewer', 'VRViewer'].includes(pageName)) {
                            return 'pages-3d';
                        }
                        if (['AISearch', 'AITools', 'ModelComparison'].includes(pageName)) {
                            return 'pages-ai';
                        }
                        if (['LearningPaths', 'LearningPathDetail', 'Progress'].includes(pageName)) {
                            return 'pages-learning';
                        }
                        return `page-${pageName.toLowerCase()}`;
                    }
                    // Component chunks
                    if (id.includes('src/components')) {
                        if (id.includes('charts') || id.includes('visualizations')) {
                            return 'components-charts';
                        }
                        if (id.includes('forms')) {
                            return 'components-forms';
                        }
                        if (id.includes('ui/')) {
                            return 'components-ui';
                        }
                    }
                },
                // Optimize chunk file names
                chunkFileNames: chunkInfo => {
                    const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId : 'chunk';
                    if (facadeModuleId.includes('node_modules')) {
                        return 'js/vendor/[name]-[hash].js';
                    }
                    return 'js/[name]-[hash].js';
                },
                entryFileNames: 'js/[name]-[hash].js',
                assetFileNames: assetInfo => {
                    const info = assetInfo.name.split('.');
                    const ext = info[info.length - 1];
                    if (/png|jpe?g|svg|gif|webp|tiff|bmp|ico/i.test(ext)) {
                        return `images/[name]-[hash][extname]`;
                    }
                    else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
                        return `fonts/[name]-[hash][extname]`;
                    }
                    else if (ext === 'css') {
                        return `css/[name]-[hash][extname]`;
                    }
                    return `assets/[name]-[hash][extname]`;
                },
            },
            // Aggressive tree shaking
            treeshake: {
                moduleSideEffects: false,
                propertyReadSideEffects: false,
                unknownGlobalSideEffects: false,
            },
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'wouter', '@tanstack/react-query'],
        exclude: [
            'three',
            '@react-three/fiber',
            '@react-three/drei',
            'mermaid',
            'cytoscape',
            'katex',
            'prismjs',
            'react-syntax-highlighter',
        ],
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
