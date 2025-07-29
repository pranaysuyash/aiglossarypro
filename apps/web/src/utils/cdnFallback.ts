/**
 * CDN Fallback Utility
 * Handles fallback mechanisms when CDN assets fail to load
 */

interface CDNConfig {
  enabled: boolean;
  baseUrl: string;
  zones: {
    assets: string;
    images: string;
    fonts: string;
  };
  provider: 'cloudflare' | 'cloudfront' | 'local';
}

interface FallbackOptions {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableLocalFallback: boolean;
  enableMetrics: boolean;
}

interface AssetLoadMetrics {
  url: string;
  success: boolean;
  loadTime: number;
  fallbackUsed: boolean;
  error?: string;
  timestamp: number;
}

class CDNFallbackManager {
  private config: CDNConfig;
  private options: FallbackOptions;
  private metrics: AssetLoadMetrics[] = [];
  private failedUrls = new Set<string>();
  private fallbackUrls = new Map<string, string>();

  constructor() {
    // Get CDN config from build-time constants or environment
    const windowWithCDN = window as Window & {
      __CDN_CONFIG__?: CDNConfig;
    };
    this.config = windowWithCDN.__CDN_CONFIG__ || {
      enabled: false,
      baseUrl: '',
      zones: { assets: '/assets/', images: '/images/', fonts: '/fonts/' },
      provider: 'local',
    };

    this.options = {
      timeout: parseInt(process.env.CDN_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.CDN_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.CDN_RETRY_DELAY || '1000'),
      enableLocalFallback: process.env.ENABLE_CDN_FALLBACK === 'true',
      enableMetrics: process.env.CDN_MONITORING_ENABLED === 'true',
    };

    this.setupGlobalErrorHandlers();
    this.setupPerformanceMonitoring();
  }

  /**
   * Get the appropriate URL for an asset, with fallback logic
   */
  public getAssetUrl(originalPath: string): string {
    // If CDN is disabled or we've had failures, use local URL
    if (!this.config.enabled || this.failedUrls.has(originalPath)) {
      return this.getLocalUrl(originalPath);
    }

    // Check if we have a known fallback for this URL
    if (this.fallbackUrls.has(originalPath)) {
      return this.fallbackUrls.get(originalPath)!;
    }

    // Return CDN URL
    return this.getCDNUrl(originalPath);
  }

  /**
   * Load an asset with automatic fallback
   */
  public async loadAsset(
    originalPath: string,
    type: 'script' | 'style' | 'image' | 'font' = 'script'
  ): Promise<HTMLElement> {
    const startTime = performance.now();
    let lastError: Error | null = null;

    // Try CDN first, then fallback
    const urls = this.getUrlsWithFallback(originalPath);

    for (let attempt = 0; attempt < urls.length; attempt++) {
      const url = urls[attempt];
      const isFallback = attempt > 0;

      try {
        const element = await this.loadAssetFromUrl(url, type);

        // Track successful load
        this.trackMetrics({
          url,
          success: true,
          loadTime: performance.now() - startTime,
          fallbackUsed: isFallback,
          timestamp: Date.now(),
        });

        // Cache successful fallback
        if (isFallback) {
          this.fallbackUrls.set(originalPath, url);
        }

        return element;
      } catch (error) {
        lastError = error as Error;

        // Mark CDN URL as failed
        if (!isFallback) {
          this.failedUrls.add(originalPath);
        }

        // Wait before retry
        if (attempt < urls.length - 1) {
          await this.delay(this.options.retryDelay);
        }
      }
    }

    // Track failed load
    this.trackMetrics({
      url: originalPath,
      success: false,
      loadTime: performance.now() - startTime,
      fallbackUsed: true,
      error: lastError?.message,
      timestamp: Date.now(),
    });

    throw new Error(`Failed to load asset: ${originalPath}. Last error: ${lastError?.message}`);
  }

  /**
   * Preload critical assets with fallback
   */
  public async preloadCriticalAssets(assets: string[]): Promise<void> {
    const promises = assets.map(asset =>
      this.loadAsset(asset).catch(error => {
        console.warn(`Failed to preload critical asset: ${asset}`, error);
        return null;
      })
    );

    await Promise.allSettled(promises);
  }

