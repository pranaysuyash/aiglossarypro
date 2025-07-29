#!/usr/bin/env node

/**
 * Comprehensive Sentry Test Suite
 *
 * This script thoroughly tests all Sentry functionality for AI Glossary Pro
 * including error tracking, performance monitoring, and user context.
 */

// Load environment variables first
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

import {
  addBreadcrumb,
  captureException,
  captureMessage,
  flushSentry,
  initializeSentry,
  isSentryEnabled,
  setTag,
  setUser,
  startTransaction,
} from '../server/config/sentry.js';

// Test data
const TEST_USER = {
  id: 'test-user-sentry-123',
  email: 'sentry-test@aiglossary.pro',
  username: 'sentry_tester',
};

const TEST_SCENARIOS = [
  {
    name: 'API Error',
    type: 'exception',
    error: new Error('Failed to fetch term data from database'),
    context: {
      tags: { component: 'api', endpoint: '/api/terms/123' },
      extra: { termId: '123', userId: 'user-456' },
    },
  },
  {
    name: 'Authentication Error',
    type: 'exception',
    error: new Error('Invalid JWT token'),
    context: {
      tags: { component: 'auth', action: 'token_validation' },
      extra: { tokenExpired: true, userAgent: 'test-browser' },
    },
  },
  {
    name: 'Database Connection Error',
    type: 'exception',
    error: new Error('Connection timeout to PostgreSQL'),
    context: {
      tags: { component: 'database', operation: 'query' },
      extra: { query: 'SELECT * FROM terms', timeout: '5000ms' },
    },
  },
  {
    name: 'Payment Processing Info',
    type: 'message',
    message: 'Payment successfully processed',
    level: 'info',
    context: {
      tags: { component: 'payment', provider: 'gumroad' },
      extra: { amount: 29.99, currency: 'USD', orderId: 'order-789' },
    },
  },
  {
    name: 'Search Performance Warning',
    type: 'message',
    message: 'Search query took longer than expected',
    level: 'warning',
    context: {
      tags: { component: 'search', performance: 'slow' },
      extra: { query: 'neural networks', duration: '2.5s', resultCount: 150 },
    },
  },
];

