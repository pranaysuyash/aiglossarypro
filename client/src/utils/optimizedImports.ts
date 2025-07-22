/**
 * Optimized import utilities for reducing bundle size
 * Provides tree-shaking friendly imports and dynamic loading
 */

// Optimized Lucide icon imports (tree-shaken)
export const Icons = {
    // Core icons (always loaded)
    Search: () => import('lucide-react/dist/esm/icons/search').then(m => m.Search),
    Menu: () => import('lucide-react/dist/esm/icons/menu').then(m => m.Menu),
    X: () => import('lucide-react/dist/esm/icons/x').then(m => m.X),
    ChevronDown: () => import('lucide-react/dist/esm/icons/chevron-down').then(m => m.ChevronDown),
    ChevronRight: () => import('lucide-react/dist/esm/icons/chevron-right').then(m => m.ChevronRight),
    User: () => import('lucide-react/dist/esm/icons/user').then(m => m.User),
    Settings: () => import('lucide-react/dist/esm/icons/settings').then(m => m.Settings),

    // Admin icons (lazy loaded)
    BarChart3: () => import('lucide-react/dist/esm/icons/bar-chart-3').then(m => m.BarChart3),
    TrendingUp: () => import('lucide-react/dist/esm/icons/trending-up').then(m => m.TrendingUp),
    TrendingDown: () => import('lucide-react/dist/esm/icons/trending-down').then(m => m.TrendingDown),
    DollarSign: () => import('lucide-react/dist/esm/icons/dollar-sign').then(m => m.DollarSign),
    FileText: () => import('lucide-react/dist/esm/icons/file-text').then(m => m.FileText),
    Bot: () => import('lucide-react/dist/esm/icons/bot').then(m => m.Bot),
    Sparkles: () => import('lucide-react/dist/esm/icons/sparkles').then(m => m.Sparkles),

    // 3D and visualization icons (lazy loaded)
    Box: () => import('lucide-react/dist/esm/icons/box').then(m => m.Box),
    Layers: () => import('lucide-react/dist/esm/icons/layers').then(m => m.Layers),
    Zap: () => import('lucide-react/dist/esm/icons/zap').then(m => m.Zap),

    // Editor icons (lazy loaded)
    Code: () => import('lucide-react/dist/esm/icons/code').then(m => m.Code),
    Edit: () => import('lucide-react/dist/esm/icons/edit').then(m => m.Edit),
    Save: () => import('lucide-react/dist/esm/icons/save').then(m => m.Save),

    // Math and diagram icons (lazy loaded)
    Calculator: () => import('lucide-react/dist/esm/icons/calculator').then(m => m.Calculator),
    GitBranch: () => import('lucide-react/dist/esm/icons/git-branch').then(m => m.GitBranch),
    Network: () => import('lucide-react/dist/esm/icons/network').then(m => m.Network),
};

// Dynamic icon loader with caching
class IconLoader {
    private cache = new Map<string, any>();
    private loading = new Map<string, Promise<any>>();

    async load(iconName: keyof typeof Icons): Promise<any> {
        // Return cached icon if available
        if (this.cache.has(iconName)) {
            return this.cache.get(iconName);
        }

        // Return existing loading promise if in progress
        if (this.loading.has(iconName)) {
            return this.loading.get(iconName);
        }

        // Start loading the icon
        const loadingPromise = Icons[iconName]()
            .then(IconComponent => {
                this.cache.set(iconName, IconComponent);
                this.loading.delete(iconName);
                return IconComponent;
            })
            .catch(error => {
                this.loading.delete(iconName);
                console.error(`Failed to load icon ${iconName}:`, error);
                throw error;
            });

        this.loading.set(iconName, loadingPromise);
        return loadingPromise;
    }

    preload(iconNames: (keyof typeof Icons)[]): void {
        iconNames.forEach(iconName => {
            if (!this.cache.has(iconName) && !this.loading.has(iconName)) {
                this.load(iconName).catch(() => {
                    // Ignore preload errors
                });
            }
        });
    }

    clearCache(): void {
        this.cache.clear();
        this.loading.clear();
    }
}

export const iconLoader = new IconLoader();

// Optimized utility imports
export const Utils = {
    // Date utilities (lazy loaded)
    formatDate: () => import('date-fns/format').then(m => m.format),
    parseDate: () => import('date-fns/parse').then(m => m.parse),
    isValid: () => import('date-fns/isValid').then(m => m.isValid),

    // DOM utilities (lazy loaded)
    sanitizeHtml: () => import('dompurify').then(m => m.default.sanitize),

    // Math utilities (lazy loaded)
    clamp: () => import('lodash-es/clamp').then(m => m.default),
    debounce: () => import('lodash-es/debounce').then(m => m.default),
    throttle: () => import('lodash-es/throttle').then(m => m.default),
};

// Dynamic utility loader
class UtilityLoader {
    private cache = new Map<string, any>();

