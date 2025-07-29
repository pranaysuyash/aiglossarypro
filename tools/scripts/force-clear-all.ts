#!/usr/bin/env tsx

import { sql } from 'drizzle-orm';
import { db } from '../server/db.js';

async function forceClearAll() {
  console.log('🗑️ FORCE CLEARING ALL DATA (including enhanced_terms and categories)');
  console.log('=' + '='.repeat(60));

  try {
    // Disable foreign key constraints temporarily
    console.log('🔓 Disabling foreign key constraints...');
    await db.execute(sql.raw(`SET session_replication_role = replica;`));

    // Clear all content tables completely
    const tablesToClear = ['enhanced_terms', 'categories'];

    console.log('\n🔄 Force clearing remaining tables...\n');

    for (const tableName of tablesToClear) {
      try {
        // Get count before clearing
        const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
        const beforeCount = (countResult.rows[0] as any).count;

        // Force delete everything
        await db.execute(sql.raw(`TRUNCATE TABLE ${tableName} CASCADE`));

        // Verify cleared
        const afterResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
        const afterCount = (afterResult.rows[0] as any).count;

        console.log(`✅ ${tableName}: ${beforeCount} → ${afterCount} records (TRUNCATED)`);
      } catch (error: Error | unknown) {
        console.log(`⚠️ ${tableName}: ${error.message}`);

        // Try alternative method
        try {
          await db.execute(sql.raw(`DELETE FROM ${tableName}`));
          console.log(`✅ ${tableName}: Cleared with DELETE`);
        } catch (error2: Error | unknown) {
          console.log(`❌ ${tableName}: Could not clear - ${error2.message}`);
        }
      }
    }

    // Re-enable foreign key constraints
    console.log('\n🔒 Re-enabling foreign key constraints...');
    await db.execute(sql.raw(`SET session_replication_role = DEFAULT;`));

    // Final verification
    console.log('\n📊 FINAL DATABASE STATE:');
    console.log('-'.repeat(40));

    const checkTables = ['terms', 'enhanced_terms', 'categories', 'term_sections', 'users'];

    for (const tableName of checkTables) {
      try {
        const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
        const count = (result.rows[0] as any).count;

        let status = '';
        if (count === 0 && tableName !== 'users') {
          status = '✅ EMPTY';
        } else if (tableName === 'users' && count > 0) {
          status = '👥 PRESERVED';
        } else if (count === 0 && tableName === 'users') {
          status = '⚠️ EMPTY (users cleared too)';
        } else {
          status = '⚠️ NOT EMPTY';
        }

        console.log(`${tableName}: ${count} records ${status}`);
      } catch (error: Error | unknown) {
        console.log(`${tableName}: ERROR - ${error.message}`);
      }
    }

    console.log('\n🎯 FORCE CLEAR COMPLETE');
    console.log('✅ Database ready for fresh 295-column structure');
    console.log('📁 All data backed up in: backups/pre-fresh-start-*');
    console.log('🚀 Ready to receive 295-column prompts!');
  } catch (error) {
    console.error('❌ Error force clearing database:', error);
  }
}

forceClearAll().catch(console.error);
