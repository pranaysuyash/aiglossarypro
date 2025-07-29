import { EventEmitter } from 'events';
import { log } from '../utils/logger';
import * as Sentry from '../utils/sentry';

// Monitoring metrics interface
export interface SystemMetrics {
    timestamp: Date;
    cpu: {
        usage: number;
        load: number[];
    };
    memory: {
        used: number;
        total: number;
        percentage: number;
    };
    database: {
        connections: number;
        queryTime: number;
        errorRate: number;
    };
    api: {
        requestCount: number;
        errorRate: number;
        averageResponseTime: number;
    };
    errors: {
        total: number;
        critical: number;
        byType: Record<string, number>;
    };
}

// Alert configuration
export interface AlertConfig {
    name: string;
    condition: (metrics: SystemMetrics) => boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    cooldown: number; // minutes
    enabled: boolean;
}

// Alert instance
export interface Alert {
    id: string;
    config: AlertConfig;
    triggeredAt: Date;
    resolved: boolean;
    resolvedAt?: Date;
    metrics: SystemMetrics;
}

/**
 * Comprehensive monitoring service for system health and performance
 */
export class MonitoringService extends EventEmitter {
    private static instance: MonitoringService;
    private metrics: SystemMetrics[] = [];
    private alerts: Alert[] = [];
    private alertConfigs: AlertConfig[] = [];
    private lastAlertTimes: Map<string, Date> = new Map();
    private isRunning = false;
    private intervalId?: NodeJS.Timeout;

    private constructor() {
        super();
        this.initializeDefaultAlerts();
    }

    public static getInstance(): MonitoringService {
        if (!MonitoringService.instance) {
            MonitoringService.instance = new MonitoringService();
        }
        return MonitoringService.instance;
    }

