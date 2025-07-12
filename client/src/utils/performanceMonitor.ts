// Performance monitoring and metrics collection
import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } from 'web-vitals';

interface PerformanceMetrics {
  cls: number | null;
  fcp: number | null;
  fid: number | null;
  inp: number | null;
  lcp: number | null;
  ttfb: number | null;
  customMetrics: Record<string, number>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    cls: null,
    fcp: null,
    fid: null,
    inp: null,
    lcp: null,
    ttfb: null,
    customMetrics: {}
  };

  private observers: Map<string, PerformanceObserver> = new Map();
  private resourceTimings: Map<string, number> = new Map();

  constructor() {
    this.initializeWebVitals();
    this.observeResources();
    this.observeLongTasks();
    this.trackNavigationTiming();
  }

  // Initialize Core Web Vitals monitoring
  private initializeWebVitals() {
    onCLS((metric) => {
      this.metrics.cls = metric.value;
      this.reportMetric('CLS', metric.value);
    });

    onFCP((metric) => {
      this.metrics.fcp = metric.value;
      this.reportMetric('FCP', metric.value);
    });

    onFID((metric) => {
      this.metrics.fid = metric.value;
      this.reportMetric('FID', metric.value);
    });

    onINP((metric) => {
      this.metrics.inp = metric.value;
      this.reportMetric('INP', metric.value);
    });

    onLCP((metric) => {
      this.metrics.lcp = metric.value;
      this.reportMetric('LCP', metric.value);
    });

    onTTFB((metric) => {
      this.metrics.ttfb = metric.value;
      this.reportMetric('TTFB', metric.value);
    });
  }

  // Observe resource loading performance
  private observeResources() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming;
          const duration = resourceEntry.duration;
          const name = resourceEntry.name;
          
          this.resourceTimings.set(name, duration);
          
          // Track slow resources
          if (duration > 1000) {
            this.reportSlowResource(name, duration);
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', observer);
    } catch (e) {
      console.warn('Failed to create resource observer:', e);
    }
  }

  // Monitor long tasks
  private observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const duration = entry.duration;
          
          if (duration > 50) {
            this.reportLongTask(duration, entry.startTime);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    } catch (e) {
      console.warn('Failed to create long task observer:', e);
    }
  }

  // Track navigation timing
  private trackNavigationTiming() {
    if (!('performance' in window) || !('timing' in performance)) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const metrics = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            domComplete: navigation.domComplete - navigation.domInteractive,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
            domInteractive: navigation.domInteractive - navigation.fetchStart,
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            domParsing: navigation.domInteractive - navigation.responseEnd,
            resourceLoad: navigation.loadEventStart - navigation.domContentLoadedEventEnd
          };

          Object.entries(metrics).forEach(([key, value]) => {
            this.trackCustomMetric(key, value);
          });
        }
      }, 0);
    });
  }

  // Public API for custom metrics
  public trackCustomMetric(name: string, value: number) {
    this.metrics.customMetrics[name] = value;
    this.reportMetric(name, value);
  }

  // Mark performance timing
  public mark(name: string) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  }

  // Measure between two marks
  public measure(name: string, startMark: string, endMark?: string) {
    if ('performance' in window && 'measure' in performance) {
      try {
        const measure = endMark 
          ? performance.measure(name, startMark, endMark)
          : performance.measure(name, startMark);
        
        this.trackCustomMetric(name, measure.duration);
      } catch (e) {
        console.warn('Failed to measure performance:', e);
      }
    }
  }

  // Report metric to analytics
  private reportMetric(name: string, value: number) {
    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', 'performance', {
        metric_name: name,
        value: Math.round(value),
        metric_value: value
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}:`, value);
    }
  }

  // Report slow resources
  private reportSlowResource(url: string, duration: number) {
    const resourceType = this.getResourceType(url);
    
    this.reportMetric(`slow_resource_${resourceType}`, duration);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Performance] Slow resource (${resourceType}):`, url, `${duration}ms`);
    }
  }

  // Report long tasks
  private reportLongTask(duration: number, startTime: number) {
    this.reportMetric('long_task', duration);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Performance] Long task detected:`, `${duration}ms at ${startTime}ms`);
    }
  }

  // Get resource type from URL
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'style';
    if (/\.(png|jpg|jpeg|gif|webp|svg)/.test(url)) return 'image';
    if (/\.(woff|woff2|ttf|eot)/.test(url)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  // Get current metrics
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Get resource timings
  public getResourceTimings(): Map<string, number> {
    return new Map(this.resourceTimings);
  }

  // Cleanup observers
  public cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.resourceTimings.clear();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export types
export type { PerformanceMetrics };

// Utility functions for React components
export function usePerformanceMark(markName: string) {
  useEffect(() => {
    performanceMonitor.mark(`${markName}_start`);
    
    return () => {
      performanceMonitor.mark(`${markName}_end`);
      performanceMonitor.measure(markName, `${markName}_start`, `${markName}_end`);
    };
  }, [markName]);
}

export function trackComponentRender(componentName: string) {
  const renderStart = performance.now();
  
  return () => {
    const renderTime = performance.now() - renderStart;
    performanceMonitor.trackCustomMetric(`component_render_${componentName}`, renderTime);
  };
}

import { useEffect } from 'react';