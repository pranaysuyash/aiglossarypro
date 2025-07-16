#!/usr/bin/env tsx

import { pool } from '../server/db.js';

/**
 * EMERGENCY FIX: Resolve critical data synchronization issue
 * between basic terms and enhanced terms tables
 */

interface TermMapping {
  basicId: string;
  enhancedId: string;
  name: string;
  matchType: 'exact' | 'similar';
}

async function emergencyTermSyncFix() {
  console.log('🚨 EMERGENCY: Fixing critical term synchronization issue...\n');

  const client = await pool.connect();

  try {
    // 1. Create term mapping table if it doesn't exist
    console.log('📋 Creating term mapping table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS term_mappings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        basic_term_id UUID NOT NULL,
        enhanced_term_id UUID NOT NULL,
        term_name VARCHAR(500) NOT NULL,
        match_confidence FLOAT DEFAULT 1.0,
        sync_status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(basic_term_id, enhanced_term_id)
      );
    `);

    // 2. Find terms that exist in both tables by name matching
    console.log('🔍 Finding matching terms between basic and enhanced tables...');

    const matchingTerms = await client.query(`
      SELECT 
        t.id as basic_id,
        t.name as basic_name,
        et.id as enhanced_id,
        et.name as enhanced_name,
        CASE 
          WHEN LOWER(TRIM(t.name)) = LOWER(TRIM(et.name)) THEN 'exact'
          ELSE 'similar'
        END as match_type
      FROM terms t
      INNER JOIN enhanced_terms et ON LOWER(TRIM(t.name)) = LOWER(TRIM(et.name))
      ORDER BY t.name;
    `);

    console.log(`✅ Found ${matchingTerms.rows.length} matching terms`);

    // 3. Insert mappings
    console.log('🔗 Creating term mappings...');

    let mappingsCreated = 0;
    for (const match of matchingTerms.rows) {
      try {
        await client.query(
          `
          INSERT INTO term_mappings (basic_term_id, enhanced_term_id, term_name, match_confidence, sync_status)
          VALUES ($1, $2, $3, $4, 'synced')
          ON CONFLICT (basic_term_id, enhanced_term_id) DO NOTHING;
        `,
          [
            match.basic_id,
            match.enhanced_id,
            match.basic_name,
            match.match_type === 'exact' ? 1.0 : 0.9,
          ]
        );
        mappingsCreated++;
      } catch (error) {
        console.warn(`⚠️  Could not create mapping for "${match.basic_name}":`, error.message);
      }
    }

    console.log(`✅ Created ${mappingsCreated} term mappings`);

    // 4. Special fix for "Characteristic Function"
    console.log('🎯 Special fix for Characteristic Function...');

    const characteristicFunctionMapping = await client.query(`
      SELECT basic_term_id, enhanced_term_id FROM term_mappings 
      WHERE term_name = 'Characteristic Function';
    `);

    if (characteristicFunctionMapping.rows.length > 0) {
      const mapping = characteristicFunctionMapping.rows[0];
      console.log(`✅ Characteristic Function mapping confirmed:`);
      console.log(`   Basic ID: ${mapping.basic_term_id}`);
      console.log(`   Enhanced ID: ${mapping.enhanced_term_id}`);
    } else {
      console.log('❌ No mapping found for Characteristic Function');
    }

    // 5. Add relationship columns to existing tables (if they don't exist)
    console.log('🔧 Adding relationship columns...');

    try {
      await client.query(`
        ALTER TABLE terms ADD COLUMN IF NOT EXISTS enhanced_term_id UUID;
        ALTER TABLE enhanced_terms ADD COLUMN IF NOT EXISTS basic_term_id UUID;
      `);
      console.log('✅ Relationship columns added');
    } catch (_error) {
      console.log('ℹ️  Relationship columns already exist or could not be added');
    }

    // 6. Update tables with cross-references
    console.log('🔄 Updating cross-references...');

    const updateBasic = await client.query(`
      UPDATE terms 
      SET enhanced_term_id = tm.enhanced_term_id, updated_at = NOW()
      FROM term_mappings tm 
      WHERE terms.id = tm.basic_term_id;
    `);

    const updateEnhanced = await client.query(`
      UPDATE enhanced_terms 
      SET basic_term_id = tm.basic_term_id, updated_at = NOW()
      FROM term_mappings tm 
      WHERE enhanced_terms.id = tm.enhanced_term_id;
    `);

    console.log(`✅ Updated ${updateBasic.rowCount} basic terms with enhanced references`);
    console.log(`✅ Updated ${updateEnhanced.rowCount} enhanced terms with basic references`);

    // 7. Verification
    console.log('\n🔍 VERIFICATION:');

    const verificationResults = await client.query(`
      SELECT 
        'Total Mappings' as metric,
        COUNT(*) as count
      FROM term_mappings
      UNION ALL
      SELECT 
        'Basic Terms with Enhanced Link' as metric,
        COUNT(*) as count
      FROM terms 
      WHERE enhanced_term_id IS NOT NULL
      UNION ALL
      SELECT 
        'Enhanced Terms with Basic Link' as metric,
        COUNT(*) as count
      FROM enhanced_terms 
      WHERE basic_term_id IS NOT NULL
      UNION ALL
      SELECT 
        'Characteristic Function Sync Status' as metric,
        COUNT(*) as count
      FROM term_mappings 
      WHERE term_name = 'Characteristic Function' AND sync_status = 'synced';
    `);

    verificationResults.rows.forEach(row => {
      console.log(`   ${row.metric}: ${row.count}`);
    });

    // 8. Create API helper function for term resolution
    console.log('\n📝 Creating term resolution helper...');

    await client.query(`
      CREATE OR REPLACE FUNCTION resolve_term_data(input_term_id UUID)
      RETURNS TABLE (
        basic_id UUID,
        enhanced_id UUID,
        name VARCHAR,
        has_enhanced_content BOOLEAN,
        section_count INTEGER
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          COALESCE(t.id, et.basic_term_id) as basic_id,
          COALESCE(et.id, t.enhanced_term_id) as enhanced_id,
          COALESCE(t.name, et.name) as name,
          (et.id IS NOT NULL) as has_enhanced_content,
          COALESCE((SELECT COUNT(*)::INTEGER FROM term_sections ts WHERE ts.term_id = et.id), 0) as section_count
        FROM terms t
        FULL OUTER JOIN enhanced_terms et ON (
          t.id = input_term_id OR 
          et.id = input_term_id OR
          t.enhanced_term_id = input_term_id OR 
          et.basic_term_id = input_term_id
        )
        WHERE t.id = input_term_id OR et.id = input_term_id;
      END;
      $$;
    `);

    console.log('✅ Term resolution function created');

    // 9. Test the resolution function with Characteristic Function
    console.log('\n🧪 Testing term resolution...');

    const testBasicId = '8b5bff9a-afb7-4691-a58e-adc2bf94f941';
    const testEnhancedId = '662ec15e-b90d-4836-bb00-4ac24c17e3af';

    const testResults = await client.query(
      `
      SELECT * FROM resolve_term_data($1)
      UNION ALL
      SELECT * FROM resolve_term_data($2);
    `,
      [testBasicId, testEnhancedId]
    );

    console.log('Test Results:');
    testResults.rows.forEach(row => {
      console.log(`   Name: ${row.name}`);
      console.log(`   Basic ID: ${row.basic_id}`);
      console.log(`   Enhanced ID: ${row.enhanced_id}`);
      console.log(`   Has Enhanced: ${row.has_enhanced_content}`);
      console.log(`   Section Count: ${row.section_count}`);
      console.log('   ---');
    });

    console.log('\n✅ EMERGENCY FIX COMPLETED SUCCESSFULLY!');
    console.log('\nNext Steps:');
    console.log('1. Update SmartTermDetail component to use resolve_term_data function');
    console.log('2. Update API endpoints to handle both basic and enhanced IDs');
    console.log('3. Re-run navigation tests with updated data resolution');
  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run emergency fix
emergencyTermSyncFix().catch(console.error);
