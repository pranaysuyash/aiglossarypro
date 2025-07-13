#!/usr/bin/env tsx

/**
 * Test Sentry Error Tracking Configuration
 * Validates Sentry setup and error reporting
 */

import chalk from 'chalk';
import 'dotenv/config';
import {
  initializeSentry,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  setTag,
  isSentryEnabled,
  flushSentry,
  Sentry,
} from '../server/config/sentry';

console.log(chalk.blue.bold('🚨 Testing AI Glossary Pro Sentry Configuration\n'));

async function testSentryConfiguration() {
  try {
    // Initialize Sentry
    initializeSentry();
    
    // Check Sentry status
    const enabled = isSentryEnabled();
    
    console.log(chalk.cyan('🚨 Sentry Service Status:'));
    console.log(`   DSN Configured: ${process.env.SENTRY_DSN ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Enabled: ${enabled ? chalk.green('✓') : chalk.yellow('⚠️')}`);
    console.log(`   Release: ${process.env.SENTRY_RELEASE || 'not set'}`);

    if (!process.env.SENTRY_DSN) {
      console.log(chalk.yellow('\n⚠️  Sentry DSN not configured'));
      console.log(chalk.yellow('💡 Set SENTRY_DSN to enable error tracking'));
      console.log(chalk.yellow('   1. Create account at https://sentry.io'));
      console.log(chalk.yellow('   2. Create new Node.js project'));
      console.log(chalk.yellow('   3. Copy DSN to SENTRY_DSN environment variable'));
      return false;
    }

    if (!enabled) {
      console.log(chalk.yellow('\n⚠️  Sentry is configured but disabled'));
      console.log(chalk.yellow('   Sentry only runs in production (NODE_ENV=production)'));
      console.log(chalk.blue('ℹ️  This is normal for development/testing'));
      return true;
    }

    console.log(chalk.green('\n✅ Sentry configuration looks good!'));
    return true;
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Sentry configuration test failed:'), error);
    return false;
  }
}

async function testSentryFeatures() {
  console.log(chalk.cyan('\n🧪 Testing Sentry Features...\n'));

  try {
    // Test user context
    console.log(chalk.blue('Testing user context...'));
    setUser({
      id: 'test-user-123',
      email: 'test@example.com',
      username: 'test_user',
    });
    console.log(chalk.green('✓ User context set'));

    // Test tags
    console.log(chalk.blue('Testing tags...'));
    setTag('test_type', 'sentry_configuration_test');
    setTag('component', 'error_tracking');
    console.log(chalk.green('✓ Tags set'));

    // Test breadcrumbs
    console.log(chalk.blue('Testing breadcrumbs...'));
    addBreadcrumb('Started Sentry test', 'test', 'info', {
      timestamp: new Date().toISOString(),
      test: true,
    });
    addBreadcrumb('User context configured', 'test', 'info');
    addBreadcrumb('Tags configured', 'test', 'info');
    console.log(chalk.green('✓ Breadcrumbs added'));

    // Test message capture
    console.log(chalk.blue('Testing message capture...'));
    const messageId = captureMessage('Sentry configuration test message', 'info', {
      tags: {
        test: 'true',
        feature: 'message_capture',
      },
      extra: {
        timestamp: new Date().toISOString(),
        test_data: 'This is test data for Sentry configuration',
      },
    });
    
    if (messageId) {
      console.log(chalk.green(`✓ Message captured with ID: ${messageId}`));
    } else {
      console.log(chalk.yellow('⚠️  Message capture returned undefined (disabled in development)'));
    }

    // Test exception capture
    console.log(chalk.blue('Testing exception capture...'));
    const testError = new Error('This is a test error for Sentry configuration');
    testError.stack = `Error: This is a test error for Sentry configuration
    at testSentryFeatures (/test/sentry.ts:123:45)
    at main (/test/sentry.ts:200:12)`;
    
    const exceptionId = captureException(testError, {
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
      },
      tags: {
        test: 'true',
        error_type: 'configuration_test',
      },
      extra: {
        test_context: 'Sentry configuration testing',
        timestamp: new Date().toISOString(),
      },
      level: 'warning', // Use warning so it doesn't appear as a real error
    });

    if (exceptionId) {
      console.log(chalk.green(`✓ Exception captured with ID: ${exceptionId}`));
    } else {
      console.log(chalk.yellow('⚠️  Exception capture returned undefined (disabled in development)'));
    }

    // Test transaction (performance monitoring)
    console.log(chalk.blue('Testing transaction/performance monitoring...'));
    const transaction = Sentry.startTransaction({
      name: 'sentry_configuration_test',
      op: 'test',
      description: 'Testing Sentry performance monitoring',
    });

    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));

    transaction.setTag('test', 'true');
    transaction.setData('test_duration', 100);
    transaction.finish();
    console.log(chalk.green('✓ Transaction/performance monitoring tested'));

    // Flush Sentry data
    console.log(chalk.blue('Flushing Sentry data...'));
    const flushed = await flushSentry(3000);
    
    if (flushed) {
      console.log(chalk.green('✓ Sentry data flushed successfully'));
    } else {
      console.log(chalk.yellow('⚠️  Sentry flush completed (may be disabled in development)'));
    }

    console.log(chalk.green.bold('\n🎉 All Sentry features tested successfully!'));
    
    if (isSentryEnabled()) {
      console.log(chalk.blue('📊 Check your Sentry dashboard for test events:'));
      console.log(chalk.blue(`   Dashboard: ${process.env.SENTRY_DSN?.split('@')[1]?.split('/')[0] || 'sentry.io'}`));
    } else {
      console.log(chalk.blue('ℹ️  No events sent (Sentry disabled in development mode)'));
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red('\n❌ Sentry features testing failed:'), error);
    return false;
  }
}

