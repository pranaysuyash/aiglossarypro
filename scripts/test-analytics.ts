#!/usr/bin/env tsx

/**
 * Test Analytics Configuration
 * Validates PostHog and Google Analytics setup
 */

import chalk from 'chalk';
import 'dotenv/config';
import { analyticsService } from '../server/config/analytics';

console.log(chalk.blue.bold('📊 Testing AI Glossary Pro Analytics Configuration\n'));

async function testAnalyticsConfiguration() {
  try {
    // Check analytics status
    const status = analyticsService.getStatus();
    
    console.log(chalk.cyan('📊 Analytics Service Status:'));
    console.log(`   PostHog Configured: ${status.posthog.configured ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`   PostHog Enabled: ${status.posthog.enabled ? chalk.green('✓') : chalk.yellow('⚠️')}`);
    console.log(`   Google Analytics Configured: ${status.googleAnalytics.configured ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`   Google Analytics Enabled: ${status.googleAnalytics.enabled ? chalk.green('✓') : chalk.yellow('⚠️')}`);

    if (!status.posthog.configured && !status.googleAnalytics.configured) {
      console.log(chalk.yellow('\n⚠️  No analytics services configured'));
      console.log(chalk.yellow('💡 Configure either:'));
      console.log(chalk.yellow('   • POSTHOG_API_KEY for PostHog analytics'));
      console.log(chalk.yellow('   • VITE_GA4_MEASUREMENT_ID for Google Analytics'));
      return false;
    }

    // Test PostHog if configured
    if (status.posthog.configured && status.posthog.enabled) {
      console.log(chalk.cyan('\n🧪 Testing PostHog Analytics...'));
      
      try {
        const testResults = await analyticsService.testConfiguration();
        
        if (testResults.posthog) {
          console.log(chalk.green('✅ PostHog test successful'));
        } else {
          console.log(chalk.red('❌ PostHog test failed'));
        }
      } catch (error) {
        console.log(chalk.red('❌ PostHog test error:'), error);
      }
    }

    // Test Google Analytics configuration
    if (status.googleAnalytics.configured) {
      console.log(chalk.cyan('\n🧪 Checking Google Analytics Configuration...'));
      console.log(chalk.green('✅ Google Analytics measurement ID configured'));
      console.log(chalk.blue('ℹ️  Google Analytics runs client-side - check browser console for tracking'));
    }

    return true;
  } catch (error) {
    console.error(chalk.red.bold('\n❌ Analytics test error:'), error);
    return false;
  }
}

async function testAnalyticsEvents() {
  console.log(chalk.cyan('\n📈 Testing Analytics Events...\n'));

  const testUserId = 'test-user-analytics';
  
  try {
    // Test basic tracking
    console.log(chalk.blue('Testing event tracking...'));
    analyticsService.track(testUserId, 'test_event', {
      test: true,
      timestamp: new Date().toISOString(),
      source: 'analytics_test',
    });
    console.log(chalk.green('✓ Event tracking test sent'));

    // Test user identification
    console.log(chalk.blue('Testing user identification...'));
    analyticsService.identify(testUserId, {
      email: 'test@example.com',
      name: 'Test User',
      plan: 'free',
      test_user: true,
    });
    console.log(chalk.green('✓ User identification test sent'));

    // Test business events
    console.log(chalk.blue('Testing business events...'));
    analyticsService.trackBusinessEvent(testUserId, 'search_performed', {
      query: 'machine learning',
      results_count: 50,
      test: true,
    });
    console.log(chalk.green('✓ Business event test sent'));

    // Test conversion tracking
    console.log(chalk.blue('Testing conversion tracking...'));
    analyticsService.trackConversion(testUserId, 'registration', undefined, {
      source: 'test',
      campaign: 'analytics_testing',
    });
    console.log(chalk.green('✓ Conversion tracking test sent'));

    // Test milestone tracking
    console.log(chalk.blue('Testing milestone tracking...'));
    analyticsService.trackMilestone(testUserId, 'first_search', {
      timestamp: new Date().toISOString(),
      test: true,
    });
    console.log(chalk.green('✓ Milestone tracking test sent'));

    // Test performance tracking
    console.log(chalk.blue('Testing performance tracking...'));
    analyticsService.trackPerformance(testUserId, 'page_load_time', 1250, {
      page: '/test',
      browser: 'test',
    });
    console.log(chalk.green('✓ Performance tracking test sent'));

    // Flush analytics data
    console.log(chalk.blue('Flushing analytics data...'));
    await analyticsService.flush();
    console.log(chalk.green('✓ Analytics data flushed'));

    console.log(chalk.green.bold('\n🎉 All analytics events tested successfully!'));
    console.log(chalk.blue('📊 Check your PostHog dashboard for test events'));
    
    return true;
  } catch (error) {
    console.error(chalk.red('\n❌ Analytics events testing failed:'), error);
    return false;
  }
}

async function testFeatureFlags() {
  console.log(chalk.cyan('\n🚩 Testing Feature Flags...\n'));

  const testUserId = 'test-user-feature-flags';
  
  try {
    // Test getting a feature flag
    console.log(chalk.blue('Testing feature flag retrieval...'));
    const flagValue = await analyticsService.getFeatureFlag('test_feature', testUserId, false);
    console.log(chalk.green(`✓ Feature flag 'test_feature' value: ${flagValue}`));

    return true;
  } catch (error) {
    console.error(chalk.red('\n❌ Feature flags testing failed:'), error);
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const testEvents = args.includes('--events') || args.includes('-e');
  const testFlags = args.includes('--flags') || args.includes('-f');
  const testAll = args.includes('--all') || args.includes('-a');
  
  if (testAll) {
    console.log(chalk.blue('🔄 Running comprehensive analytics tests...\n'));
    
    const configResult = await testAnalyticsConfiguration();
    if (!configResult) {
      process.exit(1);
    }
    
    const eventsResult = await testAnalyticsEvents();
    const flagsResult = await testFeatureFlags();
    
    if (configResult && eventsResult && flagsResult) {
      console.log(chalk.green.bold('\n🚀 All analytics tests passed! Configuration is working.'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️  Some tests failed. Review configuration.'));
      process.exit(1);
    }
  } else if (testEvents) {
    await testAnalyticsEvents();
  } else if (testFlags) {
    await testFeatureFlags();
  } else {
    // Just test basic configuration
    await testAnalyticsConfiguration();
  }
}

// Help message
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(chalk.blue.bold('📊 Analytics Testing Script\n'));
  console.log('Usage:');
  console.log('  npm run test:analytics                 # Test basic configuration');
  console.log('  npm run test:analytics -- --events     # Test event tracking');
  console.log('  npm run test:analytics -- --flags      # Test feature flags');
  console.log('  npm run test:analytics -- --all        # Test everything');
  console.log('  npm run test:analytics -- --help       # Show this help\n');
  console.log('Environment Variables:');
  console.log('  POSTHOG_API_KEY                       # PostHog analytics API key');
  console.log('  POSTHOG_HOST                          # PostHog host (optional)');
  console.log('  VITE_GA4_MEASUREMENT_ID               # Google Analytics 4 measurement ID');
  console.log('  VITE_GA4_ENABLED                      # Enable Google Analytics\n');
  process.exit(0);
}

main().catch(console.error);