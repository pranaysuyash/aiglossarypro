/**
 * Database wrapper that selects the appropriate implementation
 * based on the runtime environment
 */

// Enhanced ECS detection with multiple fallbacks
const isECS = !!(
  process.env.ECS_CONTAINER_METADATA_URI || 
  process.env.ECS_CONTAINER_METADATA_URI_V4 ||
  process.env.AWS_EXECUTION_ENV || 
  process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
  process.env.USE_STANDARD_PG === 'true'
);

console.log(`[DB-WRAPPER] Environment detection:`);
console.log(`[DB-WRAPPER] - NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[DB-WRAPPER] - ECS_CONTAINER_METADATA_URI: ${process.env.ECS_CONTAINER_METADATA_URI}`);
console.log(`[DB-WRAPPER] - ECS_CONTAINER_METADATA_URI_V4: ${process.env.ECS_CONTAINER_METADATA_URI_V4}`);
console.log(`[DB-WRAPPER] - AWS_EXECUTION_ENV: ${process.env.AWS_EXECUTION_ENV}`);
console.log(`[DB-WRAPPER] - AWS_CONTAINER_CREDENTIALS_RELATIVE_URI: ${process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI}`);
console.log(`[DB-WRAPPER] - USE_STANDARD_PG: ${process.env.USE_STANDARD_PG}`);
console.log(`[DB-WRAPPER] - Detected ECS environment: ${isECS}`);
console.log(`[DB-WRAPPER] - Will use: ${isECS ? 'standard pg driver (db-ecs)' : '@neondatabase/serverless (db)'}`);

// Use static imports instead of require() for better ESM compatibility
let dbModule: any;

try {
  if (isECS) {
    console.log('[DB-WRAPPER] Loading ECS-compatible database module');
    dbModule = require('./db-ecs');
  } else {
    console.log('[DB-WRAPPER] Loading serverless database module');
    dbModule = require('./db');
  }
  
  console.log('[DB-WRAPPER] Database module loaded successfully');
} catch (error) {
  console.error('[DB-WRAPPER] Failed to load database module:', error);
  console.log('[DB-WRAPPER] Falling back to ECS module as safety measure');
  dbModule = require('./db-ecs');
}

// Export everything from the selected module
export const { db, pool, testConnection, closePool } = dbModule;