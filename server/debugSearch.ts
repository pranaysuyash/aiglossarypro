/**
 * Debug search performance by analyzing individual query components
 */

import { db } from './db';
import { terms, categories } from '../shared/schema';
import { eq, and, or, sql, ilike, desc, asc } from 'drizzle-orm';

async function debugSearchPerformance() {
  const query = 'machine';
  console.log(`🔍 Debugging search performance for query: "${query}"`);
  
  // Test 1: Simple count query
  console.log('\n1. Testing simple count query...');
  const startCount = Date.now();
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(terms);
  const countTime = Date.now() - startCount;
  console.log(`✓ Count query: ${countTime}ms (${countResult[0]?.count} total terms)`);
  
  // Test 2: Simple name search
  console.log('\n2. Testing simple name search...');
  const startNameSearch = Date.now();
  const nameResults = await db
    .select({ id: terms.id, name: terms.name })
    .from(terms)
    .where(ilike(terms.name, `%${query}%`))
    .limit(10);
  const nameSearchTime = Date.now() - startNameSearch;
  console.log(`✓ Name search: ${nameSearchTime}ms (${nameResults.length} results)`);
  
  // Test 3: Search with category join
  console.log('\n3. Testing search with category join...');
  const startJoinSearch = Date.now();
  const joinResults = await db
    .select({
      id: terms.id,
      name: terms.name,
      categoryName: categories.name
    })
    .from(terms)
    .leftJoin(categories, eq(terms.categoryId, categories.id))
    .where(ilike(terms.name, `%${query}%`))
    .limit(10);
  const joinSearchTime = Date.now() - startJoinSearch;
  console.log(`✓ Join search: ${joinSearchTime}ms (${joinResults.length} results)`);
  
  // Test 4: Full search with all fields
  console.log('\n4. Testing full search with all fields...');
  const startFullSearch = Date.now();
  const fullResults = await db
    .select({
      id: terms.id,
      name: terms.name,
      definition: terms.definition,
      shortDefinition: terms.shortDefinition,
      characteristics: terms.characteristics,
      references: terms.references,
      viewCount: terms.viewCount,
      createdAt: terms.createdAt,
      updatedAt: terms.updatedAt,
      categoryId: categories.id,
      categoryName: categories.name
    })
    .from(terms)
    .leftJoin(categories, eq(terms.categoryId, categories.id))
    .where(or(
      ilike(terms.name, `%${query}%`),
      ilike(terms.shortDefinition, `%${query}%`)
    ))
    .orderBy(desc(terms.viewCount))
    .limit(20);
  const fullSearchTime = Date.now() - startFullSearch;
  console.log(`✓ Full search: ${fullSearchTime}ms (${fullResults.length} results)`);
  
  // Test 5: Check index usage
  console.log('\n5. Checking database indexes...');
  try {
    const indexCheck = await db.execute(sql`
      SELECT schemaname, tablename, indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'terms' 
      ORDER BY indexname
    `);
    console.log(`✓ Found ${indexCheck.rows?.length || 0} indexes on terms table`);
    indexCheck.rows?.forEach((row: any) => {
      console.log(`  - ${row.indexname}: ${row.indexdef}`);
    });
  } catch (error) {
    console.warn('⚠ Could not check indexes:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  // Test 6: Database statistics
  console.log('\n6. Checking table statistics...');
  try {
    const stats = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples,
        last_vacuum,
        last_autovacuum,
        last_analyze,
        last_autoanalyze
      FROM pg_stat_user_tables 
      WHERE tablename IN ('terms', 'categories')
    `);
    console.log(`✓ Table statistics:`);
    stats.rows?.forEach((row: any) => {
      console.log(`  - ${row.tablename}: ${row.live_tuples} live tuples, last analyzed: ${row.last_autoanalyze || 'never'}`);
    });
  } catch (error) {
    console.warn('⚠ Could not check table statistics:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  console.log('\n🎯 Performance Summary:');
  console.log(`  - Count query: ${countTime}ms`);
  console.log(`  - Name search: ${nameSearchTime}ms`);
  console.log(`  - Join search: ${joinSearchTime}ms`);
  console.log(`  - Full search: ${fullSearchTime}ms`);
  
  if (fullSearchTime > 1000) {
    console.log('\n🚨 Performance Issue Detected:');
    console.log('  The full search is taking over 1 second. Potential causes:');
    console.log('  1. Missing or ineffective database indexes');
    console.log('  2. Large result set processing');
    console.log('  3. Complex text search operations');
    console.log('  4. Database needs optimization (VACUUM, ANALYZE)');
  }
}

// Run debug if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  debugSearchPerformance()
    .then(() => {
      console.log('\n✅ Debug completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Debug failed:', error);
      process.exit(1);
    });
}

export { debugSearchPerformance };