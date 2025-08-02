#!/usr/bin/env tsx

import { desc, sql } from 'drizzle-orm';
import { db } from '../server/db';
import { enhancedTerms } from '../shared/enhancedSchema';
import { categories, terms } from '../shared/schema';

async function checkDatabaseContent() {
  console.log('🔍 Database Content Investigation\n');

  try {
    // 1. Basic counts
    console.log('📊 TABLE COUNTS:');
    console.log('='.repeat(40));

    const [basicTermCount] = await db.select({ count: sql<number>`count(*)` }).from(terms);
    const [enhancedTermCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(enhancedTerms);
    const [categoryCount] = await db.select({ count: sql<number>`count(*)` }).from(categories);

    console.log(`Terms: ${basicTermCount.count}`);
    console.log(`Enhanced Terms: ${enhancedTermCount.count}`);
    console.log(`Categories: ${categoryCount.count}`);

    // 2. Sample terms to verify content quality
    console.log('\n🎯 SAMPLE TERMS:');
    console.log('='.repeat(40));

    const sampleTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        category: terms.category,
        definition: terms.definition,
      })
      .from(terms)
      .limit(5);

    sampleTerms.forEach((term, i) => {
      console.log(`${i + 1}. ${term.name} (${term.category})`);
      console.log(`   Definition: ${term.definition?.substring(0, 100)}...`);
    });

    // 3. Sample categories
    console.log('\n📂 SAMPLE CATEGORIES:');
    console.log('='.repeat(40));

    const sampleCategories = await db.select().from(categories).limit(10);

    sampleCategories.forEach((cat, i) => {
      console.log(`${i + 1}. ${cat.name} (ID: ${cat.id})`);
    });

    // 4. Check for specific search terms
    console.log('\n🔍 SEARCH TEST - Neural Network:');
    console.log('='.repeat(40));

    const neuralNetworkTerms = await db
      .select({
        id: terms.id,
        name: terms.name,
        category: terms.category,
      })
      .from(terms)
      .where(sql`LOWER(name) LIKE '%neural network%'`)
      .limit(3);

    if (neuralNetworkTerms.length > 0) {
      console.log('✅ Found Neural Network terms:');
      neuralNetworkTerms.forEach(term => {
        console.log(`   - ${term.name} (${term.category})`);
      });
    } else {
      console.log('❌ No Neural Network terms found');
    }

    // 5. Check enhanced terms sample
    console.log('\n⭐ ENHANCED TERMS SAMPLE:');
    console.log('='.repeat(40));

    const enhancedSample = await db
      .select({
        id: enhancedTerms.id,
        name: enhancedTerms.name,
        category: enhancedTerms.category,
        hasCodeExamples: sql<boolean>`${enhancedTerms.codeExamples} IS NOT NULL`,
        hasUseCases: sql<boolean>`${enhancedTerms.useCases} IS NOT NULL`,
      })
      .from(enhancedTerms)
      .limit(5);

    enhancedSample.forEach((term, i) => {
      console.log(`${i + 1}. ${term.name} (${term.category})`);
      console.log(`   Code Examples: ${term.hasCodeExamples ? '✅' : '❌'}`);
      console.log(`   Use Cases: ${term.hasUseCases ? '✅' : '❌'}`);
    });

    console.log('\n✅ Database content check completed');
  } catch (error) {
    console.error('❌ Database content check failed:', error);
  }
}

checkDatabaseContent().catch(console.error);
