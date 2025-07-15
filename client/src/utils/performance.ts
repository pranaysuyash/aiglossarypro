// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Measure component render time
  measureRender(componentName: string, callback: () => void): void {
    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    this.recordMetric(`render_${componentName}`, endTime - startTime);
  }

  // Measure async operation time
  async measureAsync<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await operation();
      const endTime = performance.now();
      this.recordMetric(`async_${operationName}`, endTime - startTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordMetric(`async_${operationName}_error`, endTime - startTime);
      throw error;
    }
  }

  // Record a metric
  private recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms`);
    }
  }

  // Get metrics summary
  getMetricsSummary(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const summary: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    this.metrics.forEach((values, name) => {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        summary[name] = {
          avg: sum / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length
        };
      }
    });
    
    return summary;
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Web Vitals monitoring
export const reportWebVitals = (onPerfEntry?: (metric: any) => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

// Resource hints for critical assets
export const preloadCriticalAssets = () => {
  const criticalAssets = [
    { href: '/fonts/inter-var.woff2', as: 'font', type: 'font/woff2' },
    { href: '/fonts/jetbrains-mono.woff2', as: 'font', type: 'font/woff2' }
  ];

  criticalAssets.forEach(({ href, as, type }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// Image optimization helper
export const getOptimizedImageUrl = (url: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
} = {}): string => {
  // If using a CDN or image optimization service, transform the URL here
  // For now, return the original URL
  return url;
};

// Lazy load images with Intersection Observer
export const lazyLoadImage = (imgElement: HTMLImageElement) => {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      }
    });
  });

  imageObserver.observe(imgElement);
};

// Bundle size analyzer helper
export const analyzeBundleSize = async () => {
  if (import.meta.env.DEV) {
    const modules = import.meta.glob('/src/**/*.{ts,tsx,js,jsx}');
    const sizes: Record<string, number> = {};
    
    for (const path in modules) {
      try {
        const module = await modules[path]();
        const moduleStr = JSON.stringify(module);
        sizes[path] = new Blob([moduleStr]).size;
      } catch (error) {
        console.error(`Error analyzing ${path}:`, error);
      }
    }
    
    // Sort by size and log top 20
    const sorted = Object.entries(sizes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    
    console.table(sorted.map(([path, size]) => ({
      path,
      size: `${(size / 1024).toFixed(2)} KB`
    })));
  }
};

// Performance budget checker
export const checkPerformanceBudget = () => {
  const budgets = {
    js: 300 * 1024, // 300KB
    css: 100 * 1024, // 100KB
    images: 500 * 1024, // 500KB
    total: 1000 * 1024 // 1MB
  };

  if ('performance' in window && 'getEntriesByType' in performance) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const summary = {
      js: 0,
      css: 0,
      images: 0,
      total: 0
    };

    resources.forEach(resource => {
      const size = resource.transferSize || 0;
      summary.total += size;

      if (resource.name.endsWith('.js') || resource.name.includes('/js/')) {
        summary.js += size;
      } else if (resource.name.endsWith('.css') || resource.name.includes('/css/')) {
        summary.css += size;
      } else if (/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(resource.name)) {
        summary.images += size;
      }
    });

    // Check budgets and warn if exceeded
    Object.entries(budgets).forEach(([type, budget]) => {
      const actual = summary[type as keyof typeof summary];
      if (actual > budget) {
        console.warn(
          `⚠️ Performance budget exceeded for ${type}: ${(actual / 1024).toFixed(2)}KB / ${(budget / 1024).toFixed(2)}KB`
        );
      }
    });

    return summary;
  }
};