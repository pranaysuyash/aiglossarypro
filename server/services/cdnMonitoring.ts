import type { NextFunction, Request, Response } from 'express';
import fetch from 'node-fetch';

interface CDNMetrics {
  timestamp: string;
  provider: string;
  cacheHitRatio: number;
  bandwidth: number;
  requests: number;
  responseTime: number;
  errorRate: number;
  edgeLocation?: string;
  status: 'healthy' | 'degraded' | 'down';
}

interface HealthCheckResult {
  url: string;
  status: number;
  responseTime: number;
  headers: Record<string, string>;
  error?: string;
}

interface PerformanceMetrics {
  ttfb: number; // Time to First Byte
  loadTime: number;
  cacheStatus: 'HIT' | 'MISS' | 'EXPIRED' | 'STALE';
  edgeLocation: string;
  cdn: string;
}

export class CDNMonitoringService {
  private healthCheckUrls: string[] = [];
  private metrics: CDNMetrics[] = [];
  private alertThresholds = {
    cacheHitRatio: 0.8, // 80%
    errorRate: 0.05, // 5%
    responseTime: 2000, // 2 seconds
  };

  constructor() {
    this.initializeHealthChecks();
    this.setupPeriodicMonitoring();
  }

  private initializeHealthChecks(): void {
    const cdnUrl = this.getCDNUrl();
    if (cdnUrl) {
      this.healthCheckUrls = [
        `${cdnUrl}/`,
        `${cdnUrl}/assets/js/index-*.js`,
        `${cdnUrl}/assets/css/index-*.css`,
        `${cdnUrl}/health`,
      ];
    }
  }

  private getCDNUrl(): string | null {
    if (process.env.USE_CLOUDFLARE_CDN === 'true') {
      return process.env.CLOUDFLARE_CDN_URL || null;
    } else if (process.env.USE_CLOUDFRONT_CDN === 'true') {
      return process.env.CLOUDFRONT_CDN_URL || null;
    }
    return null;
  }

  private getCDNProvider(): string {
    if (process.env.USE_CLOUDFLARE_CDN === 'true') return 'cloudflare';
    if (process.env.USE_CLOUDFRONT_CDN === 'true') return 'cloudfront';
    return 'local';
  }

