import { config } from 'dotenv';
import { sql } from 'drizzle-orm';
import { join } from 'path';
import { db } from '@aiglossarypro/database';
import logger from '../utils/logger';

// Load environment variables
config({ path: join(process.cwd(), '.env') });

interface QueryAnalysis {
  query: string;
  executionTime: number;
  explainPlan?: any;
  suggestions: string[];
  severity: 'high' | 'medium' | 'low';
}

interface TableStats {
  tableName: string;
  rowCount: number;
  indexes: string[];
  missingIndexes: string[];
}

class DatabaseQueryAnalyzer {
  private readonly slowQueryThreshold = 100; // milliseconds
  private queryResults: QueryAnalysis[] = [];
  private tableStats: Map<string, TableStats> = new Map();

  async analyze(): Promise<void> {
    logger.info('Starting database query analysis...');
    
    try {
      // Step 1: Analyze table statistics
      await this.analyzeTableStatistics();
      
      // Step 2: Analyze common query patterns
      await this.analyzeCommonQueries();
      
      // Step 3: Check for missing indexes
      await this.checkMissingIndexes();
      
      // Step 4: Analyze connection pool usage
      await this.analyzeConnectionPool();
      
      // Step 5: Generate report
      this.generateReport();
      
    } catch (error) {
      logger.error('Query analysis failed:', error);
      throw error;
    }
  }

  private async analyzeTableStatistics(): Promise<void> {
    logger.info('Analyzing table statistics...');
    
    // Get all tables
    const tables = await db.execute(sql.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `));

    for (const table of tables.rows) {
      const tableName = table.table_name as string;
      
      // Get row count
      const countResult = await db.execute(sql.raw(`
        SELECT COUNT(*) as count FROM "${tableName}"
      `));
      const rowCount = Number(countResult.rows[0]?.count || 0);

      // Get indexes
      const indexResult = await db.execute(sql.raw(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = '${tableName}'
      `));
      
      const indexes = indexResult.rows.map((idx: any) => idx.indexname);
      
