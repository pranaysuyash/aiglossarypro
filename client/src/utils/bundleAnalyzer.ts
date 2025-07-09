/**
 * Bundle Analysis Utility
 *
 * Provides runtime analysis of chunk loading and performance metrics.
 */

interface ChunkMetrics {
  name: string;
  size: number;
  loadTime: number;
  loadedAt: number;
}

interface BundleStats {
  totalChunks: number;
  totalSize: number;
  averageLoadTime: number;
  largestChunk: ChunkMetrics | null;
  slowestChunk: ChunkMetrics | null;
}

class BundleAnalyzer {
  private chunks: Map<string, ChunkMetrics> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers(): void {
    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          if (resource.name.includes('.js') && resource.name.includes('assets')) {
            this.recordChunkLoad(resource);
          }
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }

  private recordChunkLoad(resource: PerformanceResourceTiming): void {
    const chunkName = this.extractChunkName(resource.name);
    const loadTime = resource.responseEnd - resource.responseStart;

    const metrics: ChunkMetrics = {
      name: chunkName,
      size: resource.transferSize || 0,
      loadTime,
      loadedAt: resource.responseEnd,
    };

    this.chunks.set(chunkName, metrics);

    // Log slow chunks
    if (loadTime > 1000) {
      console.warn(`🐌 Slow chunk detected: ${chunkName} (${loadTime.toFixed(2)}ms)`);
    }
  }

  private extractChunkName(url: string): string {
    const matches = url.match(/assets\/(.+?)\.js/);
    return matches ? matches[1] : 'unknown';
  }

  getStats(): BundleStats {
    const chunks = Array.from(this.chunks.values());

    return {
      totalChunks: chunks.length,
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      averageLoadTime:
        chunks.length > 0
          ? chunks.reduce((sum, chunk) => sum + chunk.loadTime, 0) / chunks.length
          : 0,
      largestChunk:
        chunks.length > 0
          ? chunks.reduce((prev, curr) => (curr.size > prev.size ? curr : prev))
          : null,
      slowestChunk:
        chunks.length > 0
          ? chunks.reduce((prev, curr) => (curr.loadTime > prev.loadTime ? curr : prev))
          : null,
    };
  }

  getChunkAnalysis(): ChunkMetrics[] {
    return Array.from(this.chunks.values()).sort((a, b) => b.size - a.size); // Sort by size descending
  }

  logAnalysis(): void {
    const stats = this.getStats();
    const chunks = this.getChunkAnalysis();

    console.group('📊 Bundle Analysis');
    console.log(`Total chunks loaded: ${stats.totalChunks}`);
    console.log(`Total size: ${this.formatBytes(stats.totalSize)}`);
    console.log(`Average load time: ${stats.averageLoadTime.toFixed(2)}ms`);

    if (stats.largestChunk) {
      console.log(
        `Largest chunk: ${stats.largestChunk.name} (${this.formatBytes(stats.largestChunk.size)})`
      );
    }

    if (stats.slowestChunk) {
      console.log(
        `Slowest chunk: ${stats.slowestChunk.name} (${stats.slowestChunk.loadTime.toFixed(2)}ms)`
      );
    }

    if (chunks.length > 0) {
      console.table(chunks.slice(0, 10)); // Top 10 chunks
    }

    console.groupEnd();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  // Monitor Core Web Vitals related to bundle loading
  monitorWebVitals(): void {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        console.log(`🎯 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const performanceEntry = entry as PerformanceEventTiming;
          if (performanceEntry.processingStart) {
            const fid = performanceEntry.processingStart - entry.startTime;
            console.log(`⚡ FID: ${fid.toFixed(2)}ms`);
          }
        });
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    }
  }

  // Check bundle efficiency
  checkBundleEfficiency(): void {
    const stats = this.getStats();
    const recommendations: string[] = [];

    if (stats.totalSize > 2 * 1024 * 1024) {
      // 2MB threshold
      recommendations.push('Consider code splitting for large bundles');
    }

    if (stats.averageLoadTime > 500) {
      recommendations.push('Optimize chunk loading performance');
    }

    if (stats.largestChunk && stats.largestChunk.size > 500 * 1024) {
      // 500KB threshold
      recommendations.push(`Split large chunk: ${stats.largestChunk.name}`);
    }

    if (recommendations.length > 0) {
      console.group('💡 Bundle Optimization Recommendations');
      recommendations.forEach((rec) => console.log(`• ${rec}`));
      console.groupEnd();
    } else {
      console.log('✅ Bundle efficiency looks good!');
    }
  }

  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Create singleton instance
export const bundleAnalyzer = new BundleAnalyzer();

// Auto-start monitoring in development
if (import.meta.env.DEV) {
  bundleAnalyzer.monitorWebVitals();

  // Log analysis after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      bundleAnalyzer.logAnalysis();
      bundleAnalyzer.checkBundleEfficiency();
    }, 2000);
  });
}

export default bundleAnalyzer;
