// Database package exports
// Export default db connection
export { db, pool } from './db';

// Export monitored db and functions
export { 
  db as monitoredDb, 
  pool as monitoredPool,
  checkDatabaseHealth,
  getPoolMetrics 
} from './db-monitored';

// Export db directory modules
export * from './db/pool-monitor';
export * from './db/support-schema';