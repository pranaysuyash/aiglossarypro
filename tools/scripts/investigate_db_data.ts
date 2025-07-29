#!/usr/bin/env tsx

import { asc, desc, eq, like, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { categories, enhanced_terms, terms } from '../server/schema.js';

// Database connection
const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/aiglossary';
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

async function investigateDatabase() {
  console.log('🔍 Investigating Database Data Structure...\n');

  try {
    // 1. Check for malformed category names (with quotes, long text, etc.)
    console.log('📂 CATEGORY DATA ANALYSIS:');
    console.log('='.repeat(50));

    const suspiciousCategories = await db
      .select()
      .from(categories)
      .where(sql`length(name) > 50 OR name LIKE '"%' OR name LIKE '"The %' OR name LIKE '%...%'`)
      .orderBy(desc(sql`length(name)`));

    console.log(`\n❌ Found ${suspiciousCategories.length} suspicious categories:`);
    suspiciousCategories.forEach((cat, i) => {
      console.log(`${i + 1}. ID: ${cat.id}`);
      console.log(`   Name: "${cat.name}"`);
      console.log(`   Length: ${cat.name.length} chars`);
      console.log(`   Created: ${cat.createdAt}`);
      console.log('---');
    });

    // 2. Check terms assigned to these malformed categories
    if (suspiciousCategories.length > 0) {
      console.log('\n📝 TERMS AFFECTED BY MALFORMED CATEGORIES:');
      console.log('='.repeat(50));

      for (const badCat of suspiciousCategories) {
        const affectedTerms = await db
          .select({ id: terms.id, name: terms.name, category: terms.category })
          .from(terms)
          .where(eq(terms.categoryId, badCat.id))
          .limit(5);

        console.log(`\nCategory: "${badCat.name}"`);
        console.log(`Affected terms (${affectedTerms.length} shown):`);
        affectedTerms.forEach(term => {
          console.log(`  - ${term.name} (${term.category})`);
        });
      }
    }

    // 3. Look for specific terms from row1.xlsx to use in tests
    console.log('\n🎯 SPECIFIC TERMS FROM ROW1.XLSX FOR TESTS:');
    console.log('='.repeat(50));

    const specificTerms = [
      'Machine Learning',
      'Artificial Intelligence',
      'Neural Network',
      'Deep Learning',
      'Characteristic Function',
      'Bayesian Neural Networks',
      'Convolutional Neural Network',
    ];

    for (const termName of specificTerms) {
      const foundTerms = await db
        .select({
          id: terms.id,
          name: terms.name,
          category: terms.category,
          categoryId: terms.categoryId,
        })
        .from(terms)
        .where(like(terms.name, `%${termName}%`))
        .limit(3);

      console.log(`\n🔍 Searching for "${termName}":`);
      if (foundTerms.length > 0) {
        foundTerms.forEach(term => {
          console.log(`  ✅ ID: ${term.id}`);
          console.log(`     Name: "${term.name}"`);
          console.log(`     Category: "${term.category}"`);
          console.log(`     CategoryID: ${term.categoryId}`);
        });
      } else {
        console.log(`  ❌ No terms found for "${termName}"`);
      }
    }

    // 4. Get some clean categories for testing
    console.log('\n✅ CLEAN CATEGORIES FOR TESTING:');
    console.log('='.repeat(50));

    const cleanCategories = await db
      .select()
      .from(categories)
      .where(sql`length(name) <= 50 AND name NOT LIKE '"%' AND name NOT LIKE '"The %'`)
      .orderBy(asc(categories.name))
      .limit(10);

    cleanCategories.forEach((cat, i) => {
      console.log(`${i + 1}. ID: ${cat.id}`);
      console.log(`   Name: "${cat.name}"`);
      console.log(`   Created: ${cat.createdAt}`);
    });

    // 5. Check enhanced_terms structure
    console.log('\n🚀 ENHANCED TERMS STRUCTURE:');
    console.log('='.repeat(50));

    const enhancedSample = await db
      .select({
        id: enhanced_terms.id,
        name: enhanced_terms.name,
        mainCategories: enhanced_terms.mainCategories,
        subCategories: enhanced_terms.subCategories,
        difficulty: enhanced_terms.difficulty,
      })
      .from(enhanced_terms)
      .where(sql`main_categories IS NOT NULL AND array_length(main_categories, 1) > 0`)
      .limit(5);

    console.log(`\nFound ${enhancedSample.length} enhanced terms with main categories:`);
    enhancedSample.forEach((term, i) => {
      console.log(`${i + 1}. ${term.name}`);
      console.log(`   Main Categories: ${JSON.stringify(term.mainCategories)}`);
      console.log(`   Sub Categories: ${JSON.stringify(term.subCategories)}`);
      console.log(`   Difficulty: ${term.difficulty}`);
      console.log('---');
    });

    // 6. Data consistency check
    console.log('\n📊 DATA CONSISTENCY SUMMARY:');
    console.log('='.repeat(50));

    const [basicCount] = await db.select({ count: sql<number>`count(*)` }).from(terms);
    const [enhancedCount] = await db.select({ count: sql<number>`count(*)` }).from(enhanced_terms);
    const [categoryCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);
    const [termsWithCategories] = await db
      .select({ count: sql<number>`count(*)` })
      .from(terms)
      .where(sql`category_id IS NOT NULL`);

    console.log(`Basic Terms: ${basicCount.count}`);
    console.log(`Enhanced Terms: ${enhancedCount.count}`);
    console.log(`Categories: ${categoryCount.count}`);
    console.log(`Terms with Categories: ${termsWithCategories.count}`);
    console.log(`Terms without Categories: ${basicCount.count - termsWithCategories.count}`);
    console.log(`Suspicious Categories: ${suspiciousCategories.length}`);
  } catch (error) {
    console.error('❌ Error investigating database:', error);
  } finally {
    await client.end();
  }
}

// Run the investigation
investigateDatabase();
