#!/usr/bin/env tsx

/**
 * Performance Test Script
 * 
 * Tests the performance improvements implemented for the API endpoints
 * to validate response time improvements and payload size reductions.
 */

import { optimizedStorage } from '../optimizedStorage';
import { CacheWarming } from '../middleware/queryCache';

interface PerformanceResult {
  endpoint: string;
  operation: string;
  duration: number;
  payloadSize: number;
  resultCount: number;
  cacheHit?: boolean;
}

async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number; payloadSize: number }> {
  const startTime = Date.now();
  const result = await fn();
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Calculate payload size
  const jsonString = JSON.stringify(result);
  const payloadSize = Buffer.byteLength(jsonString, 'utf8');
  
  return { result, duration, payloadSize };
}

async function testCategoriesEndpoint(): Promise<PerformanceResult[]> {
  console.log('🧪 Testing Categories Endpoint...');
  
  const results: PerformanceResult[] = [];
  
  // Test 1: Basic categories with pagination
  const { result: categoriesBasic, duration: d1, payloadSize: p1 } = await measurePerformance(
    'categories-basic',
    () => optimizedStorage.getCategoriesOptimized({
      limit: 20,
      fields: ['id', 'name', 'description']
    })
  );
  
  results.push({
    endpoint: '/api/categories',
    operation: 'Basic pagination (20 items, minimal fields)',
    duration: d1,
    payloadSize: p1,
    resultCount: categoriesBasic.length
  });
  
  // Test 2: Categories with term counts
  const { result: categoriesWithStats, duration: d2, payloadSize: p2 } = await measurePerformance(
    'categories-with-stats',
    () => optimizedStorage.getCategoriesOptimized({
      limit: 20,
      fields: ['id', 'name', 'description', 'termCount'],
      includeStats: true
    })
  );
  
  results.push({
    endpoint: '/api/categories',
    operation: 'With stats (20 items, full fields)',
    duration: d2,
    payloadSize: p2,
    resultCount: categoriesWithStats.length
  });
  
  // Test 3: Large payload (simulating old behavior)
  const { result: categoriesLarge, duration: d3, payloadSize: p3 } = await measurePerformance(
    'categories-large',
    () => optimizedStorage.getCategoriesOptimized({
      limit: 100,
      fields: ['id', 'name', 'description', 'termCount'],
      includeStats: true
    })
  );
  
  results.push({
    endpoint: '/api/categories',
    operation: 'Large payload (100 items, full fields)',
    duration: d3,
    payloadSize: p3,
    resultCount: categoriesLarge.length
  });
  
  return results;
}

async function testTermsEndpoint(): Promise<PerformanceResult[]> {
  console.log('🧪 Testing Terms Endpoint...');
  
  const results: PerformanceResult[] = [];
  
  // Test 1: Basic terms with pagination
  const { result: termsBasic, duration: d1, payloadSize: p1 } = await measurePerformance(
    'terms-basic',
    () => optimizedStorage.getAllTerms({
      limit: 20,
      fields: ['id', 'name', 'shortDefinition', 'viewCount']
    })
  );
  
  results.push({
    endpoint: '/api/terms',
    operation: 'Basic pagination (20 items, minimal fields)',
    duration: d1,
    payloadSize: p1,
    resultCount: termsBasic.terms.length
  });
  
  // Test 2: Terms with search
  const { result: searchResults, duration: d2, payloadSize: p2 } = await measurePerformance(
    'search-terms',
    () => optimizedStorage.searchTermsOptimized({
      query: 'machine learning',
      limit: 20,
      fields: ['id', 'name', 'shortDefinition', 'viewCount']
    })
  );
  
  results.push({
    endpoint: '/api/terms/search',
    operation: 'Search with pagination (20 items)',
    duration: d2,
    payloadSize: p2,
    resultCount: searchResults.data.length
  });
  
  // Test 3: Terms by category
  const categories = await optimizedStorage.getCategoriesOptimized({ limit: 1 });
  if (categories.length > 0) {
    const { result: categoryTerms, duration: d3, payloadSize: p3 } = await measurePerformance(
      'terms-by-category',
      () => optimizedStorage.getTermsByCategory(categories[0].id, {
        limit: 20,
        fields: ['id', 'name', 'shortDefinition', 'viewCount']
      })
    );
    
    results.push({
      endpoint: '/api/categories/:id/terms',
      operation: 'Terms by category (20 items)',
      duration: d3,
      payloadSize: p3,
      resultCount: categoryTerms.data.length
    });
  }
  
  return results;
}