    async load<T>(utilityName: keyof typeof Utils): Promise<T> {
        if (this.cache.has(utilityName)) {
            return this.cache.get(utilityName);
        }

        const utility = await Utils[utilityName]();
        this.cache.set(utilityName, utility);
        return utility;
    }
}

export const utilityLoader = new UtilityLoader();

// Optimized component imports for code splitting
export const ComponentImports = {
    // Chart components (heavy, lazy loaded)
    LineChart: () => import('recharts').then(m => ({ LineChart: m.LineChart })),
    BarChart: () => import('recharts').then(m => ({ BarChart: m.BarChart })),
    PieChart: () => import('recharts').then(m => ({ PieChart: m.PieChart })),
    ResponsiveContainer: () => import('recharts').then(m => ({ ResponsiveContainer: m.ResponsiveContainer })),

    // 3D components (very heavy, lazy loaded)
    Canvas: () => import('@react-three/fiber').then(m => ({ Canvas: m.Canvas })),
    useFrame: () => import('@react-three/fiber').then(m => ({ useFrame: m.useFrame })),
    OrbitControls: () => import('@react-three/drei').then(m => ({ OrbitControls: m.OrbitControls })),

    // Code editor components (heavy, lazy loaded)
    SyntaxHighlighter: () => import('react-syntax-highlighter').then(m => ({ default: m.default })),

    // Math rendering (heavy, lazy loaded)
    KaTeX: () => import('katex').then(m => ({ default: m.default })),

    // Diagram components (heavy, lazy loaded)
    Mermaid: () => import('mermaid').then(m => ({ default: m.default })),
};

// Bundle size monitoring
export class BundleSizeMonitor {
    private loadedChunks = new Set<string>();
    private chunkSizes = new Map<string, number>();

    trackChunkLoad(chunkName: string, size?: number): void {
        this.loadedChunks.add(chunkName);
        if (size) {
            this.chunkSizes.set(chunkName, size);
        }

        // Report to analytics
        if (window.gtag) {
            window.gtag('event', 'chunk_loaded', {
                chunk_name: chunkName,
                chunk_size: size,
                total_chunks: this.loadedChunks.size,
            });
        }
    }

    getLoadedChunks(): string[] {
        return Array.from(this.loadedChunks);
    }

    getTotalSize(): number {
        return Array.from(this.chunkSizes.values()).reduce((sum, size) => sum + size, 0);
    }

    getReport(): {
        loadedChunks: string[];
        totalChunks: number;
        totalSize: number;
        averageChunkSize: number;
    } {
        const loadedChunks = this.getLoadedChunks();
        const totalSize = this.getTotalSize();

        return {
            loadedChunks,
            totalChunks: loadedChunks.length,
            totalSize,
            averageChunkSize: totalSize / loadedChunks.length || 0,
        };
    }
}

export const bundleSizeMonitor = new BundleSizeMonitor();

// Performance-aware import wrapper
export async function performanceImport<T>(
    importFn: () => Promise<T>,
    chunkName: string,
    options: {
        timeout?: number;
        retries?: number;
        onError?: (error: Error) => void;
    } = {}
): Promise<T> {
    const { timeout = 10000, retries = 2, onError } = options;

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const startTime = performance.now();

            // Create timeout promise
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error(`Import timeout for ${chunkName}`)), timeout);
            });

            // Race between import and timeout
            const result = await Promise.race([importFn(), timeoutPromise]);

            const loadTime = performance.now() - startTime;
            bundleSizeMonitor.trackChunkLoad(chunkName);

            // Report performance metrics
            if (window.gtag) {
                window.gtag('event', 'chunk_load_time', {
                    chunk_name: chunkName,
                    load_time: loadTime,
                    attempt: attempt + 1,
                });
            }

            return result;
        } catch (error) {
            lastError = error as Error;

            if (attempt === retries) {
                if (onError) {
                    onError(lastError);
                }

                // Report error to analytics
                if (window.gtag) {
                    window.gtag('event', 'chunk_load_error', {
                        chunk_name: chunkName,
                        error_message: lastError.message,
                        attempts: attempt + 1,
                    });
                }

                throw lastError;
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
    }

    throw lastError!;
}

// Tree-shaking helper for conditional imports
export function conditionalImport<T>(
    condition: boolean,
    importFn: () => Promise<T>
): Promise<T | null> {
    if (!condition) {
        return Promise.resolve(null);
    }

    return importFn();
}

// Preload critical chunks during idle time
export function preloadCriticalChunks(): void {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            // Preload commonly used icons
            iconLoader.preload(['Search', 'Menu', 'User', 'Settings']);

            // Preload critical utilities
            utilityLoader.load('debounce').catch(() => { });
            utilityLoader.load('formatDate').catch(() => { });
        });
    }
}

// Initialize preloading
if (typeof window !== 'undefined') {
    preloadCriticalChunks();
}