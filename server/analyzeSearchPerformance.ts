import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { db } from './db';

dotenv.config();

async function analyzeQueryPerformance() {
  console.log('🔍 Analyzing search query performance differences...\n');

  // Test queries with different characteristics
  const testQueries = [
    { term: 'learning', type: 'generic' },
    { term: 'deep', type: 'generic' },
    { term: 'machine', type: 'specific' },
    { term: 'neural', type: 'specific' },
    { term: 'algorithm', type: 'generic' },
    { term: 'bayesian', type: 'specific' },
  ];

  console.log('📊 Match Count Analysis:');
  console.log('========================');

  for (const { term, type } of testQueries) {
    const startTime = Date.now();

    // Count matches using ILIKE
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM terms
      WHERE name ILIKE ${`%${term}%`}
         OR short_definition ILIKE ${`%${term}%`}
    `);

    const queryTime = Date.now() - startTime;
    const count = Number(result.rows[0].count);

    console.log(`\n"${term}" (${type}):`);
    console.log(`  Matches: ${count}`);
    console.log(`  Query time: ${queryTime}ms`);
    console.log(`  Avg time per result: ${count > 0 ? (queryTime / count).toFixed(2) : 'N/A'}ms`);
  }

  // Analyze the actual query execution plan
  console.log('\n\n📋 Query Execution Plan Analysis:');
  console.log('===================================');

  for (const query of ['learning', 'machine']) {
    console.log(`\nEXPLAIN ANALYZE for "${query}":`);

    const explainResult = await db.execute(sql`
      EXPLAIN (ANALYZE, BUFFERS) 
      SELECT id, name, short_definition, view_count
      FROM terms
      WHERE name ILIKE ${`%${query}%`}
         OR short_definition ILIKE ${`%${query}%`}
      ORDER BY view_count DESC
      LIMIT 20
    `);

    console.log('Plan:');
    explainResult.rows.forEach((row) => {
      console.log(`  ${row['QUERY PLAN']}`);
    });
  }

  // Test with different optimization strategies
  console.log('\n\n🚀 Testing Optimization Strategies:');
  console.log('=====================================');

  // Strategy 1: Use prefix match instead of contains for common terms
  console.log('\n1. Prefix match optimization:');
  for (const term of ['learning', 'machine']) {
    const startTime = Date.now();

    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM terms
      WHERE name ILIKE ${`${term}%`}
    `);

    const queryTime = Date.now() - startTime;
    console.log(`  "${term}*": ${Number(result.rows[0].count)} matches in ${queryTime}ms`);
  }

  // Strategy 2: Limit early for high-match queries
  console.log('\n2. Early limiting strategy:');
  for (const term of ['learning', 'machine']) {
    const startTime = Date.now();

    const result = await db.execute(sql`
      SELECT id, name
      FROM (
        SELECT id, name, view_count
        FROM terms
        WHERE name ILIKE ${`%${term}%`}
        LIMIT 100
      ) t
      ORDER BY view_count DESC
      LIMIT 20
    `);

    const queryTime = Date.now() - startTime;
    console.log(`  "${term}" (limited): ${queryTime}ms for ${result.rows.length} results`);
  }

  process.exit(0);
}

analyzeQueryPerformance().catch(console.error);
