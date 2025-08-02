import * as dotenv from 'dotenv';

dotenv.config();

import { neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@aiglossarypro/shared';
import { createMonitoredPool, MonitoredPool, PoolStats } from './db/pool-monitor';

// Simple logger for now
const logger = {
  info: (...args: any[]) => console.log('[database]', ...args),
  warn: (...args: any[]) => console.warn('[database]', ...args),
  error: (...args: any[]) => console.error('[database]', ...args),
};

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

// Create monitored pool with configuration
export const pool: MonitoredPool = createMonitoredPool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
});

// Create drizzle instance
export const db = drizzle({ client: pool as any, schema });

// Health check function
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'critical';
  stats: any;
  recommendations?: string[];
}> {
  try {
    // Test query
    await db.execute(sql`SELECT 1`);
    
    const stats = pool.getStats();
    const recommendations: string[] = [];
    
    // Generate recommendations based on stats
    if (stats.avgAcquireTime > 500) {
      recommendations.push('Consider increasing pool size due to high acquire times');
    }
    
    if (stats.waitingRequests > 5) {
      recommendations.push('High number of waiting requests - scale up pool or optimize queries');
    }
    
    const recommendedSize = pool.getRecommendedPoolSize();
    const currentMax = parseInt(process.env.DB_POOL_MAX || '20');
    
    if (recommendedSize.max > currentMax) {
      recommendations.push(`Consider increasing DB_POOL_MAX from ${currentMax} to ${recommendedSize.max}`);
    }
    
    return {
      status: stats.healthStatus as any,
      stats,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };
  } catch (error) {
    logger.error('Database health check failed', error);
    return {
      status: 'critical',
      stats: pool.getStats(),
      recommendations: ['Database connection failed - check connection string and network']
    };
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing database pool...');
  await pool.end();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing database pool...');
  await pool.end();
});

// Export monitoring utilities
export { MonitoredPool, PoolStats } from './db/pool-monitor';

// Helper to get connection pool metrics endpoint data
export function getPoolMetrics(): PoolStats {
  return pool.getStats();
}

// Import sql from drizzle
import { sql } from 'drizzle-orm';