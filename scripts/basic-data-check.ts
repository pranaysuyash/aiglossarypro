#!/usr/bin/env tsx

import { sql } from 'drizzle-orm';
import { db } from '../server/db.js';

async function basicDatabaseCheck() {
  console.log('🔍 Basic Database Content Check\n');

  try {
    // Get table counts
    console.log('📊 TABLE COUNTS:');
    console.log('='.repeat(40));

    const counts = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM terms) as terms_count,
        (SELECT COUNT(*) FROM enhanced_terms) as enhanced_terms_count,
        (SELECT COUNT(*) FROM categories) as categories_count,
        (SELECT COUNT(*) FROM term_sections) as term_sections_count
    `);

    const result = counts.rows[0] as any;

    console.log(`Terms: ${result.terms_count}`);
    console.log(`Enhanced Terms: ${result.enhanced_terms_count}`);
    console.log(`Categories: ${result.categories_count}`);
    console.log(`Term Sections: ${result.term_sections_count}`);

    // Sample data from terms table
    console.log('\n🎯 SAMPLE TERMS:');
    console.log('='.repeat(40));

    const sampleTerms = await db.execute(sql`
      SELECT id, name, category, LEFT(definition, 100) as short_definition
      FROM terms 
      WHERE definition IS NOT NULL 
      LIMIT 5
    `);

    sampleTerms.rows.forEach((term: any, i) => {
      console.log(`${i + 1}. ${term.name} (${term.category})`);
      console.log(`   Definition: ${term.short_definition}...`);
    });

    // Sample categories
    console.log('\n📂 SAMPLE CATEGORIES:');
    console.log('='.repeat(40));

    const sampleCategories = await db.execute(sql`
      SELECT id, name FROM categories ORDER BY name LIMIT 10
    `);

    sampleCategories.rows.forEach((cat: any, i) => {
      console.log(`${i + 1}. ${cat.name} (ID: ${cat.id})`);
    });

    // Search test
    console.log('\n🔍 SEARCH TEST - Machine Learning:');
    console.log('='.repeat(40));

    const searchResults = await db.execute(sql`
      SELECT id, name, category 
      FROM terms 
      WHERE LOWER(name) LIKE '%machine learning%' 
      LIMIT 5
    `);

    if (searchResults.rows.length > 0) {
      console.log('✅ Found Machine Learning terms:');
      searchResults.rows.forEach((term: any) => {
        console.log(`   - ${term.name} (${term.category})`);
      });
    } else {
      console.log('❌ No Machine Learning terms found');
    }

    // Check for content quality issues
    console.log('\n⚠️ CONTENT QUALITY CHECK:');
    console.log('='.repeat(40));

    const qualityCheck = await db.execute(sql`
      SELECT 
        COUNT(*) as total_terms,
        COUNT(CASE WHEN definition IS NULL OR definition = '' THEN 1 END) as missing_definitions,
        COUNT(CASE WHEN category IS NULL OR category = '' THEN 1 END) as missing_categories,
        COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as missing_names
      FROM terms
    `);

    const quality = qualityCheck.rows[0] as any;

    console.log(`Total Terms: ${quality.total_terms}`);
    console.log(`Missing Definitions: ${quality.missing_definitions}`);
    console.log(`Missing Categories: ${quality.missing_categories}`);
    console.log(`Missing Names: ${quality.missing_names}`);

    const completeness = (
      ((quality.total_terms - quality.missing_definitions) / quality.total_terms) *
      100
    ).toFixed(1);
    console.log(`Definition Completeness: ${completeness}%`);

    console.log('\n✅ Basic database check completed');
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

basicDatabaseCheck().catch(console.error);
