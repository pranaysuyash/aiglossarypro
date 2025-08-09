import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as ws from 'ws';
import * as schema from '@aiglossarypro/shared';

neonConfig.webSocketConstructor = ws as any;

if (!process.env.DATABASE_URL) {
  console.warn('[DB] DATABASE_URL not set, database features will be disabled');
}

export const pool = process.env.DATABASE_URL 
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null as any;

export const db = pool 
  ? drizzle({ client: pool, schema })
  : null as any;

// Add compatibility functions for db-adaptive
export async function testConnection(): Promise<boolean> {
  if (!pool) {
    console.log('[DB] No database pool available');
    return false;
  }
  
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Database connection successful');
    return true;
  } catch (error) {
    console.error('[DB] Database connection failed:', error);
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    console.log('[DB] Database pool closed');
  }
}
