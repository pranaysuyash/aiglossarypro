/**
 * Production Performance Monitoring
 * Tracks Core Web Vitals and performance metrics in production
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

class ProductionPerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private endpoint = '/api/analytics/performance';
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds
  private enabled = process.env.NODE_ENV === 'production';

  constructor() {
    if (this.enabled) {
      this.setupWebVitals();
      this.setupPerformanceObserver();
      this.startBatchFlush();
    }
  }

  private setupWebVitals() {
    // Core Web Vitals tracking
    import('web-vitals')
      .then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        onCLS(this.recordMetric.bind(this));
        onFID(this.recordMetric.bind(this));
        onFCP(this.recordMetric.bind(this));
        onLCP(this.recordMetric.bind(this));
        onTTFB(this.recordMetric.bind(this));
      })
      .catch(() => {
        // Fallback for environments without web-vitals
        console.log('Web Vitals not available, using fallback monitoring');
      });
  }

  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Track navigation timing
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordCustomMetric('page-load', navEntry.loadEventEnd - navEntry.loadEventStart);
            this.recordCustomMetric(
              'dom-content-loaded',
              navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart
            );
            this.recordCustomMetric(
              'time-to-interactive',
              navEntry.domInteractive - navEntry.fetchStart
            );
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });

      // Track resource timing for API calls
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name.includes('/api/')) {
            this.recordCustomMetric('api-response-time', entry.duration);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  private recordMetric(metric: { name: string; value: number }) {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.metrics.push(performanceMetric);
    this.checkBatchLimit();
  }

  private recordCustomMetric(name: string, value: number) {
    const performanceMetric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.metrics.push(performanceMetric);
    this.checkBatchLimit();
  }

  private checkBatchLimit() {
    if (this.metrics.length >= this.batchSize) {
      this.flush();
    }
  }

  private startBatchFlush() {
    setInterval(() => {
      if (this.metrics.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  private async flush() {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: metricsToSend,
          timestamp: Date.now(),
          sessionId: this.getSessionId(),
        }),
      });
    } catch (error) {
      console.warn('Failed to send performance metrics:', error);
      // Re-add metrics to queue for retry
      this.metrics.unshift(...metricsToSend);
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('performance-session-id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('performance-session-id', sessionId);
    }
    return sessionId;
  }

  // Public API for manual metric recording
  public recordPageView(pageName: string) {
    this.recordCustomMetric('page-view', performance.now());
    this.recordCustomMetric('page-name', pageName as any);
  }

  public recordUserAction(action: string, duration?: number) {
    this.recordCustomMetric(`user-action-${action}`, duration || performance.now());
  }

  public recordComponentRender(componentName: string, renderTime: number) {
    this.recordCustomMetric(`component-render-${componentName}`, renderTime);
  }

  // Force flush remaining metrics (e.g., on page unload)
  public forceFlush() {
    if (this.metrics.length > 0) {
      // Use sendBeacon for reliable delivery on page unload
      if ('sendBeacon' in navigator) {
        const data = JSON.stringify({
          metrics: this.metrics,
          timestamp: Date.now(),
          sessionId: this.getSessionId(),
        });
        navigator.sendBeacon(this.endpoint, data);
      } else {
        this.flush();
      }
      this.metrics = [];
    }
  }
}

// Singleton instance
export const productionPerfMonitor = new ProductionPerformanceMonitor();

// Auto-flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    productionPerfMonitor.forceFlush();
  });

  // Also flush on visibility change (mobile background/foreground)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      productionPerfMonitor.forceFlush();
    }
  });
}

export default productionPerfMonitor;
