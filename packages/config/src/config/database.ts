/**
 * Production Database Configuration
 * Optimized database settings for production deployment
 */

import { Pool, type PoolConfig } from 'pg';
import { log as logger } from '../utils/logger';

interface DatabaseConfig extends PoolConfig {
  ssl?: boolean | object;
  connectionTimeoutMillis: number;
  idleTimeoutMillis: number;
  statement_timeout?: number;
  query_timeout?: number;
}

/**
 * Get optimized database configuration for production
 */
export function getProductionDatabaseConfig(): DatabaseConfig {
  const isProduction = process.env.NODE_ENV === 'production';

  const config: DatabaseConfig = {
    // Connection settings
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,

    // Production connection pooling
    min: isProduction ? 2 : 1, // Minimum connections in pool
    max: isProduction ? 20 : 5, // Maximum connections in pool

    // Timeout settings
    connectionTimeoutMillis: 10000, // 10 seconds to establish connection
    idleTimeoutMillis: 300000, // 5 minutes for idle connections
    statement_timeout: 30000, // 30 seconds for SQL statements
    query_timeout: 30000, // 30 seconds for queries

    // SSL configuration for production
    ssl: isProduction
      ? {
          rejectUnauthorized: false, // Allow self-signed certificates (common in cloud)
          sslmode: 'require',
        }
      : false,

    // Application name for monitoring
    application_name: `ai-glossary-pro-${process.env.NODE_ENV || 'development'}`,

    // Keep connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  };

  // Use DATABASE_URL if provided (common in cloud deployments)
  if (process.env.DATABASE_URL) {
    const dbUrl = new URL(process.env.DATABASE_URL);

    config.host = dbUrl.hostname;
    config.port = parseInt(dbUrl.port) || 5432;
    config.database = dbUrl.pathname.slice(1); // Remove leading slash
    config.user = dbUrl.username;
    config.password = dbUrl.password;

    // Extract SSL mode from search params
    const sslMode = dbUrl.searchParams.get('sslmode');
    if (sslMode === 'require' || sslMode === 'prefer') {
      config.ssl = {
        rejectUnauthorized: false,
        sslmode: sslMode,
      };
    }
  }

  return config;
}

/**
 * Create optimized database pool for production
 */
export function createProductionDatabasePool(): Pool {
  const config = getProductionDatabaseConfig();

  logger.info('Creating database pool with configuration:', {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    min: config.min,
    max: config.max,
    ssl: !!config.ssl,
    application_name: config.application_name,
  });

  const pool = new Pool(config);

  // Pool event handlers for monitoring
  pool.on('connect', client => {
    logger.debug('Database client connected', {
      processID: client.processID,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    });
  });

  pool.on('acquire', client => {
    logger.debug('Database client acquired', {
      processID: client.processID,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    });
  });

  pool.on('remove', client => {
    logger.debug('Database client removed', {
      processID: client.processID,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    });
  });

  pool.on('error', (err, client) => {
    logger.error('Database pool error:', {
      error: err.message,
      processID: client?.processID,
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    });
  });

  return pool;
}

/**
 * Database health check optimized for production
 */
export async function checkDatabaseHealth(pool: Pool): Promise<{
  healthy: boolean;
  responseTime: number;
  connectionInfo: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
  serverInfo?: {
    version: string;
    timezone: string;
    encoding: string;
  };
  error?: string;
}> {
  const startTime = Date.now();

  try {
    const client = await pool.connect();

    try {
      // Test basic connectivity
      const result = await client.query(
        'SELECT NOW(), version(), current_setting($1), current_setting($2)',
        ['timezone', 'server_encoding']
      );

      const responseTime = Date.now() - startTime;
      const row = result.rows[0];

      return {
        healthy: true,
        responseTime,
        connectionInfo: {
          totalCount: pool.totalCount,
          idleCount: pool.idleCount,
          waitingCount: pool.waitingCount,
        },
        serverInfo: {
          version: `${row.version.split(' ')[0]  } ${  row.version.split(' ')[1]}`, // e.g., "PostgreSQL 14.5"
          timezone: row.current_setting,
          encoding: row.current_setting,
        },
      };
    } finally {
      client.release();
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;

    return {
      healthy: false,
      responseTime,
      connectionInfo: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
      error: error instanceof Error ? error.message : 'Unknown database error',
    };
  }
}

/**
 * Get database performance metrics
 */
export async function getDatabaseMetrics(pool: Pool): Promise<{
  connectionPool: {
    total: number;
    idle: number;
    waiting: number;
    utilization: number;
  };
  performance: {
    avgQueryTime?: number;
    slowQueries?: number;
    connectionsPerSecond?: number;
  };
  storage?: {
    totalSize?: string;
    indexSize?: string;
    tableCount?: number;
  };
}> {
  try {
    const client = await pool.connect();

    try {
      // Get database size information
      const sizeQuery = `
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as total_size,
          (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count
      `;

      const sizeResult = await client.query(sizeQuery);
      const sizeRow = sizeResult.rows[0];

      return {
        connectionPool: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount,
          utilization:
            Math.round(((pool.totalCount - pool.idleCount) / pool.totalCount) * 100) || 0,
        },
        performance: {
          // These would need pg_stat_statements extension for real metrics
          avgQueryTime: undefined,
          slowQueries: undefined,
          connectionsPerSecond: undefined,
        },
        storage: {
          totalSize: sizeRow.total_size,
          tableCount: parseInt(sizeRow.table_count),
        },
      };
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error getting database metrics:', error);

    return {
      connectionPool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
        utilization: 0,
      },
      performance: {},
      storage: {},
    };
  }
}

/**
 * Gracefully close database pool
 */
export async function closeDatabasePool(pool: Pool): Promise<void> {
  try {
    logger.info('Closing database pool...');
    await pool.end();
    logger.info('Database pool closed successfully');
  } catch (error) {
    logger.error('Error closing database pool:', error);
    throw error;
  }
}

/**
 * Database maintenance utilities for production
 */
export class DatabaseMaintenance {
  constructor(private pool: Pool) {}

  /**
   * Analyze database tables for performance optimization
   */
  async analyzeTables(): Promise<void> {
    const client = await this.pool.connect();

    try {
      logger.info('Starting database table analysis...');

      // Get all user tables
      const tablesResult = await client.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
      `);

      // Analyze each table
      for (const row of tablesResult.rows) {
        const tableName = row.tablename;
        logger.debug(`Analyzing table: ${tableName}`);

        await client.query(`ANALYZE "${tableName}"`);
      }

      logger.info('Database table analysis completed');
    } finally {
      client.release();
    }
  }

  /**
   * Get table statistics for monitoring
   */
  async getTableStatistics(): Promise<
    Array<{
      tableName: string;
      rowCount: number;
      totalSize: string;
      indexSize: string;
    }>
  > {
    const client = await this.pool.connect();

    try {
      const result = await client.query(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname
      `);

      // Group by table
      const tables = new Map();

      for (const row of result.rows) {
        if (!tables.has(row.tablename)) {
          tables.set(row.tablename, {
            tableName: row.tablename,
            columns: [],
          });
        }

        tables.get(row.tablename).columns.push({
          column: row.attname,
          distinctValues: row.n_distinct,
          correlation: row.correlation,
        });
      }

      return Array.from(tables.values());
    } finally {
      client.release();
    }
  }

  /**
   * Check for missing indexes
   */
  async checkMissingIndexes(): Promise<
    Array<{
      table: string;
      column: string;
      reason: string;
    }>
  > {
    const client = await this.pool.connect();

    try {
      // This is a simplified version - in practice, you'd analyze query logs
      const result = await client.query(`
        SELECT 
          t.table_name,
          c.column_name,
          c.data_type
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public'
          AND c.column_name IN ('id', 'created_at', 'updated_at', 'user_id', 'category_id')
          AND NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = t.table_name 
            AND indexdef LIKE '%' || c.column_name || '%'
          )
      `);

      return result.rows.map(row => ({
        table: row.table_name,
        column: row.column_name,
        reason: 'Common lookup column without index',
      }));
    } finally {
      client.release();
    }
  }
}
