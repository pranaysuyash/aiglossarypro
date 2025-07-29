// Database package exports
// Export default db connection
export { db, pool } from './db.js';

// Export monitored db and functions
export { 
  db as monitoredDb, 
  pool as monitoredPool,
  checkDatabaseHealth,
  getPoolMetrics 
} from './db-monitored.js';

// Export db directory modules
export * from './db/pool-monitor.js';
export * from './db/support-schema.js';