/**
 * Performance Monitoring Utility
 * Tracks render times and performance metrics
 */

interface PerformanceMetric {
  component: string;
  renderTime: number;
  timestamp: number;
  props?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Measure component render time
   */
  measureRender(componentName: string, callback: () => void, props?: Record<string, any>) {
    if (!this.enabled) {
      callback();
      return;
    }

    const startTime = performance.now();
    callback();
    const endTime = performance.now();
    
    const metric: PerformanceMetric = {
      component: componentName,
      renderTime: endTime - startTime,
      timestamp: Date.now(),
      props
    };

    this.metrics.push(metric);
    
    // Log slow renders (> 16ms is one frame at 60fps)
    if (metric.renderTime > 16) {
      console.warn(`⚠️ Slow render detected in ${componentName}: ${metric.renderTime.toFixed(2)}ms`, props);
    }
  }

  /**
   * Get performance report
   */
  getReport() {
    if (!this.metrics.length) return null;

    const grouped = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.component]) {
        acc[metric.component] = [];
      }
      acc[metric.component].push(metric.renderTime);
      return acc;
    }, {} as Record<string, number[]>);

    const report = Object.entries(grouped).map(([component, times]) => ({
      component,
      avgRenderTime: times.reduce((a, b) => a + b, 0) / times.length,
      maxRenderTime: Math.max(...times),
      minRenderTime: Math.min(...times),
      renderCount: times.length,
    }));

    return report.sort((a, b) => b.avgRenderTime - a.avgRenderTime);
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics = [];
  }

  /**
   * Log performance report to console
   */
  logReport() {
    const report = this.getReport();
    if (!report) {
      console.log('No performance metrics collected');
      return;
    }

    console.group('🚀 Performance Report');
    console.table(report);
    console.groupEnd();
  }
}

export const perfMonitor = new PerformanceMonitor();

/**
 * React Hook for performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  return {
    measure: (callback: () => void, props?: Record<string, any>) => {
      perfMonitor.measureRender(componentName, callback, props);
    },
    logReport: () => perfMonitor.logReport(),
  };
}

/**
 * HOC for automatic performance monitoring
 */
export function withPerformanceMonitor<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || Component.displayName || Component.name || 'Unknown';
  
  return React.memo((props: P) => {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const renderTime = performance.now() - startTime;
      if (renderTime > 16) {
        console.warn(`⚠️ ${displayName} rendered in ${renderTime.toFixed(2)}ms`);
      }
    });
    
    return <Component {...props} />;
  });
}