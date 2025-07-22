/**
 * Memory usage monitoring and optimization system
 * Implements memory tracking, garbage collection triggers, and threshold alerts
 */

import * as React from 'react';

export interface MemoryMetrics {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
    timestamp: number;
    source: string;
}

export interface MemoryThresholds {
    warning: number; // 256MB
    critical: number; // 512MB
    emergency: number; // 768MB
}

export interface MemoryAlert {
    level: 'warning' | 'critical' | 'emergency';
    message: string;
    metrics: MemoryMetrics;
    timestamp: number;
    stackTrace?: string;
}

type MemoryAlertCallback = (alert: MemoryAlert) => void;
type CleanupFunction = () => void;

class MemoryMonitorClass {
    private static instance: MemoryMonitorClass;
    private isMonitoring = false;
    private monitoringInterval: NodeJS.Timeout | null = null;
    private alertCallbacks: Set<MemoryAlertCallback> = new Set();
    private cleanupFunctions: Set<CleanupFunction> = new Set();
    private memoryHistory: MemoryMetrics[] = [];
    private lastGCTime = 0;
    private gcCooldown = 30000; // 30 seconds between forced GC

    private readonly thresholds: MemoryThresholds = {
        warning: 256 * 1024 * 1024, // 256MB
        critical: 512 * 1024 * 1024, // 512MB
        emergency: 768 * 1024 * 1024, // 768MB
    };

    private readonly maxHistorySize = 100;
    private readonly monitoringIntervalMs = 5000; // 5 seconds

    private constructor() {
        // Bind methods to preserve context
        this.checkMemoryUsage = this.checkMemoryUsage.bind(this);
        this.triggerGarbageCollection = this.triggerGarbageCollection.bind(this);
    }

    static getInstance(): MemoryMonitorClass {
        if (!MemoryMonitorClass.instance) {
            MemoryMonitorClass.instance = new MemoryMonitorClass();
        }
        return MemoryMonitorClass.instance;
    }

    /**
     * Get current memory metrics
     */
    getCurrentMemoryMetrics(source = 'manual'): MemoryMetrics | null {
        if (!('memory' in performance)) {
            return null;
        }

        const memory = (performance as any).memory;
        return {
            usedJSHeapSize: memory.usedJSHeapSize || 0,
            totalJSHeapSize: memory.totalJSHeapSize || 0,
            jsHeapSizeLimit: memory.jsHeapSizeLimit || 0,
            timestamp: Date.now(),
            source,
        };
    }

    /**
     * Start memory monitoring
     */
    startMonitoring(): void {
        if (this.isMonitoring) {
            return;
        }

        console.log('🔍 Starting memory monitoring...');
        this.isMonitoring = true;

        // Initial memory check
        this.checkMemoryUsage();

        // Set up periodic monitoring
        this.monitoringInterval = setInterval(
            this.checkMemoryUsage,
            this.monitoringIntervalMs
        );

        // Monitor for page visibility changes to pause/resume monitoring
        document.addEventListener('visibilitychange', this.handleVisibilityChange);

        // Monitor for beforeunload to cleanup
        window.addEventListener('beforeunload', this.cleanup);
    }

    /**
     * Stop memory monitoring
     */
    stopMonitoring(): void {
        if (!this.isMonitoring) {
            return;
        }

        console.log('⏹️ Stopping memory monitoring...');
        this.isMonitoring = false;

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('beforeunload', this.cleanup);
    }

    /**
     * Check current memory usage and trigger alerts if needed
     */
    private checkMemoryUsage(): void {
        const metrics = this.getCurrentMemoryMetrics('monitoring');
        if (!metrics) {
            return;
        }

        // Add to history
        this.memoryHistory.push(metrics);
        if (this.memoryHistory.length > this.maxHistorySize) {
            this.memoryHistory.shift();
        }

        // Check thresholds and trigger alerts
        this.checkThresholds(metrics);

        // Auto-trigger garbage collection if memory is high
        if (metrics.usedJSHeapSize > this.thresholds.critical) {
            this.triggerGarbageCollection();
        }
    }

