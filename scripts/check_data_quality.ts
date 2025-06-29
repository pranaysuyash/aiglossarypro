#!/usr/bin/env tsx

// Use the existing database setup from the server
import { db } from '../server/db.js';
import { categories, terms, enhanced_terms } from '../server/schema.js';
import { sql, eq, like, desc, asc } from 'drizzle-orm';

async function checkDataQuality() {
  console.log('🔍 Checking Data Quality Issues...\n');

  try {
    // 1. Find categories with quotes or suspicious formatting
    console.log('📂 CHECKING FOR MALFORMED CATEGORIES:');
    console.log('=' .repeat(50));
    
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(desc(sql`length(name)`))
      .limit(20);

    console.log('\nTop 20 categories by name length:');
    allCategories.forEach((cat, i) => {
      const hasQuotes = cat.name.includes('"');
      const isSuspicious = cat.name.length > 50 || hasQuotes || cat.name.includes('...');
      const status = isSuspicious ? '❌' : '✅';
      
      console.log(`${i + 1}. ${status} [${cat.name.length}] "${cat.name}"`);
      if (isSuspicious) {
        console.log(`    ID: ${cat.id}`);
      }
    });

    // 2. Find specific terms for testing
    console.log('\n\n🎯 FINDING SPECIFIC TERMS FOR TESTS:');
    console.log('=' .repeat(50));
    
    const testTerms = [
      'Machine Learning',
      'Neural Network', 
      'Deep Learning',
      'Artificial Intelligence'
    ];

    for (const searchTerm of testTerms) {
      const found = await db
        .select({ 
          id: terms.id, 
          name: terms.name, 
          category: terms.category,
          categoryId: terms.categoryId 
        })
        .from(terms)
        .where(sql`LOWER(name) LIKE ${`%${searchTerm.toLowerCase()}%`}`)
        .limit(3);

      console.log(`\n🔍 "${searchTerm}":`);
      found.forEach(term => {
        console.log(`  ✅ ID: ${term.id}, Name: "${term.name}", Category: "${term.category}"`);
      });
    }

    // 3. Check for clean, usable categories
    console.log('\n\n✅ CLEAN CATEGORIES FOR NAVIGATION TESTS:');
    console.log('=' .repeat(50));
    
    const cleanCategories = await db
      .select()
      .from(categories)
      .where(sql`length(name) <= 30 AND name NOT LIKE '%"%' AND name NOT LIKE '%...%'`)
      .orderBy(asc(categories.name))
      .limit(10);

    cleanCategories.forEach((cat, i) => {
      console.log(`${i + 1}. ID: ${cat.id}, Name: "${cat.name}"`);
    });

    // 4. Count data discrepancies
    console.log('\n\n📊 DATA SUMMARY:');
    console.log('=' .repeat(50));
    
    const [basicTermCount] = await db.select({ count: sql<number>`count(*)` }).from(terms);
    const [enhancedTermCount] = await db.select({ count: sql<number>`count(*)` }).from(enhanced_terms);
    const [categoryCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
    
    console.log(`Basic Terms: ${basicTermCount.count}`);
    console.log(`Enhanced Terms: ${enhancedTermCount.count}`);
    console.log(`Categories: ${categoryCount.count}`);
    console.log(`Discrepancy: ${Math.abs(basicTermCount.count - enhancedTermCount.count)} terms`);

  } catch (error) {
    console.error('❌ Error checking data quality:', error);
  }
}

// Run the check
checkDataQuality().catch(console.error);