/**
 * Database connection for ECS using standard pg driver
 * This avoids WebSocket issues with @neondatabase/serverless in ECS
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@aiglossarypro/shared';

if (!process.env.DATABASE_URL) {
  console.warn('[DB-ECS] DATABASE_URL not set, database features will be disabled');
}

// Create pool with standard pg driver
// This works better in ECS than the serverless/WebSocket approach
export const pool = process.env.DATABASE_URL 
  ? new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
        rejectUnauthorized: false // Required for Neon
      },
      max: 5, // Reduced for ECS environment
      min: 0,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // ECS-specific optimizations
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    })
  : null;

// Create drizzle instance
export const db = pool ? drizzle(pool, { schema }) : null;

// Test connection function
export async function testConnection(): Promise<boolean> {
  if (!pool) {
    console.log('[DB-ECS] No database pool available - DATABASE_URL not set');
    return false;
  }
  
  try {
    console.log('[DB-ECS] Testing database connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT 1 as connected, NOW() as timestamp');
    client.release();
    console.log('[DB-ECS] Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('[DB-ECS] Database connection failed:', error);
    if (error instanceof Error) {
      console.error('[DB-ECS] Error message:', error.message);
      console.error('[DB-ECS] Error stack:', error.stack);
    }
    return false;
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    console.log('[DB-ECS] Database pool closed');
  }
}