    /**
     * Check memory thresholds and trigger alerts
     */
    private checkThresholds(metrics: MemoryMetrics): void {
        let alertLevel: 'warning' | 'critical' | 'emergency' | null = null;
        let message = '';

        if (metrics.usedJSHeapSize > this.thresholds.emergency) {
            alertLevel = 'emergency';
            message = `Emergency: Memory usage at ${this.formatBytes(metrics.usedJSHeapSize)} (>${this.formatBytes(this.thresholds.emergency)})`;
        } else if (metrics.usedJSHeapSize > this.thresholds.critical) {
            alertLevel = 'critical';
            message = `Critical: Memory usage at ${this.formatBytes(metrics.usedJSHeapSize)} (>${this.formatBytes(this.thresholds.critical)})`;
        } else if (metrics.usedJSHeapSize > this.thresholds.warning) {
            alertLevel = 'warning';
            message = `Warning: Memory usage at ${this.formatBytes(metrics.usedJSHeapSize)} (>${this.formatBytes(this.thresholds.warning)})`;
        }

        if (alertLevel) {
            const alert: MemoryAlert = {
                level: alertLevel,
                message,
                metrics,
                timestamp: Date.now(),
                stackTrace: new Error().stack,
            };

            console.warn(`🚨 Memory Alert [${alertLevel.toUpperCase()}]:`, alert);
            this.notifyAlertCallbacks(alert);

            // Emergency cleanup
            if (alertLevel === 'emergency') {
                this.emergencyCleanup();
            }
        }
    }

    /**
     * Trigger garbage collection if available
     */
    triggerGarbageCollection(): boolean {
        const now = Date.now();
        if (now - this.lastGCTime < this.gcCooldown) {
            return false; // Still in cooldown
        }

        if (window.gc) {
            console.log('🗑️ Triggering garbage collection...');
            window.gc();
            this.lastGCTime = now;
            return true;
        }

        // Fallback: trigger GC indirectly
        try {
            const largeArray = new Array(1000000).fill(null);
            largeArray.length = 0;
            this.lastGCTime = now;
            return true;
        } catch (error) {
            console.warn('Failed to trigger garbage collection:', error);
            return false;
        }
    }

    /**
     * Emergency cleanup when memory usage is critical
     */
    private emergencyCleanup(): void {
        console.warn('🚨 Performing emergency memory cleanup...');

        // Run all registered cleanup functions
        this.cleanupFunctions.forEach(cleanup => {
            try {
                cleanup();
            } catch (error) {
                console.error('Error during emergency cleanup:', error);
            }
        });

        // Force garbage collection
        this.triggerGarbageCollection();

        // Clear memory history to free up space
        this.memoryHistory = this.memoryHistory.slice(-10); // Keep only last 10 entries
    }

    /**
     * Register a cleanup function to be called during emergency cleanup
     */
    registerCleanupFunction(cleanup: CleanupFunction): () => void {
        this.cleanupFunctions.add(cleanup);
        return () => this.cleanupFunctions.delete(cleanup);
    }

    /**
     * Register an alert callback
     */
    onMemoryAlert(callback: MemoryAlertCallback): () => void {
        this.alertCallbacks.add(callback);
        return () => this.alertCallbacks.delete(callback);
    }

    /**
     * Notify all alert callbacks
     */
    private notifyAlertCallbacks(alert: MemoryAlert): void {
        this.alertCallbacks.forEach(callback => {
            try {
                callback(alert);
            } catch (error) {
                console.error('Error in memory alert callback:', error);
            }
        });
    }

