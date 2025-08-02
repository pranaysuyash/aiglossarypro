#!/usr/bin/env node

console.log('='.repeat(80));
console.log('Database Connection Test');
console.log('='.repeat(80));

// Load environment
import dotenv from 'dotenv';
import path from 'path';

// Load production environment
const envPath = path.join(__dirname, '../../../.env.production');
dotenv.config({ path: envPath });

console.log(`[ENV] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[ENV] DATABASE_URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);

if (!process.env.DATABASE_URL) {
  console.error('[ERROR] DATABASE_URL is not set!');
  process.exit(1);
}

// Parse database URL
const dbUrl = process.env.DATABASE_URL;
const urlParts = dbUrl.match(/^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/(.+)$/);

if (urlParts) {
  console.log(`[DB] Host: ${urlParts[3]}`);
  console.log(`[DB] Port: ${urlParts[4] || '5432'}`);
  console.log(`[DB] Database: ${urlParts[5].split('?')[0]}`);
  console.log(`[DB] SSL: ${dbUrl.includes('sslmode=require') ? 'Required' : 'Not required'}`);
}

console.log('\n[TEST] Attempting to connect to database...\n');

import { Pool } from '@neondatabase/serverless';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket
neonConfig.webSocketConstructor = ws;

// Test with WebSocket
console.log('[TEST] Setting up WebSocket connection...');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? {
    rejectUnauthorized: false
  } : undefined
});

const startTime = Date.now();

pool.connect()
  .then(async (client) => {
    const connectTime = Date.now() - startTime;
    console.log(`[SUCCESS] Connected to database in ${connectTime}ms`);
    
    // Test query
    console.log('[TEST] Running test query: SELECT NOW()');
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log(`[SUCCESS] Query result:`, result.rows[0]);
    
    // Test table access
    console.log('[TEST] Checking if tables exist...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `);
    console.log(`[SUCCESS] Found ${tablesResult.rowCount} tables:`, tablesResult.rows.map(r => r.table_name));
    
    client.release();
    console.log('[SUCCESS] Connection test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    const failTime = Date.now() - startTime;
    console.error(`[ERROR] Failed to connect after ${failTime}ms`);
    console.error('[ERROR] Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      syscall: error.syscall,
      hostname: error.hostname
    });
    
    if (error.code === 'ENOTFOUND') {
      console.error('[ERROR] Cannot resolve database hostname. Check your network/DNS.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('[ERROR] Connection timed out. Database may be unreachable.');
    } else if (error.message.includes('SSL')) {
      console.error('[ERROR] SSL/TLS error. Check SSL configuration.');
    }
    
    process.exit(1);
  });