import type { NextFunction, Request, Response } from 'express';
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
    ttfb: number;
    loadTime: number;
    cacheStatus: 'HIT' | 'MISS' | 'EXPIRED' | 'STALE';
    edgeLocation: string;
    cdn: string;
}
export declare class CDNMonitoringService {
    private healthCheckUrls;
    private metrics;
    private alertThresholds;
    constructor();
    private initializeHealthChecks;
    private getCDNUrl;
    private getCDNProvider;
    private setupPeriodicMonitoring;
    runHealthChecks(): Promise<HealthCheckResult[]>;
    private performHealthCheck;
    collectMetrics(): Promise<CDNMetrics>;
    private collectCloudflareMetrics;
    private collectCloudFrontMetrics;
    private collectLocalMetrics;
    private getErrorMetrics;
    private determineHealthStatus;
    checkAlerts(): Promise<void>;
    private sendAlerts;
    private sendToExternalServices;
    measurePerformance(url: string): Promise<PerformanceMetrics>;
    private getCacheStatus;
    private getEdgeLocation;
    private getCDNFromHeaders;
    monitoringMiddleware: (req: Request, res: Response, next: NextFunction) => void;
    private trackRequest;
    getMetrics(): CDNMetrics[];
    getCurrentStatus(): {
        status: string;
        message: string;
        provider?: undefined;
        cacheHitRatio?: undefined;
        responseTime?: undefined;
        errorRate?: undefined;
        lastUpdate?: undefined;
    } | {
        status: "healthy" | "degraded" | "down";
        provider: string;
        cacheHitRatio: number;
        responseTime: number;
        errorRate: number;
        lastUpdate: string;
        message?: undefined;
    };
    generateReport(): Promise<unknown>;
}
export declare const cdnMonitoring: CDNMonitoringService;
export {};
