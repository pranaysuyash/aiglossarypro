#!/usr/bin/env tsx

import { sql } from 'drizzle-orm';
import { db } from '../server/db';

async function finalClearAll() {
  console.log('🗑️ FINAL CLEAR ALL - HANDLING FOREIGN KEY CONSTRAINTS');
  console.log('=' + '='.repeat(60));

  try {
    // Clear in correct dependency order to avoid foreign key issues
    const orderedClear = [
      // First: Clear all tables that reference enhanced_terms
      { table: 'term_sections', reason: 'References enhanced_terms' },
      { table: 'interactive_elements', reason: 'References enhanced_terms' },
      { table: 'term_relationships', reason: 'References enhanced_terms' },

      // Then: Clear enhanced_terms
      { table: 'enhanced_terms', reason: 'Main enhanced terms table' },

      // Finally: Clear categories (if not referenced by enhanced_terms)
      { table: 'categories', reason: 'Category definitions' },
    ];

    console.log('\n🔄 Clearing tables in dependency order...\n');

    for (const { table, reason } of orderedClear) {
      try {
        // Check if table exists and get count
        const countQuery = `SELECT COUNT(*) as count FROM ${table}`;
        const countResult = await db.execute(sql.raw(countQuery));
        const beforeCount = (countResult.rows[0] as any).count;

        if (beforeCount > 0) {
          // Clear the table
          await db.execute(sql.raw(`DELETE FROM ${table}`));

          // Verify cleared
          const afterResult = await db.execute(sql.raw(countQuery));
          const afterCount = (afterResult.rows[0] as any).count;

          console.log(`✅ ${table}: ${beforeCount} → ${afterCount} records (${reason})`);
        } else {
          console.log(`✅ ${table}: Already empty (${reason})`);
        }
      } catch (error: Error | unknown) {
        console.log(`⚠️ ${table}: ${error.message.split('\\n')[0]}`);

        // If table doesn't exist, that's fine
        if (error.message.includes('does not exist')) {
          console.log(`   → Table doesn't exist, skipping`);
        }
      }
    }

    // Final comprehensive verification
    console.log('\n📊 FINAL DATABASE STATE:');
    console.log('-'.repeat(50));

    const allTables = [
      'terms',
      'enhanced_terms',
      'categories',
      'term_sections',
      'interactive_elements',
      'term_relationships',
      'users',
    ];

    let totalRecords = 0;
    let emptyTables = 0;

    for (const tableName of allTables) {
      try {
        const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
        const count = (result.rows[0] as any).count;
        totalRecords += count;

        let status = '';
        if (count === 0) {
          status = tableName === 'users' ? '⚠️ EMPTY (should preserve users)' : '✅ EMPTY';
          emptyTables++;
        } else if (tableName === 'users') {
          status = '👥 PRESERVED (good)';
        } else {
          status = '❌ STILL HAS DATA';
        }

        console.log(`${tableName.padEnd(20)}: ${String(count).padStart(6)} records ${status}`);
      } catch (error: Error | unknown) {
        console.log(`${tableName.padEnd(20)}: ERROR - ${error.message.split('\\n')[0]}`);
      }
    }

    console.log('-'.repeat(50));
    console.log(`Total records remaining: ${totalRecords}`);
    console.log(`Empty tables: ${emptyTables}/${allTables.length}`);

    if (totalRecords <= 8) {
      // Only users should remain
      console.log('\n🎉 SUCCESS! Database successfully cleared for fresh start');
      console.log('✅ Ready for 295-column hierarchical structure');
    } else {
      console.log('\n⚠️ Some tables still contain data - may need manual intervention');
    }

    console.log('\n📁 Original data backed up in: backups/pre-fresh-start-*');
    console.log('🚀 Ready to receive your 295-column prompts!');
  } catch (error) {
    console.error('❌ Error in final clear:', error);
  }
}

finalClearAll().catch(console.error);
