import * as schema from '@aiglossarypro/shared/enhancedSchema';
import { MonitoredPool, PoolStats } from './db/pool-monitor';
export declare const pool: MonitoredPool;
export declare const db: import("drizzle-orm/neon-serverless").NeonDatabase<typeof schema> & {
    $client: import("@neondatabase/serverless").Pool;
};
export declare function checkDatabaseHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    stats: any;
    recommendations?: string[];
}>;
export { MonitoredPool, PoolStats } from './db/pool-monitor';
export declare function getPoolMetrics(): PoolStats;
