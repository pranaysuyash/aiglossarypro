#!/usr/bin/env tsx

import { sql } from 'drizzle-orm';
import fs from 'fs';
import { db } from '../server/db.js';

async function backupDatabase() {
  console.log('🔄 Creating database backup...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `backups/pre-fresh-start-${timestamp}`;

  // Ensure backup directory exists
  fs.mkdirSync(backupDir, { recursive: true });

  const tables = ['terms', 'enhanced_terms', 'categories', 'term_sections', 'users', 'term_views'];
  const backup: any = {};

  for (const table of tables) {
    try {
      const result = await db.execute(sql.raw(`SELECT * FROM ${table}`));
      backup[table] = {
        count: result.rows.length,
        data: result.rows,
      };
      console.log(`✅ Backed up ${table}: ${result.rows.length} records`);
    } catch (error: any) {
      console.log(`⚠️ Error backing up ${table}:`, error.message);
      backup[table] = { count: 0, data: [], error: error.message };
    }
  }

  const backupFile = `${backupDir}/database_backup.json`;
  fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
  console.log(`💾 Backup saved to: ${backupFile}`);

  // Create summary
  const summary = {
    timestamp: new Date().toISOString(),
    tables: Object.keys(backup).map((table) => ({
      name: table,
      records: backup[table].count,
      hasError: Boolean(backup[table].error),
    })),
    totalRecords: Object.values(backup).reduce((sum: number, table: any) => sum + table.count, 0),
  };

  fs.writeFileSync(`${backupDir}/backup_summary.json`, JSON.stringify(summary, null, 2));
  console.log(`📋 Summary: ${summary.totalRecords} total records backed up`);
  console.log(`📁 Backup location: ${backupDir}`);
}

backupDatabase().catch(console.error);
