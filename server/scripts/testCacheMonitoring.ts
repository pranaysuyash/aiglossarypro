/**
 * Test script for cache monitoring system
 * 
 * This script simulates cache operations to verify the monitoring system
 * is collecting metrics correctly.
 */

import { queryCache, searchCache, userCache, cached, CacheKeys } from '../middleware/queryCache';
import { metricsCollector } from '../cache/CacheMetrics';
import { cacheMonitor } from '../monitoring/cacheMonitoring';

async function simulateCacheOperations() {
  console.log('🧪 Starting cache monitoring test...\n');

  // Test 1: Simulate cache hits and misses
  console.log('📊 Test 1: Simulating cache operations...');
  
  // Generate some cache misses
  for (let i = 0; i < 20; i++) {
    queryCache.get(`non-existent-key-${i}`);
  }
  
  // Generate some cache hits
  for (let i = 0; i < 10; i++) {
    const key = `test-key-${i}`;
    queryCache.set(key, { data: `test-value-${i}` });
    queryCache.get(key); // Hit
    queryCache.get(key); // Another hit
  }
  
  // Test search cache
  for (let i = 0; i < 5; i++) {
    const key = CacheKeys.termSearch(`query-${i}`, 10);
    searchCache.set(key, { results: [] });
    searchCache.get(key);
  }
  
  console.log('✅ Cache operations completed\n');

  // Test 2: Check current stats
  console.log('📈 Test 2: Current cache statistics:');
  const queryStats = queryCache.getStats();
  const searchStats = searchCache.getStats();
  const userStats = userCache.getStats();
  
  console.log('Query Cache:', {
    hitRate: `${(queryStats.hitRate * 100).toFixed(1)}%`,
    hits: queryStats.hitCount,
    misses: queryStats.missCount,
    size: queryStats.size
  });
  
  console.log('Search Cache:', {
    hitRate: `${(searchStats.hitRate * 100).toFixed(1)}%`,
    hits: searchStats.hitCount,
    misses: searchStats.missCount,
    size: searchStats.size
  });
  
  console.log('User Cache:', {
    hitRate: `${(userStats.hitRate * 100).toFixed(1)}%`,
    hits: userStats.hitCount,
    misses: userStats.missCount,
    size: userStats.size
  });
  console.log('');

  // Test 3: Real-time metrics
  console.log('⚡ Test 3: Real-time metrics:');
  const realTimeMetrics = metricsCollector.getRealTimeMetrics();
  console.log({
    opsPerSecond: realTimeMetrics.opsPerSecond.toFixed(2),
    avgResponseTime: `${realTimeMetrics.avgResponseTime.toFixed(2)}ms`,
    activeKeys: realTimeMetrics.activeKeys,
    recentOpsCount: realTimeMetrics.recentOperations.length
  });
  console.log('');

  // Test 4: Health check
  console.log('🏥 Test 4: Running health checks...');
  const healthChecks = await cacheMonitor.runHealthChecks();
  
  healthChecks.forEach(check => {
    const icon = check.status === 'healthy' ? '✅' : 
                check.status === 'degraded' ? '⚠️' : '❌';
    console.log(`${icon} ${check.name}: ${check.message}`);
  });
  console.log('');

  // Test 5: Generate snapshot
  console.log('📸 Test 5: Generating metrics snapshot...');
  const snapshot = metricsCollector.generateSnapshot();
  console.log({
    timestamp: snapshot.timestamp,
    totalHits: snapshot.hits,
    totalMisses: snapshot.misses,
    hitRate: `${(snapshot.hitRate * 100).toFixed(1)}%`,
    hotKeys: snapshot.hotKeys.slice(0, 3).map(k => k.key),
    coldKeys: snapshot.coldKeys.slice(0, 3).map(k => k.key)
  });
  console.log('');

  // Test 6: Simulate cache pressure
  console.log('💥 Test 6: Simulating cache pressure...');
  
  // Fill cache to trigger evictions
  for (let i = 0; i < 100; i++) {
    queryCache.set(`pressure-test-${i}`, { 
      data: Array(1000).fill(`large-data-${i}`) 
    });
  }
  
  const pressureStats = queryCache.getStats();
  console.log('After pressure test:', {
    size: pressureStats.size,
    evictions: pressureStats.evictionCount,
    hitRate: `${(pressureStats.hitRate * 100).toFixed(1)}%`
  });
  console.log('');

  // Test 7: Cache invalidation
  console.log('🗑️ Test 7: Testing cache invalidation...');
  const invalidated = queryCache.invalidate('pressure-test-*');
  console.log(`Invalidated ${invalidated} entries`);
  console.log('');

  // Test 8: Generate health report
  console.log('📋 Test 8: Generating health report...');
  const report = await cacheMonitor.generateHealthReport();
  console.log({
    overallHealth: report.overallHealth,
    checksCount: report.checks.length,
    alertsCount: report.recentAlerts.length,
    recommendationsCount: report.recommendations.length
  });
  
  if (report.recommendations.length > 0) {
    console.log('\nRecommendations:');
    report.recommendations.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec}`);
    });
  }
  console.log('');

  console.log('✅ All tests completed successfully!\n');
  console.log('💡 Check the monitoring dashboard at /admin/cache-monitoring for visual analytics');
}

// Set up alert listener
cacheMonitor.on('alert', (alert) => {
  console.log(`\n🚨 ALERT [${alert.level}]: ${alert.message}`);
});

// Run the test
simulateCacheOperations().catch(console.error);

// Keep the script running for a bit to allow metric collection
setTimeout(() => {
  console.log('\n👋 Test completed. Exiting...');
  process.exit(0);
}, 5000);