    /**
     * Start the monitoring service
     */
    public start(intervalMs: number = 60000): void {
        if (this.isRunning) {
            log.warn('Monitoring service is already running');
            return;
        }

        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.collectMetrics();
        }, intervalMs);

        log.info('Monitoring service started', { interval: intervalMs });
    }

    /**
     * Stop the monitoring service
     */
    public stop(): void {
        if (!this.isRunning) {
            return;
        }

        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        this.isRunning = false;
        log.info('Monitoring service stopped');
    }

    /**
     * Get current system metrics
     */
    public async getCurrentMetrics(): Promise<SystemMetrics> {
        return this.collectMetrics();
    }

    /**
     * Get historical metrics
     */
    public getHistoricalMetrics(hours: number = 24): SystemMetrics[] {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.metrics.filter(m => m.timestamp >= cutoff);
    }

    /**
     * Get active alerts
     */
    public getActiveAlerts(): Alert[] {
        return this.alerts.filter(a => !a.resolved);
    }

    /**
     * Get all alerts
     */
    public getAllAlerts(hours: number = 24): Alert[] {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.alerts.filter(a => a.triggeredAt >= cutoff);
    }

    /**
     * Add custom alert configuration
     */
    public addAlertConfig(config: AlertConfig): void {
        this.alertConfigs.push(config);
        log.info('Alert configuration added', { name: config.name });
    }

    /**
     * Remove alert configuration
     */
    public removeAlertConfig(name: string): void {
        this.alertConfigs = this.alertConfigs.filter(c => c.name !== name);
        log.info('Alert configuration removed', { name });
    }

    /**
     * Get system health status
     */
    public getHealthStatus(): {
        status: 'healthy' | 'warning' | 'critical';
        issues: string[];
        uptime: number;
    } {
        const activeAlerts = this.getActiveAlerts();
        const criticalAlerts = activeAlerts.filter(a => a.config.severity === 'critical');
        const highAlerts = activeAlerts.filter(a => a.config.severity === 'high');

        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        const issues: string[] = [];

        if (criticalAlerts.length > 0) {
            status = 'critical';
            issues.push(...criticalAlerts.map(a => a.config.name));
        } else if (highAlerts.length > 0 || activeAlerts.length > 3) {
            status = 'warning';
            issues.push(...highAlerts.map(a => a.config.name));
        }

        return {
            status,
            issues,
            uptime: process.uptime(),
        };
    }

    // Private methods

    private async collectMetrics(): Promise<SystemMetrics> {
        try {
            const metrics: SystemMetrics = {
                timestamp: new Date(),
                cpu: await this.getCPUMetrics(),
                memory: this.getMemoryMetrics(),
                database: await this.getDatabaseMetrics(),
                api: this.getAPIMetrics(),
                errors: this.getErrorMetrics(),
            };

            // Store metrics (keep last 24 hours)
            this.metrics.push(metrics);
            this.cleanupOldMetrics();

            // Check for alerts
            this.checkAlerts(metrics);

            // Emit metrics event
            this.emit('metrics', metrics);

            return metrics;
        } catch (error) {
            log.error('Failed to collect metrics', { error: error instanceof Error ? error.message : error });
            throw error;
        }
    }

    private async getCPUMetrics(): Promise<{ usage: number; load: number[] }> {
        // In a real implementation, you'd use a library like 'os' or 'systeminformation'
        // For now, we'll simulate the data
        return {
            usage: Math.random() * 100,
            load: [Math.random(), Math.random(), Math.random()],
        };
    }

    private getMemoryMetrics(): { used: number; total: number; percentage: number } {
        const memUsage = process.memoryUsage();
        const total = memUsage.heapTotal;
        const used = memUsage.heapUsed;

        return {
            used,
            total,
            percentage: (used / total) * 100,
        };
    }

    private async getDatabaseMetrics(): Promise<{
        connections: number;
        queryTime: number;
        errorRate: number;
    }> {
        // In a real implementation, you'd query your database connection pool
        // For now, we'll simulate the data
        return {
            connections: Math.floor(Math.random() * 10),
            queryTime: Math.random() * 1000,
            errorRate: Math.random() * 5,
        };
    }

    private getAPIMetrics(): {
        requestCount: number;
        errorRate: number;
        averageResponseTime: number;
    } {
        // In a real implementation, you'd track these metrics in middleware
        // For now, we'll simulate the data
        return {
            requestCount: Math.floor(Math.random() * 1000),
            errorRate: Math.random() * 10,
            averageResponseTime: Math.random() * 2000,
        };
    }

    private getErrorMetrics(): {
        total: number;
        critical: number;
        byType: Record<string, number>;
    } {
        // In a real implementation, you'd get this from your error tracking system
        return {
            total: Math.floor(Math.random() * 50),
            critical: Math.floor(Math.random() * 5),
            byType: {
                authentication: Math.floor(Math.random() * 10),
                database: Math.floor(Math.random() * 15),
                api: Math.floor(Math.random() * 20),
                system: Math.floor(Math.random() * 5),
            },
        };
    }

    private checkAlerts(metrics: SystemMetrics): void {
        for (const config of this.alertConfigs) {
            if (!config.enabled) {continue;}

            // Check cooldown
            const lastAlert = this.lastAlertTimes.get(config.name);
            if (lastAlert) {
                const cooldownMs = config.cooldown * 60 * 1000;
                if (Date.now() - lastAlert.getTime() < cooldownMs) {
                    continue;
                }
            }

            // Check condition
            if (config.condition(metrics)) {
                this.triggerAlert(config, metrics);
            }
        }
    }

    private triggerAlert(config: AlertConfig, metrics: SystemMetrics): void {
        const alert: Alert = {
            id: `${config.name}-${Date.now()}`,
            config,
            triggeredAt: new Date(),
            resolved: false,
            metrics,
        };

        this.alerts.push(alert);
        this.lastAlertTimes.set(config.name, new Date());

        // Log alert
        log.warn('Alert triggered', {
            name: config.name,
            severity: config.severity,
            alertId: alert.id,
        });

        // Send to Sentry for critical alerts
        if (config.severity === 'critical') {
            Sentry.addBreadcrumb(
                `Critical alert: ${config.name}`,
                'monitoring',
                'error',
                { alertId: alert.id, metrics }
            );
        }

        // Emit alert event
        this.emit('alert', alert);
    }

    private cleanupOldMetrics(): void {
        const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
        this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);
        this.alerts = this.alerts.filter(a => a.triggeredAt >= cutoff);
    }

    private initializeDefaultAlerts(): void {
        // High memory usage alert
        this.addAlertConfig({
            name: 'High Memory Usage',
            condition: (metrics) => metrics.memory.percentage > 85,
            severity: 'high',
            cooldown: 15,
            enabled: true,
        });

        // High error rate alert
        this.addAlertConfig({
            name: 'High Error Rate',
            condition: (metrics) => metrics.api.errorRate > 10,
            severity: 'medium',
            cooldown: 10,
            enabled: true,
        });

        // Slow API response alert
        this.addAlertConfig({
            name: 'Slow API Response',
            condition: (metrics) => metrics.api.averageResponseTime > 5000,
            severity: 'medium',
            cooldown: 10,
            enabled: true,
        });

        // Critical errors alert
        this.addAlertConfig({
            name: 'Critical Errors',
            condition: (metrics) => metrics.errors.critical > 0,
            severity: 'critical',
            cooldown: 5,
            enabled: true,
        });

        // Database connection issues
        this.addAlertConfig({
            name: 'Database Connection Issues',
            condition: (metrics) => metrics.database.connections === 0,
            severity: 'critical',
            cooldown: 5,
            enabled: true,
        });
    }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();