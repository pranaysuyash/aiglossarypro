/**
 * Production Database Configuration
 * Optimized database settings for production deployment
 */
import { Pool, type PoolConfig } from 'pg';
interface DatabaseConfig extends PoolConfig {
    ssl?: boolean | object;
    connectionTimeoutMillis: number;
    idleTimeoutMillis: number;
    statement_timeout?: number;
    query_timeout?: number;
}
/**
 * Get optimized database configuration for production
 */
export declare function getProductionDatabaseConfig(): DatabaseConfig;
/**
 * Create optimized database pool for production
 */
export declare function createProductionDatabasePool(): Pool;
/**
 * Database health check optimized for production
 */
export declare function checkDatabaseHealth(pool: Pool): Promise<{
    healthy: boolean;
    responseTime: number;
    connectionInfo: {
        totalCount: number;
        idleCount: number;
        waitingCount: number;
    };
    serverInfo?: {
        version: string;
        timezone: string;
        encoding: string;
    };
    error?: string;
}>;
/**
 * Get database performance metrics
 */
export declare function getDatabaseMetrics(pool: Pool): Promise<{
    connectionPool: {
        total: number;
        idle: number;
        waiting: number;
        utilization: number;
    };
    performance: {
        avgQueryTime?: number;
        slowQueries?: number;
        connectionsPerSecond?: number;
    };
    storage?: {
        totalSize?: string;
        indexSize?: string;
        tableCount?: number;
    };
}>;
/**
 * Gracefully close database pool
 */
export declare function closeDatabasePool(pool: Pool): Promise<void>;
/**
 * Database maintenance utilities for production
 */
export declare class DatabaseMaintenance {
    private pool;
    constructor(pool: Pool);
    /**
     * Analyze database tables for performance optimization
     */
    analyzeTables(): Promise<void>;
    /**
     * Get table statistics for monitoring
     */
    getTableStatistics(): Promise<Array<{
        tableName: string;
        rowCount: number;
        totalSize: string;
        indexSize: string;
    }>>;
    /**
     * Check for missing indexes
     */
    checkMissingIndexes(): Promise<Array<{
        table: string;
        column: string;
        reason: string;
    }>>;
}
export {};
