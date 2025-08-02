#!/usr/bin/env tsx
import * as dotenv from 'dotenv';

dotenv.config();

import { sql } from 'drizzle-orm';
import * as schema from '@aiglossarypro/shared';
import * as originalSchema from '@aiglossarypro/shared/schema';
import { db, pool } from '@aiglossarypro/database';

interface TableInfo {
  name: string;
  rowCount: number;
  exists: boolean;
  hasIndexes: boolean;
  indexCount: number;
}

interface DatabaseStatus {
  connected: boolean;
  databaseUrl: string;
  tables: TableInfo[];
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

async function checkDatabaseStatus(): Promise<DatabaseStatus> {
  const status: DatabaseStatus = {
    connected: false,
    databaseUrl: process.env.DATABASE_URL ? '✓ Configured' : '✗ Missing',
    tables: [],
    errors: [],
    warnings: [],
    recommendations: [],
  };

  // Check DATABASE_URL environment variable
  if (!process.env.DATABASE_URL) {
    status.errors.push('DATABASE_URL environment variable is not set');
    return status;
  }

  try {
    // Test database connection
    console.log('Testing database connection...');
    const connectionTest = await db.execute(sql`SELECT 1 as test`);
    if (connectionTest.rows[0]?.test === 1) {
      status.connected = true;
      console.log('✓ Database connection successful');
    }
  } catch (error) {
    status.errors.push(
      `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return status;
  }

  // Define all expected tables
  const expectedTables = [
    // Original schema tables
    { name: 'sessions', schema: originalSchema.sessions },
    { name: 'users', schema: originalSchema.users },
    { name: 'purchases', schema: originalSchema.purchases },
    { name: 'categories', schema: originalSchema.categories },
    { name: 'subcategories', schema: originalSchema.subcategories },
    { name: 'terms', schema: originalSchema.terms },
    { name: 'term_subcategories', schema: originalSchema.termSubcategories },
    { name: 'favorites', schema: originalSchema.favorites },
    { name: 'user_progress', schema: originalSchema.userProgress },
    { name: 'term_views', schema: originalSchema.termViews },
    { name: 'user_settings', schema: originalSchema.userSettings },

    // Enhanced schema tables
    { name: 'enhanced_terms', schema: schema.enhancedTerms },
    { name: 'term_sections', schema: schema.termSections },
    { name: 'interactive_elements', schema: schema.interactiveElements },
    { name: 'term_relationships', schema: schema.termRelationships },
    { name: 'display_configs', schema: schema.displayConfigs },
    { name: 'enhanced_user_settings', schema: schema.enhancedUserSettings },
    { name: 'content_analytics', schema: schema.contentAnalytics },
    { name: 'ai_content_feedback', schema: schema.aiContentFeedback },
    { name: 'ai_content_verification', schema: schema.aiContentVerification },
    { name: 'ai_usage_analytics', schema: schema.aiUsageAnalytics },
  ];

  // Check each table
  for (const table of expectedTables) {
    const tableInfo: TableInfo = {
      name: table.name,
      rowCount: 0,
      exists: false,
      hasIndexes: false,
      indexCount: 0,
    };

    try {
      // Check if table exists
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table.name}
        ) as exists
      `);

      tableInfo.exists = Boolean(tableExists.rows[0]?.exists || false);

      if (tableInfo.exists) {
        // Get row count
        const countResult = await db.execute(sql`
          SELECT COUNT(*) as count FROM ${sql.identifier(table.name)}
        `);
        tableInfo.rowCount = Number(countResult.rows[0]?.count || 0);

        // Check indexes
        const indexResult = await db.execute(sql`
          SELECT COUNT(*) as index_count
          FROM pg_indexes
          WHERE schemaname = 'public'
          AND tablename = ${table.name}
        `);
        tableInfo.indexCount = Number(indexResult.rows[0]?.index_count || 0);
        tableInfo.hasIndexes = tableInfo.indexCount > 0;
      } else {
        status.warnings.push(`Table '${table.name}' does not exist`);
      }
    } catch (error) {
      status.errors.push(
        `Error checking table '${table.name}': ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    status.tables.push(tableInfo);
  }

  // Check for bulk import optimization
  try {
    // Check work_mem setting (important for bulk operations)
    const workMemResult = await db.execute(sql`SHOW work_mem`);
    const workMem = workMemResult.rows[0]?.work_mem;
    console.log(`Current work_mem setting: ${workMem}`);

    // For bulk imports of 10k+ terms, recommend higher work_mem
    if (workMem && parseInt(String(workMem)) < 16) {
      status.recommendations.push(
        "Consider increasing work_mem to at least 16MB for bulk imports: SET work_mem = '16MB';"
      );
    }

    // Check maintenance_work_mem (important for index creation)
    const maintenanceMemResult = await db.execute(sql`SHOW maintenance_work_mem`);
    const maintenanceMem = maintenanceMemResult.rows[0]?.maintenance_work_mem;
    console.log(`Current maintenance_work_mem setting: ${maintenanceMem}`);

    if (maintenanceMem && parseInt(String(maintenanceMem)) < 64) {
      status.recommendations.push(
        "Consider increasing maintenance_work_mem to at least 64MB for faster index creation: SET maintenance_work_mem = '64MB';"
      );
    }
  } catch (_error) {
    status.warnings.push('Could not check database optimization settings');
  }

  // Check critical indexes for bulk import performance
  const criticalIndexes = [
    { table: 'enhanced_terms', column: 'name', importance: 'Critical for duplicate detection' },
    { table: 'enhanced_terms', column: 'slug', importance: 'Critical for unique constraints' },
    {
      table: 'term_sections',
      column: 'term_id',
      importance: 'Critical for foreign key performance',
    },
  ];

  for (const idx of criticalIndexes) {
    try {
      const indexExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1
          FROM pg_indexes
          WHERE schemaname = 'public'
          AND tablename = ${idx.table}
          AND indexdef ILIKE '%${idx.column}%'
        ) as exists
      `);

      if (!indexExists.rows[0]?.exists) {
        status.warnings.push(`Missing index on ${idx.table}.${idx.column} - ${idx.importance}`);
      }
    } catch (_error) {
      // Index check failed, but not critical
    }
  }