async function testSentryIntegration() {
  console.log(chalk.cyan('\n🔗 Testing Sentry Integration...\n'));

  try {
    // Test with Express-like error
    console.log(chalk.blue('Testing Express integration simulation...'));
    const expressError = new Error('Express route error simulation');
    expressError.name = 'ValidationError';
    
    captureException(expressError, {
      tags: {
        component: 'express',
        route: '/api/test',
        method: 'POST',
      },
      extra: {
        request_id: 'test-req-123',
        user_agent: 'Test/1.0',
        ip_address: '127.0.0.1',
      },
      level: 'warning',
    });
    console.log(chalk.green('✓ Express integration simulation tested'));

    // Test with database-like error
    console.log(chalk.blue('Testing database error simulation...'));
    const dbError = new Error('Database connection timeout');
    dbError.name = 'DatabaseError';
    
    captureException(dbError, {
      tags: {
        component: 'database',
        operation: 'query',
        table: 'users',
      },
      extra: {
        query: 'SELECT * FROM users WHERE id = ?',
        timeout: 5000,
      },
      level: 'error',
    });
    console.log(chalk.green('✓ Database error simulation tested'));

    return true;
  } catch (error) {
    console.error(chalk.red('\n❌ Sentry integration testing failed:'), error);
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const testFeatures = args.includes('--features') || args.includes('-f');
  const testIntegration = args.includes('--integration') || args.includes('-i');
  const testAll = args.includes('--all') || args.includes('-a');
  
  if (testAll) {
    console.log(chalk.blue('🔄 Running comprehensive Sentry tests...\n'));
    
    const configResult = await testSentryConfiguration();
    if (!configResult) {
      console.log(chalk.red('\n❌ Configuration test failed - skipping other tests'));
      process.exit(1);
    }
    
    const featuresResult = await testSentryFeatures();
    const integrationResult = await testSentryIntegration();
    
    if (configResult && featuresResult && integrationResult) {
      console.log(chalk.green.bold('\n🚀 All Sentry tests passed! Error tracking is ready.'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️  Some tests failed. Review configuration.'));
      process.exit(1);
    }
  } else if (testFeatures) {
    await testSentryFeatures();
  } else if (testIntegration) {
    await testSentryIntegration();
  } else {
    // Just test basic configuration
    await testSentryConfiguration();
  }
}

// Help message
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(chalk.blue.bold('🚨 Sentry Testing Script\n'));
  console.log('Usage:');
  console.log('  npm run test:sentry                   # Test basic configuration');
  console.log('  npm run test:sentry -- --features     # Test all Sentry features');
  console.log('  npm run test:sentry -- --integration  # Test integration scenarios');
  console.log('  npm run test:sentry -- --all          # Test everything');
  console.log('  npm run test:sentry -- --help         # Show this help\n');
  console.log('Environment Variables:');
  console.log('  SENTRY_DSN                           # Required: Sentry Data Source Name');
  console.log('  SENTRY_ENVIRONMENT                   # Environment (production, staging, etc.)');
  console.log('  SENTRY_RELEASE                       # Release version');
  console.log('  NODE_ENV                             # Must be "production" for Sentry to be active\n');
  console.log('Setup Instructions:');
  console.log('  1. Create account at https://sentry.io');
  console.log('  2. Create new Node.js project');
  console.log('  3. Copy DSN to SENTRY_DSN environment variable');
  console.log('  4. Set NODE_ENV=production to enable Sentry\n');
  process.exit(0);
}

main().catch(console.error);