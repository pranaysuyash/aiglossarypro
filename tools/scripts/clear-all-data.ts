#!/usr/bin/env tsx

import { sql } from 'drizzle-orm';
import { db } from '../server/db.js';

async function clearAllData() {
  console.log('🗑️ CLEARING ALL DATABASE DATA FOR FRESH START');
  console.log('=' + '='.repeat(50));

  try {
    // Clear data in dependency order (child tables first)
    const clearOrder = [
      'term_views',
      'term_sections',
      'user_progress',
      'favorites',
      'term_subcategories',
      'enhanced_terms',
      'terms',
      'subcategories',
      'categories',
      'user_settings',
      // Keep users table for authentication
    ];

    console.log('\n🔄 Clearing tables in dependency order...\n');

    for (const tableName of clearOrder) {
      try {
        // Get count before clearing
        const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
        const beforeCount = (countResult.rows[0] as any).count;

        // Clear the table
        await db.execute(sql.raw(`DELETE FROM ${tableName}`));

        // Verify cleared
        const afterResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
        const afterCount = (afterResult.rows[0] as any).count;

        console.log(`✅ ${tableName}: ${beforeCount} → ${afterCount} records`);
      } catch (error: Error | unknown) {
        console.log(`⚠️ ${tableName}: ${error.message}`);
      }
    }

    // Reset sequences/auto-increment if needed
    console.log('\n🔄 Resetting sequences...');

    const sequenceResets = [
      'ALTER SEQUENCE IF EXISTS categories_id_seq RESTART WITH 1',
      'ALTER SEQUENCE IF EXISTS subcategories_id_seq RESTART WITH 1',
    ];

    for (const resetSql of sequenceResets) {
      try {
        await db.execute(sql.raw(resetSql));
        console.log(`✅ Reset sequence: ${resetSql.split(' ')[4]}`);
      } catch (error: Error | unknown) {
        console.log(`⚠️ Sequence reset: ${error.message}`);
      }
    }

    // Verify final state
    console.log('\n📊 FINAL DATABASE STATE:');
    console.log('-'.repeat(40));

    for (const tableName of ['terms', 'enhanced_terms', 'categories', 'term_sections', 'users']) {
      try {
        const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
        const count = (result.rows[0] as any).count;
        const status =
          count === 0 ? '✅ EMPTY' : tableName === 'users' ? '👥 PRESERVED' : '⚠️ NOT EMPTY';
        console.log(`${tableName}: ${count} records ${status}`);
      } catch (error: Error | unknown) {
        console.log(`${tableName}: ERROR - ${error.message}`);
      }
    }

    console.log('\n🎯 DATABASE CLEARING COMPLETE');
    console.log('✅ Ready for 295-column hierarchical structure');
    console.log('📁 Backup preserved at: backups/pre-fresh-start-*');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  }
}

clearAllData().catch(console.error);
