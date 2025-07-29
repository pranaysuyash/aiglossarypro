import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';
import { db } from '@aiglossarypro/database';

import logger from './utils/logger';
dotenv.config();

async function analyzeQueryPerformance() {
  logger.info('🔍 Analyzing search query performance differences...\n');

  // Test queries with different characteristics
  const testQueries = [
    { term: 'learning', type: 'generic' },
    { term: 'deep', type: 'generic' },
    { term: 'machine', type: 'specific' },
    { term: 'neural', type: 'specific' },
    { term: 'algorithm', type: 'generic' },
    { term: 'bayesian', type: 'specific' },
  ];

  logger.info('📊 Match Count Analysis:');
  logger.info('========================');

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

    logger.info(`\n"${term}" (${type}):`);
    logger.info(`  Matches: ${count}`);
    logger.info(`  Query time: ${queryTime}ms`);
    logger.info(`  Avg time per result: ${count > 0 ? (queryTime / count).toFixed(2) : 'N/A'}ms`);
  }

  // Analyze the actual query execution plan
  logger.info('\n\n📋 Query Execution Plan Analysis:');
  logger.info('===================================');

  for (const query of ['learning', 'machine']) {
    logger.info(`\nEXPLAIN ANALYZE for "${query}":`);

    const explainResult = await db.execute(sql`
      EXPLAIN (ANALYZE, BUFFERS) 
      SELECT id, name, short_definition, view_count
      FROM terms
      WHERE name ILIKE ${`%${query}%`}
         OR short_definition ILIKE ${`%${query}%`}
      ORDER BY view_count DESC
      LIMIT 20
    `);

    logger.info('Plan:');
    explainResult.rows.forEach(row => {
      logger.info(`  ${row['QUERY PLAN']}`);
    });
  }

  // Test with different optimization strategies
  logger.info('\n\n🚀 Testing Optimization Strategies:');
  logger.info('=====================================');

  // Strategy 1: Use prefix match instead of contains for common terms
  logger.info('\n1. Prefix match optimization:');
  for (const term of ['learning', 'machine']) {
    const startTime = Date.now();

    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM terms
      WHERE name ILIKE ${`${term}%`}
    `);

    const queryTime = Date.now() - startTime;
    logger.info(`  "${term}*": ${Number(result.rows[0].count)} matches in ${queryTime}ms`);
  }

  // Strategy 2: Limit early for high-match queries
  logger.info('\n2. Early limiting strategy:');
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
    logger.info(`  "${term}" (limited): ${queryTime}ms for ${result.rows.length} results`);
  }

  process.exit(0);
}

analyzeQueryPerformance().catch(console.error);