    /**
     * Handle page visibility changes
     */
    private handleVisibilityChange = (): void => {
        if (document.hidden) {
            // Page is hidden, reduce monitoring frequency
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = setInterval(
                    this.checkMemoryUsage,
                    this.monitoringIntervalMs * 3 // 15 seconds when hidden
                );
            }
        } else {
            // Page is visible, restore normal monitoring
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = setInterval(
                    this.checkMemoryUsage,
                    this.monitoringIntervalMs
                );
            }
        }
    };

    /**
     * Get memory usage statistics
     */
    getMemoryStats(): {
        current: MemoryMetrics | null;
        average: number;
        peak: number;
        trend: 'increasing' | 'decreasing' | 'stable';
        history: MemoryMetrics[];
    } {
        const current = this.getCurrentMemoryMetrics('stats');
        const history = [...this.memoryHistory];

        if (history.length === 0) {
            return {
                current,
                average: current?.usedJSHeapSize || 0,
                peak: current?.usedJSHeapSize || 0,
                trend: 'stable',
                history: [],
            };
        }

        const usages = history.map(m => m.usedJSHeapSize);
        const average = usages.reduce((sum, usage) => sum + usage, 0) / usages.length;
        const peak = Math.max(...usages);

        // Calculate trend from last 10 measurements
        const recentMeasurements = history.slice(-10);
        let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';

        if (recentMeasurements.length >= 5) {
            const firstHalf = recentMeasurements.slice(0, Math.floor(recentMeasurements.length / 2));
            const secondHalf = recentMeasurements.slice(Math.floor(recentMeasurements.length / 2));

            const firstAvg = firstHalf.reduce((sum, m) => sum + m.usedJSHeapSize, 0) / firstHalf.length;
            const secondAvg = secondHalf.reduce((sum, m) => sum + m.usedJSHeapSize, 0) / secondHalf.length;

            const difference = secondAvg - firstAvg;
            const threshold = average * 0.1; // 10% threshold

            if (difference > threshold) {
                trend = 'increasing';
            } else if (difference < -threshold) {
                trend = 'decreasing';
            }
        }

        return {
            current,
            average,
            peak,
            trend,
            history,
        };
    }

    /**
     * Format bytes to human readable string
     */
    private formatBytes(bytes: number): string {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Cleanup all resources
     */
    private cleanup = (): void => {
        this.stopMonitoring();
        this.alertCallbacks.clear();
        this.cleanupFunctions.clear();
        this.memoryHistory = [];
    };

    /**
     * Get current memory usage as percentage of limit
     */
    getMemoryUsagePercentage(): number {
        const metrics = this.getCurrentMemoryMetrics();
        if (!metrics || metrics.jsHeapSizeLimit === 0) {
            return 0;
        }
        return (metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100;
    }

    /**
     * Check if memory usage is within safe limits
     */
    isMemoryUsageSafe(): boolean {
        const metrics = this.getCurrentMemoryMetrics();
        return metrics ? metrics.usedJSHeapSize < this.thresholds.warning : true;
    }
}

// Export singleton instance
export const MemoryMonitor = MemoryMonitorClass.getInstance();

// React hook for memory monitoring
export function useMemoryMonitoring() {
    const [memoryStats, setMemoryStats] = React.useState(() => MemoryMonitor.getMemoryStats());
    const [alerts, setAlerts] = React.useState<MemoryAlert[]>([]);

    React.useEffect(() => {
        // Start monitoring
        MemoryMonitor.startMonitoring();

        // Update stats periodically
        const statsInterval = setInterval(() => {
            setMemoryStats(MemoryMonitor.getMemoryStats());
        }, 10000); // Update every 10 seconds

        // Listen for alerts
        const unsubscribeAlerts = MemoryMonitor.onMemoryAlert((alert) => {
            setAlerts(prev => [...prev.slice(-9), alert]); // Keep last 10 alerts
        });

        return () => {
            clearInterval(statsInterval);
            unsubscribeAlerts();
            MemoryMonitor.stopMonitoring();
        };
    }, []);

    const triggerGC = React.useCallback(() => {
        return MemoryMonitor.triggerGarbageCollection();
    }, []);

    const clearAlerts = React.useCallback(() => {
        setAlerts([]);
    }, []);

    return {
        memoryStats,
        alerts,
        triggerGC,
        clearAlerts,
        isMemorySafe: MemoryMonitor.isMemoryUsageSafe(),
        memoryUsagePercentage: MemoryMonitor.getMemoryUsagePercentage(),
    };
}

export default MemoryMonitor;