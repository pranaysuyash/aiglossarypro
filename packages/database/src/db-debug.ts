import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@aiglossarypro/shared';

// Add timestamp logging
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[DB] ${timestamp} - ${message}`, data || '');
};

log('Initializing database module');

// Configure WebSocket
neonConfig.webSocketConstructor = ws;

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  log('ERROR: DATABASE_URL is not set!');
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

log('DATABASE_URL is set', { 
  host: process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown',
  database: process.env.DATABASE_URL.split('/').pop()?.split('?')[0] || 'unknown'
});

// Create pool with timeout and better error handling
log('Creating connection pool...');

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000, // 10 second timeout
  idleTimeoutMillis: 30000,
  max: 10,
  ssl: process.env.DATABASE_URL.includes('sslmode=require') ? {
    rejectUnauthorized: false
  } : undefined
});

// Add pool error handlers
pool.on('error', (err) => {
  log('Pool error:', err.message);
  console.error('PostgreSQL pool error:', err);
});

pool.on('connect', (_client) => {
  log('New client connected to pool');
});

pool.on('acquire', (_client) => {
  log('Client acquired from pool');
});

pool.on('remove', (_client) => {
  log('Client removed from pool');
});

// Test connection on startup
log('Testing database connection...');
pool.connect()
  .then(client => {
    log('Database connection successful!');
    client.release();
    log('Test client released');
  })
  .catch(err => {
    log('Database connection failed!', {
      error: err.message,
      code: err.code,
      detail: err.detail
    });
    console.error('Failed to connect to database:', err);
    // Don't exit here - let the app decide what to do
  });

log('Creating Drizzle instance...');
export const db = drizzle({ client: pool, schema });
log('Database module initialization complete');

// Export a function to check connection status
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    log('Checking database connection...');
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    log('Database check successful');
    return true;
  } catch (error) {
    log('Database check failed', error);
    return false;
  }
}