  private setupPeriodicMonitoring(): void {
    if (process.env.CDN_MONITORING_ENABLED !== 'true') return;

    // Health checks every 30 seconds
    setInterval(async () => {
      try {
        await this.runHealthChecks();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 30000);

    // Metrics collection every 5 minutes
    setInterval(async () => {
      try {
        await this.collectMetrics();
      } catch (error) {
        console.error('Metrics collection failed:', error);
      }
    }, 300000);

    // Alert checking every minute
    setInterval(async () => {
      try {
        await this.checkAlerts();
      } catch (error) {
        console.error('Alert checking failed:', error);
      }
    }, 60000);
  }

  async runHealthChecks(): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    for (const url of this.healthCheckUrls) {
      const result = await this.performHealthCheck(url);
      results.push(result);
    }

    return results;
  }

  private async performHealthCheck(url: string): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'AIGlossaryPro-HealthCheck/1.0',
        },
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      return {
        url,
        status: response.status,
        responseTime,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      return {
        url,
        status: 0,
        responseTime: Date.now() - startTime,
        headers: {},
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async collectMetrics(): Promise<CDNMetrics> {
    const provider = this.getCDNProvider();
    let metrics: CDNMetrics;

    switch (provider) {
      case 'cloudflare':
        metrics = await this.collectCloudflareMetrics();
        break;
      case 'cloudfront':
        metrics = await this.collectCloudFrontMetrics();
        break;
      default:
        metrics = await this.collectLocalMetrics();
    }

    this.metrics.push(metrics);

    // Keep only last 1000 metrics (roughly 3.5 days at 5-minute intervals)
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    return metrics;
  }

  private async collectCloudflareMetrics(): Promise<CDNMetrics> {
    try {
      const zoneId = process.env.CLOUDFLARE_ZONE_ID;
      const apiToken = process.env.CLOUDFLARE_API_TOKEN;

      if (!zoneId || !apiToken) {
        throw new Error('Cloudflare credentials not configured');
      }

      // Get analytics from Cloudflare API
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = (await response.json()) as any;

      if (!data.success) {
        throw new Error(`Cloudflare API error: ${data.errors?.[0]?.message}`);
      }

      const analytics = data.result;

      return {
        timestamp: new Date().toISOString(),
        provider: 'cloudflare',
        cacheHitRatio: analytics.totals.cache_hit_ratio || 0,
        bandwidth: analytics.totals.bandwidth?.all || 0,
        requests: analytics.totals.requests?.all || 0,
        responseTime: analytics.totals.response_time_avg || 0,
        errorRate:
          (analytics.totals.requests?.http_status_4xx +
            analytics.totals.requests?.http_status_5xx) /
          (analytics.totals.requests?.all || 1),
        status: this.determineHealthStatus(analytics),
      };
    } catch (error) {
      console.error('Failed to collect Cloudflare metrics:', error);
      return this.getErrorMetrics('cloudflare');
    }
  }

  private async collectCloudFrontMetrics(): Promise<CDNMetrics> {
    try {
      // For CloudFront, we would use AWS SDK to get CloudWatch metrics
      // This is a placeholder implementation

      return {
        timestamp: new Date().toISOString(),
        provider: 'cloudfront',
        cacheHitRatio: 0.85, // Placeholder
        bandwidth: 0,
        requests: 0,
        responseTime: 100,
        errorRate: 0.01,
        status: 'healthy',
      };
    } catch (error) {
      console.error('Failed to collect CloudFront metrics:', error);
      return this.getErrorMetrics('cloudfront');
    }
  }

  private async collectLocalMetrics(): Promise<CDNMetrics> {
    // For local/origin metrics, we collect basic server stats
    const healthChecks = await this.runHealthChecks();
    const successfulChecks = healthChecks.filter(
      (check) => check.status >= 200 && check.status < 400
    );
    const avgResponseTime =
      healthChecks.reduce((sum, check) => sum + check.responseTime, 0) / healthChecks.length;

    return {
      timestamp: new Date().toISOString(),
      provider: 'local',
      cacheHitRatio: 0, // No CDN caching for local
      bandwidth: 0,
      requests: 0,
      responseTime: avgResponseTime,
      errorRate: 1 - successfulChecks.length / healthChecks.length,
      status: successfulChecks.length === healthChecks.length ? 'healthy' : 'degraded',
    };
  }

  private getErrorMetrics(provider: string): CDNMetrics {
    return {
      timestamp: new Date().toISOString(),
      provider,
      cacheHitRatio: 0,
      bandwidth: 0,
      requests: 0,
      responseTime: 0,
      errorRate: 1,
      status: 'down',
    };
  }

  private determineHealthStatus(analytics: any): 'healthy' | 'degraded' | 'down' {
    const cacheHitRatio = analytics.totals.cache_hit_ratio || 0;
    const errorRate =
      (analytics.totals.requests?.http_status_4xx + analytics.totals.requests?.http_status_5xx) /
      (analytics.totals.requests?.all || 1);

    if (errorRate > 0.1) return 'down';
    if (cacheHitRatio < 0.7 || errorRate > 0.05) return 'degraded';
    return 'healthy';
  }

  async checkAlerts(): Promise<void> {
    if (this.metrics.length === 0) return;

    const latestMetrics = this.metrics[this.metrics.length - 1];
    const alerts: string[] = [];

    // Check cache hit ratio
    if (latestMetrics.cacheHitRatio < this.alertThresholds.cacheHitRatio) {
      alerts.push(`Low cache hit ratio: ${(latestMetrics.cacheHitRatio * 100).toFixed(1)}%`);
    }

    // Check error rate
    if (latestMetrics.errorRate > this.alertThresholds.errorRate) {
      alerts.push(`High error rate: ${(latestMetrics.errorRate * 100).toFixed(1)}%`);
    }

    // Check response time
    if (latestMetrics.responseTime > this.alertThresholds.responseTime) {
      alerts.push(`High response time: ${latestMetrics.responseTime}ms`);
    }

    // Check status
    if (latestMetrics.status === 'down') {
      alerts.push('CDN is down');
    } else if (latestMetrics.status === 'degraded') {
      alerts.push('CDN performance is degraded');
    }

    if (alerts.length > 0) {
      await this.sendAlerts(alerts, latestMetrics);
    }
  }

  private async sendAlerts(alerts: string[], metrics: CDNMetrics): Promise<void> {
    const alertMessage = `CDN Alert for ${metrics.provider}:\n${alerts.join('\n')}`;

    console.warn('[CDN ALERT]', alertMessage);

    // Send to external monitoring services
    await this.sendToExternalServices(alertMessage, metrics);
  }

  private async sendToExternalServices(message: string, _metrics: CDNMetrics): Promise<void> {
    // Send to Slack, Discord, email, etc.
    // This is a placeholder for actual alert implementations

    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: message,
            username: 'CDN Monitor',
            icon_emoji: ':warning:',
          }),
        });
      } catch (error) {
        console.error('Failed to send Slack alert:', error);
      }
    }

    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: message,
          }),
        });
      } catch (error) {
        console.error('Failed to send Discord alert:', error);
      }
    }
  }

  async measurePerformance(url: string): Promise<PerformanceMetrics> {
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AIGlossaryPro-PerfMonitor/1.0',
        },
      });

      const ttfb = Date.now() - startTime;
      const loadTime = ttfb; // For API endpoints, these are the same

      const cacheStatus = this.getCacheStatus(response.headers);
      const edgeLocation = this.getEdgeLocation(response.headers);
      const cdn = this.getCDNFromHeaders(response.headers);

      return {
        ttfb,
        loadTime,
        cacheStatus,
        edgeLocation,
        cdn,
      };
    } catch (error) {
      throw new Error(`Performance measurement failed: ${error}`);
    }
  }

  private getCacheStatus(headers: any): 'HIT' | 'MISS' | 'EXPIRED' | 'STALE' {
    const cfCacheStatus = headers.get('cf-cache-status');
    const xCache = headers.get('x-cache');

    if (cfCacheStatus) {
      return cfCacheStatus.toUpperCase();
    }

    if (xCache?.includes('Hit')) {
      return 'HIT';
    }

    return 'MISS';
  }

  private getEdgeLocation(headers: any): string {
    const cfRay = headers.get('cf-ray');
    const xAmzCfId = headers.get('x-amz-cf-id');

    if (cfRay) {
      // Cloudflare edge location from CF-Ray header
      return cfRay.split('-')[1] || 'unknown';
    }

    if (xAmzCfId) {
      // CloudFront edge location
      return 'cloudfront-edge';
    }

    return 'origin';
  }

  private getCDNFromHeaders(headers: any): string {
    if (headers.get('cf-ray')) return 'cloudflare';
    if (headers.get('x-amz-cf-id')) return 'cloudfront';
    return 'origin';
  }

  // Express middleware for real-time monitoring
  public monitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;

      // Log performance metrics
      if (process.env.CDN_VERBOSE_LOGGING === 'true') {
        console.log(
          `[CDN Monitor] ${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`
        );
      }

      // Track metrics for analysis
      this.trackRequest(req, res, responseTime);
    });

    next();
  };

  private trackRequest(_req: Request, _res: Response, _responseTime: number): void {
    // Track request patterns for CDN optimization
    // This could feed into analytics or trigger cache warming
  }

  // API endpoints for monitoring dashboard
  public getMetrics(): CDNMetrics[] {
    return this.metrics.slice(-100); // Last 100 metrics
  }

  public getCurrentStatus(): any {
    const latestMetrics = this.metrics[this.metrics.length - 1];

    if (!latestMetrics) {
      return { status: 'unknown', message: 'No metrics available' };
    }

    return {
      status: latestMetrics.status,
      provider: latestMetrics.provider,
      cacheHitRatio: latestMetrics.cacheHitRatio,
      responseTime: latestMetrics.responseTime,
      errorRate: latestMetrics.errorRate,
      lastUpdate: latestMetrics.timestamp,
    };
  }

  public async generateReport(): Promise<any> {
    const metrics = this.metrics.slice(-288); // Last 24 hours (5-minute intervals)

    if (metrics.length === 0) {
      return { error: 'No metrics available' };
    }

    const avgCacheHitRatio = metrics.reduce((sum, m) => sum + m.cacheHitRatio, 0) / metrics.length;
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
    const avgErrorRate = metrics.reduce((sum, m) => sum + m.errorRate, 0) / metrics.length;
    const totalBandwidth = metrics.reduce((sum, m) => sum + m.bandwidth, 0);
    const totalRequests = metrics.reduce((sum, m) => sum + m.requests, 0);

    const healthyPeriods = metrics.filter((m) => m.status === 'healthy').length;
    const uptime = (healthyPeriods / metrics.length) * 100;

    return {
      period: '24 hours',
      metrics: {
        averageCacheHitRatio: avgCacheHitRatio,
        averageResponseTime: avgResponseTime,
        averageErrorRate: avgErrorRate,
        totalBandwidth,
        totalRequests,
        uptime: `${uptime.toFixed(2)}%`,
      },
      provider: metrics[0].provider,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const cdnMonitoring = new CDNMonitoringService();