  // Add bulk import recommendations
  if (status.tables.find(t => t.name === 'enhanced_terms' && t.rowCount === 0)) {
    status.recommendations.push(
      'Database is empty. For bulk imports:',
      '1. Use CSV streaming for files > 100MB',
      '2. Process in batches of 1000 terms',
      '3. Consider disabling foreign key checks during import',
      '4. Run ANALYZE after bulk import for query optimization'
    );
  }

  return status;
}

// Main execution
async function main() {
  console.log('=== AI/ML Glossary Database Status Check ===\n');

  const status = await checkDatabaseStatus();

  console.log(`Database URL: ${status.databaseUrl}`);
  console.log(`Connection Status: ${status.connected ? '✓ Connected' : '✗ Disconnected'}\n`);

  if (status.errors.length > 0) {
    console.log('❌ ERRORS:');
    status.errors.forEach(error => console.log(`  - ${error}`));
    console.log();
  }

  if (status.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    status.warnings.forEach(warning => console.log(`  - ${warning}`));
    console.log();
  }

  console.log('📊 TABLE STATUS:');
  console.log('─'.repeat(80));
  console.log(`${'Table Name'.padEnd(30) + 'Exists'.padEnd(10) + 'Rows'.padEnd(15)}Indexes`);
  console.log('─'.repeat(80));

  status.tables.forEach(table => {
    const exists = table.exists ? '✓' : '✗';
    const rows = table.exists ? table.rowCount.toString() : '-';
    const indexes = table.exists ? `${table.indexCount} indexes` : '-';
    console.log(table.name.padEnd(30) + exists.padEnd(10) + rows.padEnd(15) + indexes);
  });

  console.log('─'.repeat(80));

  // Summary statistics
  const existingTables = status.tables.filter(t => t.exists).length;
  const totalRows = status.tables.reduce((sum, t) => sum + t.rowCount, 0);

  console.log(`\n📈 SUMMARY:`);
  console.log(`  - Tables: ${existingTables}/${status.tables.length} exist`);
  console.log(`  - Total Rows: ${totalRows.toLocaleString()}`);
  console.log(
    `  - Enhanced Terms: ${status.tables.find(t => t.name === 'enhanced_terms')?.rowCount || 0} terms`
  );
  console.log(
    `  - Original Terms: ${status.tables.find(t => t.name === 'terms')?.rowCount || 0} terms`
  );

  if (status.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    status.recommendations.forEach(rec => console.log(`  - ${rec}`));
  }

  // Exit with appropriate code
  if (status.errors.length > 0) {
    console.log('\n❌ Database check FAILED');
    process.exit(1);
  } else if (status.warnings.length > 0) {
    console.log('\n⚠️  Database check completed with warnings');
    process.exit(0);
  } else {
    console.log('\n✅ Database check PASSED');
    process.exit(0);
  }
}

// Error handling
main()
  .catch(error => {
    console.error('Fatal error during database check:', error);
    process.exit(1);
  })
  .finally(() => {
    // Ensure connection pool is closed
    pool.end();
  });