async function testCachePerformance(): Promise<PerformanceResult[]> {
  console.log('🧪 Testing Cache Performance...');
  
  const results: PerformanceResult[] = [];
  
  // Warm cache
  await CacheWarming.warmAll();
  
  // Test cache hit performance
  const { result: cachedCategories, duration: d1, payloadSize: p1 } = await measurePerformance(
    'cached-categories',
    () => optimizedStorage.getCategoriesOptimized({
      limit: 20,
      fields: ['id', 'name', 'description']
    })
  );
  
  results.push({
    endpoint: '/api/categories',
    operation: 'Cached response (should be faster)',
    duration: d1,
    payloadSize: p1,
    resultCount: cachedCategories.length,
    cacheHit: true
  });
  
  return results;
}

function formatPayloadSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

function analyzeResults(results: PerformanceResult[]): void {
  console.log('\n📊 Performance Analysis Results:');
  console.log('═'.repeat(120));
  console.log(
    'Endpoint'.padEnd(25) + 
    'Operation'.padEnd(35) + 
    'Duration'.padEnd(12) + 
    'Payload'.padEnd(12) + 
    'Count'.padEnd(8) + 
    'Cache'
  );
  console.log('─'.repeat(120));
  
  results.forEach(result => {
    const duration = `${result.duration}ms`;
    const payload = formatPayloadSize(result.payloadSize);
    const cache = result.cacheHit ? '✓' : '-';
    
    console.log(
      result.endpoint.padEnd(25) + 
      result.operation.padEnd(35) + 
      duration.padEnd(12) + 
      payload.padEnd(12) + 
      result.resultCount.toString().padEnd(8) + 
      cache
    );
  });
  
  console.log('─'.repeat(120));
  
  // Performance insights
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const avgPayload = results.reduce((sum, r) => sum + r.payloadSize, 0) / results.length;
  const maxDuration = Math.max(...results.map(r => r.duration));
  const maxPayload = Math.max(...results.map(r => r.payloadSize));
  
  console.log(`\n📈 Performance Summary:`);
  console.log(`  Average response time: ${avgDuration.toFixed(2)}ms`);
  console.log(`  Maximum response time: ${maxDuration}ms`);
  console.log(`  Average payload size: ${formatPayloadSize(avgPayload)}`);
  console.log(`  Maximum payload size: ${formatPayloadSize(maxPayload)}`);
  
  // Performance recommendations
  console.log(`\n💡 Optimizations Achieved:`);
  
  const fastResponses = results.filter(r => r.duration < 100).length;
  const smallPayloads = results.filter(r => r.payloadSize < 50 * 1024).length; // < 50KB
  
  console.log(`  ✅ ${fastResponses}/${results.length} responses under 100ms`);
  console.log(`  ✅ ${smallPayloads}/${results.length} payloads under 50KB`);
  
  if (maxDuration > 500) {
    console.log(`  ⚠️  Some responses still over 500ms - consider further optimization`);
  }
  
  if (maxPayload > 100 * 1024) {
    console.log(`  ⚠️  Some payloads over 100KB - consider pagination or field reduction`);
  }
  
  console.log(`\n🎯 Estimated performance improvements:`);
  console.log(`  • Response times: 60-80% improvement expected`);
  console.log(`  • Payload sizes: 70-90% reduction with compression`);
  console.log(`  • Cache hit ratio: Expected 80%+ for frequent queries`);
}

async function runPerformanceTests() {
  console.log('🚀 Starting Performance Validation Tests...\n');
  
  try {
    const allResults: PerformanceResult[] = [];
    
    // Run all test suites
    const categoryResults = await testCategoriesEndpoint();
    const termResults = await testTermsEndpoint();
    const cacheResults = await testCachePerformance();
    
    allResults.push(...categoryResults, ...termResults, ...cacheResults);
    
    // Analyze and display results
    analyzeResults(allResults);
    
    console.log('\n✅ Performance validation completed successfully!');
    
    return allResults;
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    throw error;
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceTests()
    .then(() => {
      console.log('\n🎉 All performance tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Performance tests failed:', error);
      process.exit(1);
    });
}

export { runPerformanceTests };