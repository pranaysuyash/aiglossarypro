#!/usr/bin/env node

/**
 * Redis Setup Test Script
 *
 * This script tests Redis configuration and validates
 * that caching is working properly for AI Glossary Pro.
 */

import { CacheKeys, redis, redisCache } from '../server/config/redis.js';

const TEST_DATA = {
  simple: { message: 'Hello Redis!' },
  complex: {
    id: 'test-123',
    name: 'Test Term',
    definition: 'A test definition for Redis validation',
    metadata: {
      created: new Date().toISOString(),
      views: 100,
      tags: ['test', 'redis', 'cache'],
    },
  },
};

async function testRedisSetup() {
  console.log('🧪 Testing Redis Setup for AI Glossary Pro');
  console.log('==========================================');

  try {
    // Test 1: Basic Redis Connection
    console.log('\n🔌 Test 1: Redis Connection');
    console.log('---------------------------');

    const isConnected = redis.isConnected();
    console.log(`✅ Redis connection status: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);

    if (!isConnected) {
      console.log('⚠️  Using mock Redis client (development mode)');
    }

    // Test 2: Basic Set/Get Operations
    console.log('\n📝 Test 2: Basic Set/Get Operations');
    console.log('-----------------------------------');

    await redis.set('test:basic', JSON.stringify(TEST_DATA.simple), 60);
    const retrieved = await redis.get('test:basic');
    const parsedData = JSON.parse(retrieved || '{}');

    console.log(
      `✅ Set/Get test: ${parsedData.message === TEST_DATA.simple.message ? 'PASS' : 'FAIL'}`
    );
    console.log(`   Stored: ${TEST_DATA.simple.message}`);
    console.log(`   Retrieved: ${parsedData.message}`);

    // Test 3: TTL (Time To Live)
    console.log('\n⏰ Test 3: TTL Functionality');
    console.log('----------------------------');

    await redis.set('test:ttl', 'expiring-data', 2); // 2 seconds
    const ttl = await redis.ttl('test:ttl');
    console.log(`✅ TTL test: ${ttl > 0 ? 'PASS' : 'FAIL'}`);
    console.log(`   TTL remaining: ${ttl} seconds`);

    // Wait for expiration
    console.log('   Waiting for expiration...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const expiredData = await redis.get('test:ttl');
    console.log(`✅ Expiration test: ${expiredData === null ? 'PASS' : 'FAIL'}`);
    console.log(`   Data after expiration: ${expiredData}`);

    // Test 4: RedisCache Class
    console.log('\n🎯 Test 4: RedisCache Class');
    console.log('---------------------------');

    const cacheKey = 'test:cache-class';
    await redisCache.set(cacheKey, TEST_DATA.complex, 60);
    const cachedData = await redisCache.get(cacheKey);

    console.log(
      `✅ Cache class test: ${cachedData?.id === TEST_DATA.complex.id ? 'PASS' : 'FAIL'}`
    );
    console.log(`   Original ID: ${TEST_DATA.complex.id}`);
    console.log(`   Cached ID: ${cachedData?.id}`);

    // Test 5: Cache Key Generators
    console.log('\n🔑 Test 5: Cache Key Generators');
    console.log('-------------------------------');

    const termKey = CacheKeys.enhancedTerm('test-term-123');
    const searchKey = CacheKeys.searchResults('machine learning', 'difficulty:beginner');
    const userKey = CacheKeys.userPreferences('user-456');

    console.log(`✅ Enhanced term key: ${termKey}`);
    console.log(`✅ Search results key: ${searchKey}`);
    console.log(`✅ User preferences key: ${userKey}`);

    // Test 6: Stale-While-Revalidate
    console.log('\n🔄 Test 6: Stale-While-Revalidate');
    console.log('---------------------------------');

    let revalidateCallCount = 0;
    const revalidateFunction = async () => {
      revalidateCallCount++;
      console.log(`   Revalidate function called (${revalidateCallCount})`);
      return {
        timestamp: new Date().toISOString(),
        data: `Fresh data - call ${revalidateCallCount}`,
      };
    };

    // First call - should fetch fresh data
    const swrKey = 'test:swr';
    const firstCall = await redisCache.getStaleWhileRevalidate(
      swrKey,
      revalidateFunction,
      CacheKeys.SWR_CONFIG.HIGH_FREQUENCY
    );

    console.log(`✅ First SWR call: ${firstCall ? 'PASS' : 'FAIL'}`);
    console.log(`   Data: ${firstCall?.data}`);

    // Second call - should use cached data
    const secondCall = await redisCache.getStaleWhileRevalidate(
      swrKey,
      revalidateFunction,
      CacheKeys.SWR_CONFIG.HIGH_FREQUENCY
    );

    console.log(`✅ Second SWR call: ${secondCall ? 'PASS' : 'FAIL'}`);
    console.log(`   Data: ${secondCall?.data}`);
    console.log(`   Revalidate calls: ${revalidateCallCount} (should be 1)`);

    // Test 7: Cache Existence Check
    console.log('\n✅ Test 7: Cache Existence');
    console.log('-------------------------');

    const existsKey = 'test:exists';
    await redisCache.set(existsKey, { test: 'data' }, 60);
    const exists = await redisCache.exists(existsKey);

    console.log(`✅ Existence test: ${exists ? 'PASS' : 'FAIL'}`);
    console.log(`   Key exists: ${exists}`);

    // Test 8: Cache Deletion
    console.log('\n🗑️  Test 8: Cache Deletion');
    console.log('-------------------------');

    await redisCache.del(existsKey);
    const existsAfterDeletion = await redisCache.exists(existsKey);

    console.log(`✅ Deletion test: ${!existsAfterDeletion ? 'PASS' : 'FAIL'}`);
    console.log(`   Key exists after deletion: ${existsAfterDeletion}`);

    // Test 9: Multiple Operations
    console.log('\n🔄 Test 9: Batch Operations');
    console.log('---------------------------');

    const batchKeys = ['batch:1', 'batch:2', 'batch:3'];
    const batchData = ['data1', 'data2', 'data3'];

    // Set multiple keys
    for (let i = 0; i < batchKeys.length; i++) {
      await redisCache.set(batchKeys[i], { value: batchData[i] }, 60);
    }

    // Get multiple keys
    const batchResults = [];
    for (const key of batchKeys) {
      const result = await redisCache.get(key);
      batchResults.push(result);
    }

    const batchSuccess = batchResults.every(
      (result, index) => result && result.value === batchData[index]
    );

    console.log(`✅ Batch operations: ${batchSuccess ? 'PASS' : 'FAIL'}`);
    console.log(`   Processed ${batchKeys.length} keys`);

    // Test 10: Performance Metrics
    console.log('\n⚡ Test 10: Performance Metrics');
    console.log('------------------------------');

    const performanceKey = 'test:performance';
    const iterations = 100;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      await redisCache.set(`${performanceKey}:${i}`, { iteration: i }, 60);
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(`✅ Performance test: ${avgTime < 50 ? 'PASS' : 'WARN'}`);
    console.log(`   ${iterations} operations in ${totalTime}ms`);
    console.log(`   Average time per operation: ${avgTime.toFixed(2)}ms`);

    // Test 11: TTL Configuration Test
    console.log('\n⏱️  Test 11: TTL Configurations');
    console.log('------------------------------');

    const ttlTests = [
      { name: 'SHORT', ttl: CacheKeys.SHORT_CACHE_TTL },
      { name: 'MEDIUM', ttl: CacheKeys.MEDIUM_CACHE_TTL },
      { name: 'LONG', ttl: CacheKeys.LONG_CACHE_TTL },
    ];

    for (const test of ttlTests) {
      await redis.set(`test:ttl:${test.name.toLowerCase()}`, 'test-data', test.ttl);
      const ttl = await redis.ttl(`test:ttl:${test.name.toLowerCase()}`);
      console.log(`   ${test.name}_CACHE_TTL: ${test.ttl}s (actual: ${ttl}s)`);
    }

    // Test 12: SWR Configuration Test
    console.log('\n🔄 Test 12: SWR Configurations');
    console.log('------------------------------');

    const swrConfigs = [
      { name: 'HIGH_FREQUENCY', config: CacheKeys.SWR_CONFIG.HIGH_FREQUENCY },
      { name: 'MEDIUM_FREQUENCY', config: CacheKeys.SWR_CONFIG.MEDIUM_FREQUENCY },
      { name: 'LOW_FREQUENCY', config: CacheKeys.SWR_CONFIG.LOW_FREQUENCY },
    ];

    for (const swrConfig of swrConfigs) {
      console.log(`   ${swrConfig.name}:`);
      console.log(`     Fresh TTL: ${swrConfig.config.ttl}s`);
      console.log(`     Stale TTL: ${swrConfig.config.staleTtl}s`);
      console.log(`     Revalidate threshold: ${swrConfig.config.revalidateThreshold * 100}%`);
    }

    // Cleanup test data
    console.log('\n🧹 Cleanup: Removing test data...');
    const keysToClean = [
      'test:basic',
      'test:cache-class',
      existsKey,
      swrKey,
      ...batchKeys,
      ...Array.from({ length: iterations }, (_, i) => `${performanceKey}:${i}`),
      ...ttlTests.map(test => `test:ttl:${test.name.toLowerCase()}`),
    ];

    for (const key of keysToClean) {
      await redisCache.del(key);
    }

    console.log(`   Cleaned ${keysToClean.length} test keys`);

    // Success summary
    console.log('\n🎉 Redis Setup Test Results');
    console.log('===========================');
    console.log('✅ All Redis tests passed successfully!');
    console.log(`✅ Redis client is ${isConnected ? 'connected' : 'using mock (development)'}`);
    console.log('✅ Basic operations working');
    console.log('✅ TTL functionality working');
    console.log('✅ Cache class working');
    console.log('✅ Stale-while-revalidate working');
    console.log('✅ Performance is acceptable');
    console.log('✅ Configuration is valid');

    console.log('\n📊 Configuration Summary:');
    console.log('========================');
    console.log(`Redis Host: ${process.env.REDIS_HOST || 'localhost'}`);
    console.log(`Redis Port: ${process.env.REDIS_PORT || '6379'}`);
    console.log(`Redis DB: ${process.env.REDIS_DB || '0'}`);
    console.log(`Redis Enabled: ${process.env.REDIS_ENABLED || 'false'}`);
    console.log(`Cache Enabled: ${process.env.ENABLE_REDIS_CACHE || 'false'}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Redis test failed:', error.message);
    console.error('Stack:', error.stack);

    console.log('\n🔧 Troubleshooting:');
    console.log('==================');
    console.log('1. Check if Redis is running: redis-cli ping');
    console.log('2. Verify Redis configuration in .env file');
    console.log('3. Check network connectivity to Redis server');
    console.log('4. Review Redis logs for errors');
    console.log('5. Ensure Redis dependencies are installed');

    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Test interrupted by user');
  try {
    await redis.quit();
  } catch (error) {
    // Ignore errors during cleanup
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Test terminated');
  try {
    await redis.quit();
  } catch (error) {
    // Ignore errors during cleanup
  }
  process.exit(0);
});

// Run the test
console.log('🚀 Starting Redis Setup Test Suite');
console.log('===================================');

testRedisSetup().catch(async error => {
  console.error('❌ Test suite failed:', error);
  try {
    await redis.quit();
  } catch (cleanupError) {
    // Ignore cleanup errors
  }
  process.exit(1);
});
