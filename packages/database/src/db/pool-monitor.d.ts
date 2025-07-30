import { Pool, PoolConfig, PoolClient } from '@neondatabase/serverless';
export interface PoolStats {
    totalConnections: number;
    idleConnections: number;
    waitingRequests: number;
    totalCreated: number;
    totalDestroyed: number;
    avgAcquireTime: number;
    peakConnections: number;
    lastActivity: Date;
}
export declare class MonitoredPool extends Pool {
    private stats;
    private connectionMetrics;
    private metricsEmitter;
    private monitoringInterval?;
    private acquireTimes;
    private readonly maxAcquireTimeSamples;
    constructor(config: PoolConfig);
    private setupEventHandlers;
    private calculateAverage;
    private startMonitoring;
    private emitMetrics;
    private getHealthStatus;
    getStats(): PoolStats & {
        healthStatus: string;
    };
    onMetrics(callback: (metrics: any) => void): void;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
    getRecommendedPoolSize(): {
        min: number;
        max: number;
    };
}
export declare function createMonitoredPool(config: PoolConfig): MonitoredPool;
