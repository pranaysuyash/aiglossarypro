#!/usr/bin/env tsx

import { sql } from 'drizzle-orm';
import { db } from '../server/db';

async function completeReset() {
  console.log('🗑️ COMPLETE DATABASE RESET - FORCE CLEARING ALL DATA');
  console.log('=' + '='.repeat(60));

  try {
    console.log('\n⚠️ This will DELETE ALL DATA except user accounts');
    console.log('📁 Data has been backed up to: backups/pre-fresh-start-*\n');

    // Strategy: Drop and recreate problematic tables to bypass FK constraints
    const problematicTables = [
      {
        name: 'enhanced_terms',
        createSql: `
          CREATE TABLE enhanced_terms (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(200) NOT NULL UNIQUE,
            slug VARCHAR(250) NOT NULL UNIQUE,
            short_definition TEXT,
            full_definition TEXT NOT NULL,
            main_categories TEXT[] DEFAULT '{}',
            sub_categories TEXT[] DEFAULT '{}',
            related_concepts TEXT[] DEFAULT '{}',
            application_domains TEXT[] DEFAULT '{}',
            techniques TEXT[] DEFAULT '{}',
            difficulty_level VARCHAR(20),
            has_implementation BOOLEAN DEFAULT false,
            has_interactive_elements BOOLEAN DEFAULT false,
            has_case_studies BOOLEAN DEFAULT false,
            has_code_examples BOOLEAN DEFAULT false,
            search_text TEXT,
            keywords TEXT[] DEFAULT '{}',
            view_count INTEGER DEFAULT 0,
            last_viewed TIMESTAMP,
            parse_hash VARCHAR(32),
            parse_version VARCHAR(10) DEFAULT '1.0',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `,
      },
      {
        name: 'categories',
        createSql: `
          CREATE TABLE categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `,
      },
    ];

    console.log('🔄 Step 1: Force clearing dependent tables...\n');

    // Clear all dependent tables first
    const dependentTables = [
      'term_sections',
      'interactive_elements',
      'term_relationships',
      'term_subcategories',
      'subcategories',
      'term_views',
      'user_progress',
      'favorites',
      'user_settings',
    ];

    for (const tableName of dependentTables) {
      try {
        const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
        const count = (countResult.rows[0] as any).count;

        if (count > 0) {
          await db.execute(sql.raw(`DELETE FROM ${tableName}`));
          console.log(`✅ Cleared ${tableName}: ${count} records deleted`);
        } else {
          console.log(`✅ ${tableName}: Already empty`);
        }
      } catch (error: Error | unknown) {
        if (error.message.includes('does not exist')) {
          console.log(`✅ ${tableName}: Table doesn't exist`);
        } else {
          console.log(`⚠️ ${tableName}: ${error.message.split('\\n')[0]}`);
        }
      }
    }

    console.log('\n🔄 Step 2: Dropping and recreating problematic tables...\n');

    for (const { name, createSql } of problematicTables) {
      try {
        // Get count before dropping
        const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${name}`));
        const count = (countResult.rows[0] as any).count;

        // Drop table (CASCADE will handle FK constraints)
        await db.execute(sql.raw(`DROP TABLE IF EXISTS ${name} CASCADE`));
        console.log(`✅ Dropped ${name}: ${count} records removed`);

        // Recreate table
        await db.execute(sql.raw(createSql));
        console.log(`✅ Recreated ${name}: Fresh empty table`);
      } catch (error: Error | unknown) {
        console.log(`❌ ${name}: ${error.message.split('\\n')[0]}`);
      }
    }

    console.log('\n🔄 Step 3: Final verification...\n');

    // Verify all content tables are empty
    const allTables = [
      'terms',
      'enhanced_terms',
      'categories',
      'subcategories',
      'term_sections',
      'interactive_elements',
      'term_relationships',
      'term_subcategories',
      'term_views',
      'user_progress',
      'favorites',
      'user_settings',
      'users',
    ];

    let totalRecords = 0;
    let emptyCount = 0;

    for (const tableName of allTables) {
      try {
        const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
        const count = (result.rows[0] as any).count;
        totalRecords += count;

        let status = '';
        if (count === 0) {
          status = tableName === 'users' ? '⚠️ EMPTY (users cleared too!)' : '✅ EMPTY';
          emptyCount++;
        } else if (tableName === 'users') {
          status = '👥 PRESERVED';
        } else {
          status = '❌ STILL HAS DATA';
        }

        console.log(`${tableName.padEnd(20)}: ${String(count).padStart(6)} records ${status}`);
      } catch (error: Error | unknown) {
        console.log(`${tableName.padEnd(20)}: ERROR - Table may not exist`);
      }
    }

    console.log('-'.repeat(60));
    console.log(`Total records remaining: ${totalRecords}`);
    console.log(`Empty tables: ${emptyCount}/${allTables.length}`);

    // Success criteria
    const contentTables = allTables.filter(t => t !== 'users');
    const emptyContentTables = emptyCount - (totalRecords === 0 ? 1 : 0); // Subtract users if they're empty

    if (emptyContentTables === contentTables.length) {
      console.log('\n🎉 SUCCESS! All content tables cleared successfully');
      console.log('✅ Database ready for fresh 295-column structure');
      console.log('🚀 System prepared for new content pipeline');
    } else {
      console.log('\n⚠️ Some content tables still have data');
      console.log('💡 Manual cleanup may be needed for remaining tables');
    }

    console.log('\n📁 Original data backed up in: backups/pre-fresh-start-*');
  } catch (error) {
    console.error('❌ Error in complete reset:', error);
  }
}

completeReset().catch(console.error);
