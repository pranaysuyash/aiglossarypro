#!/usr/bin/env tsx
import { sql } from 'drizzle-orm';
import { db } from '../server/db';
async function checkTableStructure() {
    console.log('🔍 Checking Database Table Structure\n');
    try {
        // Get terms table structure
        console.log('📋 TERMS TABLE STRUCTURE:');
        console.log('='.repeat(50));
        const termsStructure = await db.execute(sql `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'terms' 
      ORDER BY ordinal_position
    `);
        termsStructure.rows.forEach((col) => {
            console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
        // Get enhanced_terms table structure
        console.log('\n📋 ENHANCED_TERMS TABLE STRUCTURE:');
        console.log('='.repeat(50));
        const enhancedStructure = await db.execute(sql `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'enhanced_terms' 
      ORDER BY ordinal_position
    `);
        enhancedStructure.rows.forEach((col) => {
            console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
        // Get categories table structure
        console.log('\n📋 CATEGORIES TABLE STRUCTURE:');
        console.log('='.repeat(50));
        const categoriesStructure = await db.execute(sql `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'categories' 
      ORDER BY ordinal_position
    `);
        categoriesStructure.rows.forEach((col) => {
            console.log(`${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
        });
        // Sample data using correct column names
        console.log('\n🎯 SAMPLE TERMS DATA:');
        console.log('='.repeat(50));
        const sampleTerms = await db.execute(sql `
      SELECT id, name, SUBSTRING(definition, 1, 100) as short_definition
      FROM terms 
      WHERE definition IS NOT NULL 
      LIMIT 3
    `);
        sampleTerms.rows.forEach((term, i) => {
            console.log(`${i + 1}. ${term.name}`);
            console.log(`   Definition: ${term.short_definition}...`);
        });
        // Sample enhanced terms data
        console.log('\n⭐ SAMPLE ENHANCED TERMS DATA:');
        console.log('='.repeat(50));
        const sampleEnhanced = await db.execute(sql `
      SELECT id, name, category, 
             CASE WHEN code_examples IS NOT NULL THEN 'YES' ELSE 'NO' END as has_code_examples
      FROM enhanced_terms 
      LIMIT 3
    `);
        sampleEnhanced.rows.forEach((term, i) => {
            console.log(`${i + 1}. ${term.name} (${term.category})`);
            console.log(`   Code Examples: ${term.has_code_examples}`);
        });
        console.log('\n✅ Table structure check completed');
    }
    catch (error) {
        console.error('❌ Table structure check failed:', error);
    }
}
checkTableStructure().catch(console.error);