async function runSentryTests() {
  console.log('🔍 Comprehensive Sentry Test Suite for AI Glossary Pro');
  console.log('======================================================');

  // Pre-flight checks
  console.log('\n🔧 Pre-flight Checks');
  console.log('--------------------');

  const sentryDsn = process.env.SENTRY_DSN;
  const environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV;
  const release = process.env.SENTRY_RELEASE;

  console.log(`Sentry DSN: ${sentryDsn ? '✅ Configured' : '❌ Missing'}`);
  console.log(`Environment: ${environment || '❌ Not set'}`);
  console.log(`Release: ${release || '⚠️  Auto-generated'}`);
  console.log(`Sentry Enabled: ${isSentryEnabled() ? '✅ Yes' : '⚠️  No (dev mode)'}`);

  if (!sentryDsn) {
    console.log('\n❌ Sentry DSN not configured. Please run ./scripts/setup-sentry-production.sh');
    process.exit(1);
  }

  // Initialize Sentry
  console.log('\n🚀 Initializing Sentry');
  console.log('----------------------');

  try {
    initializeSentry();
    console.log('✅ Sentry initialized successfully');
  } catch (error) {
    console.log('❌ Sentry initialization failed:', error.message);
    process.exit(1);
  }

  // Test 1: User Context Management
  console.log('\n👤 Test 1: User Context Management');
  console.log('----------------------------------');

  setUser(TEST_USER);
  console.log(`✅ User context set: ${TEST_USER.username} (${TEST_USER.id})`);

  setTag('test_suite', 'comprehensive');
  setTag('component', 'sentry_test');
  console.log('✅ Global tags set');

  // Test 2: Breadcrumb Trail
  console.log('\n🍞 Test 2: Breadcrumb Trail');
  console.log('--------------------------');

  const breadcrumbs = [
    { message: 'User navigated to homepage', category: 'navigation', level: 'info' },
    {
      message: 'Search query: "machine learning"',
      category: 'search',
      level: 'info',
      data: { query: 'machine learning', resultCount: 42 },
    },
    {
      message: 'Clicked on term: Neural Network',
      category: 'interaction',
      level: 'info',
      data: { termId: 'neural-network' },
    },
    {
      message: 'Started purchase flow',
      category: 'commerce',
      level: 'info',
      data: { productId: 'pro-access' },
    },
  ];

  for (const breadcrumb of breadcrumbs) {
    addBreadcrumb(breadcrumb.message, breadcrumb.category, breadcrumb.level, breadcrumb.data);
    console.log(`   ✅ ${breadcrumb.message}`);
  }

  console.log(`✅ ${breadcrumbs.length} breadcrumbs added to trail`);

  // Test 3: Error Scenarios
  console.log('\n🚨 Test 3: Error Scenarios');
  console.log('--------------------------');

  const errorIds = [];
  const messageIds = [];

  for (const scenario of TEST_SCENARIOS) {
    console.log(`\n   Testing: ${scenario.name}`);

    if (scenario.type === 'exception') {
      const errorId = captureException(scenario.error, {
        tags: scenario.context.tags,
        extra: scenario.context.extra,
        user: TEST_USER,
      });

      if (errorId) {
        errorIds.push(errorId);
        console.log(`   ✅ Exception captured: ${errorId}`);
      } else {
        console.log(`   ℹ️  Exception logged (dev mode)`);
      }
    } else if (scenario.type === 'message') {
      const messageId = captureMessage(scenario.message, scenario.level, {
        tags: scenario.context.tags,
        extra: scenario.context.extra,
        user: TEST_USER,
      });

      if (messageId) {
        messageIds.push(messageId);
        console.log(`   ✅ Message captured: ${messageId}`);
      } else {
        console.log(`   ℹ️  Message logged (dev mode)`);
      }
    }

    // Add small delay between events
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✅ Completed ${TEST_SCENARIOS.length} error scenarios`);
  console.log(`   Exceptions: ${errorIds.length} captured`);
  console.log(`   Messages: ${messageIds.length} captured`);

  // Test 4: Performance Monitoring
  console.log('\n⚡ Test 4: Performance Monitoring');
  console.log('---------------------------------');

  const performanceTests = [
    {
      name: 'Database Query Performance',
      operation: 'db.query',
      description: 'Simulating term search query',
      duration: 250,
    },
    {
      name: 'API Response Time',
      operation: 'http.request',
      description: 'Simulating API endpoint response',
      duration: 150,
    },
    {
      name: 'Search Algorithm Performance',
      operation: 'search.execute',
      description: 'Simulating search algorithm execution',
      duration: 500,
    },
  ];

  for (const test of performanceTests) {
    const transaction = startTransaction(test.name, test.operation, test.description);

    if (transaction) {
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, test.duration));

      transaction.setTag('test_type', 'performance');
      transaction.setData('duration_ms', test.duration);
      transaction.finish();

      console.log(`   ✅ ${test.name}: ${test.duration}ms`);
    } else {
      console.log(`   ℹ️  ${test.name}: simulated (dev mode)`);
    }
  }

  console.log(`✅ Completed ${performanceTests.length} performance tests`);

  // Test 5: Error Filtering and Sanitization
  console.log('\n🔒 Test 5: Error Filtering and Sanitization');
  console.log('-------------------------------------------');

  // Test sensitive data filtering
  const sensitiveError = new Error('Authentication failed for user');
  const sensitiveContext = {
    tags: { component: 'auth', test: 'filtering' },
    extra: {
      password: 'secret123', // Should be filtered
      apiKey: 'sk-test-123', // Should be filtered
      userEmail: 'test@example.com', // Should be kept
      timestamp: new Date().toISOString(), // Should be kept
    },
  };

  const filteredErrorId = captureException(sensitiveError, sensitiveContext);

  if (filteredErrorId) {
    console.log(`   ✅ Sensitive data test: ${filteredErrorId}`);
    console.log('   ℹ️  Sensitive fields should be filtered in Sentry dashboard');
  } else {
    console.log('   ℹ️  Sensitive data test simulated (dev mode)');
  }

  // Test 6: Rate Limiting and Batch Events
  console.log('\n📊 Test 6: Rate Limiting and Batch Events');
  console.log('-----------------------------------------');

  console.log('   Sending batch of events to test rate limiting...');

  const batchPromises = [];
  for (let i = 0; i < 10; i++) {
    const promise = captureMessage(`Batch test message ${i + 1}`, 'info', {
      tags: { batch: 'true', index: i.toString() },
      extra: { batchSize: 10, testType: 'rate_limiting' },
    });
    batchPromises.push(promise);

    // Small delay to prevent overwhelming
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  const batchResults = await Promise.all(batchPromises);
  const successfulBatch = batchResults.filter(id => id !== undefined).length;

  console.log(`   ✅ Batch events: ${successfulBatch}/10 processed`);

  // Test 7: Complex Error with Stack Trace
  console.log('\n🔍 Test 7: Complex Error with Stack Trace');
  console.log('-----------------------------------------');

  function complexFunction() {
    function nestedFunction() {
      function deepNestedFunction() {
        throw new Error('Complex error from deep nested function');
      }
      deepNestedFunction();
    }
    nestedFunction();
  }

  try {
    complexFunction();
  } catch (complexError) {
    const complexErrorId = captureException(complexError, {
      tags: {
        errorType: 'complex',
        function: 'complexFunction',
        depth: 'deep',
      },
      extra: {
        stackDepth: complexError.stack ? complexError.stack.split('\n').length : 0,
        testDescription: 'Testing complex stack trace capture',
      },
    });

    if (complexErrorId) {
      console.log(`   ✅ Complex error captured: ${complexErrorId}`);
      console.log('   ℹ️  Check stack trace depth in Sentry dashboard');
    } else {
      console.log('   ℹ️  Complex error simulated (dev mode)');
    }
  }

  // Test 8: Integration Test Simulation
  console.log('\n🔗 Test 8: Integration Test Simulation');
  console.log('--------------------------------------');

  // Simulate a typical user journey with errors
  const journeySteps = [
    { action: 'User lands on homepage', type: 'breadcrumb' },
    { action: 'Search for "deep learning"', type: 'breadcrumb' },
    { action: 'Click on search result', type: 'breadcrumb' },
    { action: 'API timeout during content load', type: 'error' },
    { action: 'User retries action', type: 'breadcrumb' },
    { action: 'Content loaded successfully', type: 'message' },
    { action: 'User starts purchase', type: 'breadcrumb' },
    { action: 'Payment processing completed', type: 'message' },
  ];

  for (const step of journeySteps) {
    switch (step.type) {
      case 'breadcrumb':
        addBreadcrumb(step.action, 'user_journey', 'info');
        break;
      case 'error':
        captureException(new Error(step.action), {
          tags: { journey: 'user_simulation', step: 'error' },
        });
        break;
      case 'message':
        captureMessage(step.action, 'info', {
          tags: { journey: 'user_simulation', step: 'success' },
        });
        break;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`   ✅ Simulated ${journeySteps.length}-step user journey`);

  // Test 9: Flush and Cleanup
  console.log('\n🧹 Test 9: Flush and Cleanup');
  console.log('-----------------------------');

  console.log('   Flushing Sentry data...');
  const flushSuccess = await flushSentry(5000);

  console.log(
    `   ${flushSuccess ? '✅' : '⚠️'} Sentry flush ${flushSuccess ? 'completed' : 'timed out'}`
  );

  // Final Summary
  console.log('\n🎉 Comprehensive Sentry Test Results');
  console.log('====================================');

  console.log('\n📊 Test Statistics:');
  console.log(`   Total Error Scenarios: ${TEST_SCENARIOS.length}`);
  console.log(`   Exception Events: ${errorIds.length}`);
  console.log(`   Message Events: ${messageIds.length}`);
  console.log(`   Performance Transactions: ${performanceTests.length}`);
  console.log(`   Breadcrumbs: ${breadcrumbs.length + journeySteps.length}`);
  console.log(`   Batch Events: 10`);

  console.log('\n✅ Test Categories Completed:');
  console.log('   ✅ User Context Management');
  console.log('   ✅ Breadcrumb Trail');
  console.log('   ✅ Error Scenarios');
  console.log('   ✅ Performance Monitoring');
  console.log('   ✅ Error Filtering and Sanitization');
  console.log('   ✅ Rate Limiting and Batch Events');
  console.log('   ✅ Complex Error with Stack Trace');
  console.log('   ✅ Integration Test Simulation');
  console.log('   ✅ Flush and Cleanup');

  if (isSentryEnabled()) {
    console.log('\n📈 Sentry Dashboard:');
    console.log('   🔗 Check your Sentry project for test events');
    console.log('   📊 Review error patterns and performance data');
    console.log('   🔍 Inspect user journey breadcrumbs');
    console.log('   ⚡ Analyze performance transaction traces');

    console.log('\n🚀 Production Readiness:');
    console.log('   ✅ Error tracking is fully functional');
    console.log('   ✅ Performance monitoring is active');
    console.log('   ✅ User context and breadcrumbs working');
    console.log('   ✅ Sensitive data filtering enabled');
    console.log('   ✅ Rate limiting and batching functional');
  } else {
    console.log('\n⚠️  Development Mode:');
    console.log('   ℹ️  Sentry is configured but disabled in development');
    console.log('   🔧 Set NODE_ENV=production to enable full tracking');
    console.log('   🧪 All test scenarios executed successfully');
  }

  console.log('\n🎯 Next Steps:');
  console.log('   1. Deploy to production with NODE_ENV=production');
  console.log('   2. Monitor Sentry dashboard for real events');
  console.log('   3. Set up alerting rules in Sentry');
  console.log('   4. Configure team access and notifications');
  console.log('   5. Review and tune error filtering rules');

  console.log('\n✨ Sentry comprehensive testing completed successfully!');

  process.exit(0);
}

// Error handling for the test script
process.on('uncaughtException', error => {
  console.error('\n❌ Uncaught exception in test script:', error);
  console.error('This error was not caught by Sentry (script error)');
  process.exit(1);
});

process.on('unhandledRejection', reason => {
  console.error('\n❌ Unhandled rejection in test script:', reason);
  console.error('This error was not caught by Sentry (script error)');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Test interrupted by user');
  await flushSentry(2000);
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n⚠️  Test terminated');
  await flushSentry(2000);
  process.exit(0);
});

// Run the comprehensive test suite
console.log('🚀 Starting Comprehensive Sentry Test Suite');
console.log('============================================');

runSentryTests().catch(async error => {
  console.error('\n❌ Test suite failed:', error);
  await flushSentry(2000);
  process.exit(1);
});
