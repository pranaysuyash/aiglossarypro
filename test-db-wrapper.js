#!/usr/bin/env node
/**
 * Quick test to verify db-wrapper works in ECS-like environment
 */

// Set environment variables to mimic ECS
process.env.NODE_ENV = 'production';
process.env.USE_STANDARD_PG = 'true';

console.log('=== DB Wrapper Test ===');
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('USE_STANDARD_PG:', process.env.USE_STANDARD_PG);
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);

try {
  // Test the module loading
  console.log('\n=== Testing Module Load ===');
  const { db, pool, testConnection } = require('./packages/database/dist/db-wrapper.js');
  
  console.log('Module loaded successfully');
  console.log('db instance:', typeof db);
  console.log('pool instance:', typeof pool);
  console.log('testConnection function:', typeof testConnection);
  
  if (process.env.DATABASE_URL && testConnection) {
    console.log('\n=== Testing Database Connection ===');
    testConnection().then(success => {
      console.log('Connection test result:', success);
      if (pool && typeof pool.end === 'function') {
        pool.end().then(() => {
          console.log('Pool closed successfully');
          process.exit(0);
        }).catch(err => {
          console.error('Error closing pool:', err);
          process.exit(1);
        });
      } else {
        process.exit(0);
      }
    }).catch(err => {
      console.error('Connection test error:', err);
      process.exit(1);
    });
  } else {
    console.log('Skipping connection test - no DATABASE_URL or testConnection');
    process.exit(0);
  }
  
} catch (error) {
  console.error('Failed to load database module:', error);
  process.exit(1);
}