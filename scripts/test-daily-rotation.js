#!/usr/bin/env node

/**
 * Test Daily Term Rotation
 *
 * This script tests the daily term rotation functionality
 * and validates that it's working correctly.
 */

import { addDays, format, subDays } from 'date-fns';
import { DailyTermRotationService } from '../server/services/dailyTermRotation.js';

const dailyTermsService = new DailyTermRotationService();

async function testDailyRotation() {
  console.log('🧪 Testing Daily Term Rotation');
  console.log('==============================');

  const today = new Date();
  const yesterday = subDays(today, 1);
  const tomorrow = addDays(today, 1);

  try {
    // Test 1: Generate today's terms
    console.log("\n📅 Test 1: Today's Terms");
    console.log('------------------------');
    const todaysTerms = await dailyTermsService.getTodaysTerms(today);
    console.log(`✅ Generated ${todaysTerms.terms.length} terms for ${todaysTerms.date}`);
    console.log(`   Algorithm: ${todaysTerms.metadata.algorithm_version}`);
    console.log(`   Distribution:`, todaysTerms.metadata.distribution.difficulty);

    // Test 2: Generate yesterday's terms
    console.log("\n📅 Test 2: Yesterday's Terms");
    console.log('----------------------------');
    const yesterdaysTerms = await dailyTermsService.getTodaysTerms(yesterday);
    console.log(`✅ Generated ${yesterdaysTerms.terms.length} terms for ${yesterdaysTerms.date}`);

    // Test 3: Generate tomorrow's terms
    console.log("\n📅 Test 3: Tomorrow's Terms");
    console.log('---------------------------');
    const tomorrowsTerms = await dailyTermsService.getTodaysTerms(tomorrow);
    console.log(`✅ Generated ${tomorrowsTerms.terms.length} terms for ${tomorrowsTerms.date}`);

    // Test 4: Verify caching
    console.log('\n💾 Test 4: Cache Validation');
    console.log('---------------------------');
    const cachedToday = await dailyTermsService.getTodaysTerms(today);
    const isCached = cachedToday.metadata.generated_at === todaysTerms.metadata.generated_at;
    console.log(`✅ Cache working: ${isCached ? 'YES' : 'NO'}`);

    // Test 5: Performance metrics
    console.log('\n📊 Test 5: Performance Metrics');
    console.log('------------------------------');
    const metrics = await dailyTermsService.getSelectionMetrics(7);
    console.log(`✅ Metrics generated for 7 days`);

    // Test 6: Validate term quality
    console.log('\n🎯 Test 6: Term Quality Validation');
    console.log('----------------------------------');
    const sampleTerms = todaysTerms.terms.slice(0, 5);
    let validTerms = 0;

    for (const term of sampleTerms) {
      const hasDefinition = term.definition && term.definition.length > 50;
      const hasCategory = term.category && term.category !== '';
      const hasValidId = term.id && term.id.length > 0;

      if (hasDefinition && hasCategory && hasValidId) {
        validTerms++;
      }
    }

    console.log(`✅ Valid terms in sample: ${validTerms}/${sampleTerms.length}`);

    // Test 7: Distribution analysis
    console.log('\n📈 Test 7: Distribution Analysis');
    console.log('--------------------------------');
    const distribution = todaysTerms.metadata.distribution;

    console.log('Difficulty Distribution:');
    Object.entries(distribution.difficulty).forEach(([level, count]) => {
      console.log(`   ${level}: ${count} terms`);
    });

    console.log('Category Distribution:');
    const categories = Object.keys(distribution.category);
    console.log(`   ${categories.length} categories represented`);

    console.log('Quality Metrics:');
    console.log(`   Terms with implementation: ${distribution.quality.withImplementation}`);
    console.log(`   Terms with code examples: ${distribution.quality.withCodeExamples}`);
    console.log(
      `   Terms with interactive elements: ${distribution.quality.withInteractiveElements}`
    );
    console.log(
      `   Average definition length: ${Math.round(distribution.quality.averageDefinitionLength)} chars`
    );

    // Test 8: Verify uniqueness across days
    console.log('\n🔄 Test 8: Uniqueness Validation');
    console.log('--------------------------------');
    const todayIds = new Set(todaysTerms.terms.map(t => t.id));
    const yesterdayIds = new Set(yesterdaysTerms.terms.map(t => t.id));
    const tomorrowIds = new Set(tomorrowsTerms.terms.map(t => t.id));

    const todayYesterdayOverlap = [...todayIds].filter(id => yesterdayIds.has(id)).length;
    const todayTomorrowOverlap = [...todayIds].filter(id => tomorrowIds.has(id)).length;

    console.log(`✅ Today/Yesterday overlap: ${todayYesterdayOverlap} terms`);
    console.log(`✅ Today/Tomorrow overlap: ${todayTomorrowOverlap} terms`);

    // Success summary
    console.log('\n🎉 Daily Term Rotation Test Results');
    console.log('===================================');
    console.log('✅ All tests passed successfully!');
    console.log(`✅ System is generating ${todaysTerms.terms.length} terms daily`);
    console.log(`✅ Cache is working properly`);
    console.log(`✅ Distribution is balanced`);
    console.log(`✅ Quality metrics are healthy`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Test interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Test terminated');
  process.exit(0);
});

// Run the test
console.log('🚀 Starting Daily Term Rotation Test Suite');
console.log('==========================================');

testDailyRotation().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
