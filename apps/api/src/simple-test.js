#!/usr/bin/env node

console.log('[TEST] Starting simple connection test...');
console.log('[TEST] DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : false
});

console.log('[TEST] Attempting connection...');

pool.connect()
  .then(client => {
    console.log('[TEST] Connected successfully!');
    return client.query('SELECT NOW()');
  })
  .then(result => {
    console.log('[TEST] Query result:', result.rows[0]);
    process.exit(0);
  })
  .catch(err => {
    console.error('[TEST] Connection failed:', err.message);
    process.exit(1);
  });