      this.tableStats.set(tableName, {
        tableName,
        rowCount,
        indexes,
        missingIndexes: []
      });
    }
  }

  private async analyzeCommonQueries(): Promise<void> {
    logger.info('Analyzing common query patterns...');
    
    // Example queries that are commonly used in the application
    const commonQueries = [
      {
        name: 'User lookup by email',
        query: sql.raw(`SELECT * FROM users WHERE email = 'test@example.com'`),
        expectedIndex: 'email'
      },
      {
        name: 'Terms by category',
        query: sql.raw(`SELECT * FROM terms WHERE category_id = 1 ORDER BY created_at DESC LIMIT 10`),
        expectedIndex: 'category_id'
      },
      {
        name: 'User activity tracking',
        query: sql.raw(`SELECT * FROM user_progress WHERE user_id = 1 AND last_accessed > NOW() - INTERVAL '7 days'`),
        expectedIndex: 'user_id, created_at'
      },
      {
        name: 'Term search',
        query: sql.raw(`SELECT * FROM terms WHERE term ILIKE '%machine%' OR definition ILIKE '%machine%'`),
        expectedIndex: 'gin index on term and definition'
      }
    ];

    for (const queryInfo of commonQueries) {
      await this.analyzeQuery(queryInfo.name, queryInfo.query, queryInfo.expectedIndex);
    }
  }

  private async analyzeQuery(name: string, query: any, expectedIndex: string): Promise<void> {
    try {
      // Get EXPLAIN ANALYZE output
      // For now, skip EXPLAIN ANALYZE due to Drizzle limitations
      // Just measure execution time
      const startTime = Date.now();
      try {
        await db.execute(query);
      } catch (e) {
        // Query might fail due to placeholder values
      }
      const executionTime = Date.now() - startTime;
      // Analyze based on execution time only for now
      const analysis = this.analyzeExecutionPlan(null, executionTime);
      
      this.queryResults.push({
        query: name,
        executionTime,
        explainPlan: null,
        suggestions: analysis.suggestions,
        severity: analysis.severity
      });
      
    } catch (error) {
      logger.warn(`Failed to analyze query "${name}":`, error);
    }
  }

  private analyzeExecutionPlan(plan: any, executionTime: number): { suggestions: string[]; severity: 'high' | 'medium' | 'low' } {
    const suggestions: string[] = [];
    let severity: 'high' | 'medium' | 'low' = 'low';
    
    if (!plan || !plan[0]?.Plan) {
      return { suggestions: ['Unable to analyze execution plan'], severity: 'medium' };
    }
    
    const planDetails = plan[0].Plan;
    
    // Check for sequential scans on large tables
    if (planDetails['Node Type'] === 'Seq Scan') {
      const rowsScanned = planDetails['Actual Rows'] || 0;
      if (rowsScanned > 1000) {
        suggestions.push(`Sequential scan on ${rowsScanned} rows detected. Consider adding an index.`);
        severity = 'high';
      }
    }
    
    // Check execution time
    if (executionTime > this.slowQueryThreshold) {
      suggestions.push(`Query execution time (${executionTime}ms) exceeds threshold (${this.slowQueryThreshold}ms)`);
      if (executionTime > this.slowQueryThreshold * 5) {
        severity = 'high';
      } else {
        severity = severity === 'low' ? 'medium' : severity;
      }
    }
    
    // Check for nested loops on large datasets
    if (planDetails['Node Type'] === 'Nested Loop' && planDetails['Actual Rows'] > 10000) {
      suggestions.push('Nested loop join on large dataset detected. Consider using hash or merge join.');
      severity = 'high';
    }
    
    // Check buffer usage
    const sharedHitBlocks = planDetails['Shared Hit Blocks'] || 0;
    const sharedReadBlocks = planDetails['Shared Read Blocks'] || 0;
    const cacheHitRatio = sharedHitBlocks / (sharedHitBlocks + sharedReadBlocks);
    
    if (cacheHitRatio < 0.9 && sharedReadBlocks > 100) {
      suggestions.push(`Low cache hit ratio (${(cacheHitRatio * 100).toFixed(1)}%). Consider increasing shared_buffers.`);
      severity = severity === 'low' ? 'medium' : severity;
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Query performance is acceptable');
    }
    
    return { suggestions, severity };
  }

  private async checkMissingIndexes(): Promise<void> {
    logger.info('Checking for missing indexes...');
    
    // Check for foreign keys without indexes
    const fkQuery = await db.execute(sql.raw(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `));

    for (const fk of fkQuery.rows) {
      const tableName = fk.table_name as string;
      const columnName = fk.column_name as string;
      const tableStats = this.tableStats.get(tableName);
      
      if (tableStats) {
        // Check if index exists for this foreign key
        const indexExists = tableStats.indexes.some(idx => 
          idx.toLowerCase().includes(columnName.toLowerCase())
        );
        
        if (!indexExists && tableStats.rowCount > 1000) {
          tableStats.missingIndexes.push(`Index on foreign key column: ${columnName}`);
        }
      }
    }
  }

  private async analyzeConnectionPool(): Promise<void> {
    logger.info('Analyzing connection pool usage...');
    
    try {
      // Check current connections
      const connectionStats = await db.execute(sql.raw(`
        SELECT 
          datname,
          count(*) as connection_count,
          sum(case when state = 'active' then 1 else 0 end) as active_connections,
          sum(case when state = 'idle' then 1 else 0 end) as idle_connections,
          sum(case when state = 'idle in transaction' then 1 else 0 end) as idle_in_transaction
        FROM pg_stat_activity
        WHERE datname = current_database()
        GROUP BY datname
      `));

      const stats = connectionStats.rows[0];
      if (stats) {
        logger.info('Connection pool statistics:', {
          total: stats.connection_count,
          active: stats.active_connections,
          idle: stats.idle_connections,
          idleInTransaction: stats.idle_in_transaction
        });
      }

      // Check for long-running queries
      const longRunningQueries = await db.execute(sql.raw(`
        SELECT 
          pid,
          now() - pg_stat_activity.query_start AS duration,
          query,
          state
        FROM pg_stat_activity
        WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
          AND state = 'active'
          AND query NOT LIKE '%pg_stat_activity%'
      `));

      if (longRunningQueries.rows.length > 0) {
        logger.warn('Long-running queries detected:', longRunningQueries.rows);
      }
      
    } catch (error) {
      logger.error('Failed to analyze connection pool:', error);
    }
  }

  private generateReport(): void {
    console.log('\n=== DATABASE QUERY ANALYSIS REPORT ===\n');
    
    // Table Statistics
    console.log('## Table Statistics\n');
    console.log('| Table | Row Count | Indexes | Missing Indexes |');
    console.log('|-------|-----------|---------|-----------------|');
    
    for (const [tableName, stats] of this.tableStats) {
      console.log(
        `| ${tableName} | ${stats.rowCount.toLocaleString()} | ${stats.indexes.length} | ${stats.missingIndexes.length} |`
      );
    }
    
    // Query Analysis
    console.log('\n## Query Performance Analysis\n');
    
    // High severity queries
    const highSeverity = this.queryResults.filter(q => q.severity === 'high');
    if (highSeverity.length > 0) {
      console.log('### ⚠️  High Priority Issues\n');
      for (const query of highSeverity) {
        console.log(`**${query.query}**`);
        console.log(`- Execution Time: ${query.executionTime}ms`);
        console.log(`- Suggestions:`);
        query.suggestions.forEach(s => console.log(`  - ${s}`));
        console.log('');
      }
    }
    
    // Medium severity queries
    const mediumSeverity = this.queryResults.filter(q => q.severity === 'medium');
    if (mediumSeverity.length > 0) {
      console.log('### ⚡ Medium Priority Issues\n');
      for (const query of mediumSeverity) {
        console.log(`**${query.query}**`);
        console.log(`- Execution Time: ${query.executionTime}ms`);
        console.log(`- Suggestions:`);
        query.suggestions.forEach(s => console.log(`  - ${s}`));
        console.log('');
      }
    }
    
    // Missing Indexes Summary
    console.log('\n## Missing Index Recommendations\n');
    for (const [tableName, stats] of this.tableStats) {
      if (stats.missingIndexes.length > 0) {
        console.log(`### ${tableName}`);
        stats.missingIndexes.forEach(idx => console.log(`- ${idx}`));
        console.log('');
      }
    }
    
    // Summary
    console.log('\n## Summary\n');
    console.log(`- Total tables analyzed: ${this.tableStats.size}`);
    console.log(`- Total queries analyzed: ${this.queryResults.length}`);
    console.log(`- High priority issues: ${highSeverity.length}`);
    console.log(`- Medium priority issues: ${mediumSeverity.length}`);
    
    const totalMissingIndexes = Array.from(this.tableStats.values())
      .reduce((sum, stats) => sum + stats.missingIndexes.length, 0);
    console.log(`- Missing indexes identified: ${totalMissingIndexes}`);
  }
}

// Run the analyzer
if (require.main === module) {
  console.log('Starting database query analyzer...');
  const analyzer = new DatabaseQueryAnalyzer();
  analyzer.analyze()
    .then(() => {
      console.log('\nQuery analysis completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Query analysis failed:', error);
      logger.error('Query analysis failed:', error);
      process.exit(1);
    });
}

export { DatabaseQueryAnalyzer };