  /**
   * Check CDN health and update fallback status
   */
  public async checkCDNHealth(): Promise<boolean> {
    if (!this.config.enabled) {return true;}

    try {
      const healthCheckUrl = `${this.config.baseUrl}/health`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);

      const response = await fetch(healthCheckUrl, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);

      const isHealthy = response.ok;

      if (!isHealthy) {
        console.warn('CDN health check failed:', response.status);
        this.enableFallbackMode();
      } else {
        this.disableFallbackMode();
      }

      return isHealthy;
    } catch (error) {
      console.warn('CDN health check error:', error);
      this.enableFallbackMode();
      return false;
    }
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): AssetLoadMetrics[] {
    return this.metrics.slice(-100); // Last 100 loads
  }

  /**
   * Get CDN status summary
   */
  public getStatus(): {
    status: 'healthy' | 'degraded' | 'failed' | 'unknown';
    message: string;
    successRate?: number;
    fallbackRate?: number;
    averageLoadTime?: number;
    failedUrlsCount?: number;
    isEnabled?: boolean;
  } {
    const recentMetrics = this.metrics.slice(-20);

    if (recentMetrics.length === 0) {
      return { status: 'unknown', message: 'No load attempts recorded' };
    }

    const successRate = recentMetrics.filter(m => m.success).length / recentMetrics.length;
    const fallbackRate = recentMetrics.filter(m => m.fallbackUsed).length / recentMetrics.length;
    const avgLoadTime =
      recentMetrics.reduce((sum, m) => sum + m.loadTime, 0) / recentMetrics.length;

    let status: 'healthy' | 'degraded' | 'down' = 'healthy';

    if (successRate < 0.8) {
      status = 'down';
    } else if (fallbackRate > 0.2 || avgLoadTime > 2000) {
      status = 'degraded';
    }

    return {
      status,
      provider: this.config.provider,
      successRate: `${(successRate * 100).toFixed(1)}%`,
      fallbackRate: `${(fallbackRate * 100).toFixed(1)}%`,
      averageLoadTime: `${avgLoadTime.toFixed(0)}ms`,
      failedUrls: this.failedUrls.size,
      enabled: this.config.enabled,
    };
  }

  /**
   * Clear failed URLs and reset fallback state
   */
  public resetFallbackState(): void {
    this.failedUrls.clear();
    this.fallbackUrls.clear();
    console.log('CDN fallback state reset');
  }

  private setupGlobalErrorHandlers(): void {
    // Handle script loading errors
    window.addEventListener(
      'error',
      event => {
        if (event.target && (event.target as any).tagName) {
          const element = event.target as HTMLElement;
          const url = (element as any).src || (element as any).href;

          if (url && this.isCDNUrl(url)) {
            console.warn('CDN asset failed to load:', url);
            this.handleAssetFailure(url, element);
          }
        }
      },
      true
    );

    // Handle CSS loading errors
    window.addEventListener(
      'error',
      event => {
        if (event.target && (event.target as HTMLLinkElement).rel === 'stylesheet') {
          const link = event.target as HTMLLinkElement;
          if (this.isCDNUrl(link.href)) {
            console.warn('CDN stylesheet failed to load:', link.href);
            this.handleAssetFailure(link.href, link);
          }
        }
      },
      true
    );

    // Handle fetch errors (for dynamic imports)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        return await originalFetch(...args);
      } catch (error) {
        const url = args[0] as string;
        if (this.isCDNUrl(url)) {
          console.warn('CDN fetch failed:', url);
          this.failedUrls.add(url);
        }
        throw error;
      }
    };
  }

  private setupPerformanceMonitoring(): void {
    if (!this.options.enableMetrics) {return;}

    // Monitor Resource Timing API
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.name && this.isCDNUrl(entry.name)) {
          this.trackMetrics({
            url: entry.name,
            success: entry.duration > 0,
            loadTime: entry.duration,
            fallbackUsed: false,
            timestamp: Date.now(),
          });
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }
  }

  private getUrlsWithFallback(originalPath: string): string[] {
    const urls: string[] = [];

    // Primary CDN URL
    if (this.config.enabled && !this.failedUrls.has(originalPath)) {
      urls.push(this.getCDNUrl(originalPath));
    }

    // Local fallback
    if (this.options.enableLocalFallback) {
      urls.push(this.getLocalUrl(originalPath));
    }

    return urls;
  }

  private getCDNUrl(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.config.baseUrl.replace(/\/$/, '')}${cleanPath}`;
  }

  private getLocalUrl(path: string): string {
    return path.startsWith('/') ? path : `/${path}`;
  }

  private isCDNUrl(url: string): boolean {
    return this.config.enabled && url.startsWith(this.config.baseUrl);
  }

  private async loadAssetFromUrl(url: string, type: string): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      let element: HTMLElement;

      switch (type) {
        case 'script':
          element = document.createElement('script');
          (element as HTMLScriptElement).src = url;
          (element as HTMLScriptElement).async = true;
          break;

        case 'style':
          element = document.createElement('link');
          (element as HTMLLinkElement).rel = 'stylesheet';
          (element as HTMLLinkElement).href = url;
          break;

        case 'image':
          element = document.createElement('img');
          (element as HTMLImageElement).src = url;
          break;

        case 'font':
          element = document.createElement('link');
          (element as HTMLLinkElement).rel = 'preload';
          (element as HTMLLinkElement).as = 'font';
          (element as HTMLLinkElement).href = url;
          (element as HTMLLinkElement).crossOrigin = 'anonymous';
          break;

        default:
          reject(new Error(`Unsupported asset type: ${type}`));
          return;
      }

      const timeout = setTimeout(() => {
        reject(new Error(`Asset load timeout: ${url}`));
      }, this.options.timeout);

      element.onload = () => {
        clearTimeout(timeout);
        resolve(element);
      };

      element.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Asset load error: ${url}`));
      };

      document.head.appendChild(element);
    });
  }

  private async handleAssetFailure(url: string, element: HTMLElement): Promise<void> {
    this.failedUrls.add(url);

    // Try to replace with fallback
    if (this.options.enableLocalFallback) {
      try {
        const fallbackUrl = this.getLocalUrl(url.replace(this.config.baseUrl, ''));

        if (element.tagName === 'SCRIPT') {
          (element as HTMLScriptElement).src = fallbackUrl;
        } else if (element.tagName === 'LINK') {
          (element as HTMLLinkElement).href = fallbackUrl;
        } else if (element.tagName === 'IMG') {
          (element as HTMLImageElement).src = fallbackUrl;
        }

        console.log(`Falling back to local URL: ${fallbackUrl}`);
      } catch (error) {
        console.error('Fallback failed:', error);
      }
    }
  }

  private enableFallbackMode(): void {
    console.warn('Enabling CDN fallback mode');
    // Could disable CDN entirely or mark as degraded
  }

  private disableFallbackMode(): void {
    console.log('CDN is healthy, disabling fallback mode');
    // Could re-enable CDN if it was disabled
  }

  private trackMetrics(metric: AssetLoadMetrics): void {
    if (!this.options.enableMetrics) {return;}

    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log significant events
    if (!metric.success) {
      console.warn('Asset load failed:', metric);
    } else if (metric.fallbackUsed) {
      console.log('Asset loaded via fallback:', metric);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
export const cdnFallback = new CDNFallbackManager();

// Export utility functions
export function getAssetUrl(path: string): string {
  return cdnFallback.getAssetUrl(path);
}

export function loadAsset(
  path: string,
  type?: 'script' | 'style' | 'image' | 'font'
): Promise<HTMLElement> {
  return cdnFallback.loadAsset(path, type);
}

export function preloadAssets(assets: string[]): Promise<void> {
  return cdnFallback.preloadCriticalAssets(assets);
}

export function checkCDNHealth(): Promise<boolean> {
  return cdnFallback.checkCDNHealth();
}

export function getCDNStatus(): {
  status: 'healthy' | 'degraded' | 'failed' | 'unknown';
  message: string;
  successRate?: number;
  fallbackRate?: number;
  averageLoadTime?: number;
  failedUrlsCount?: number;
  isEnabled?: boolean;
} {
  return cdnFallback.getStatus();
}

export function resetCDNFallback(): void {
  cdnFallback.resetFallbackState();
}

// Auto-check CDN health on startup
if (typeof window !== 'undefined') {
  // Check health after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      cdnFallback.checkCDNHealth();
    }, 1000);
  });

  // Periodic health checks
  setInterval(() => {
    cdnFallback.checkCDNHealth();
  }, 300000); // Every 5 minutes
}

export default cdnFallback;
