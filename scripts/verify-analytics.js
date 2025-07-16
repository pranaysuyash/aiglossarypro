#!/usr/bin/env node

import { config } from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

async function verifyAnalytics() {
  console.log('🧪 Verifying Analytics Configuration...\n');

  let hasErrors = false;

  // Check Google Analytics 4
  console.log('📊 Google Analytics 4:');
  if (
    !process.env.VITE_GA4_MEASUREMENT_ID ||
    process.env.VITE_GA4_MEASUREMENT_ID === 'G-XXXXXXXXXX'
  ) {
    console.error('   ❌ GA4 Measurement ID not configured!');
    console.log('      Set VITE_GA4_MEASUREMENT_ID with your actual measurement ID');
    hasErrors = true;
  } else {
    console.log(`   ✅ Measurement ID: ${process.env.VITE_GA4_MEASUREMENT_ID}`);

    // Check if it's a valid format
    if (!process.env.VITE_GA4_MEASUREMENT_ID.match(/^G-[A-Z0-9]{10}$/)) {
      console.error('   ⚠️  Measurement ID format looks incorrect');
      console.log('      Should be like: G-XXXXXXXXXX (G- followed by 10 alphanumeric characters)');
    }
  }

  if (process.env.VITE_GA4_ENABLED === 'true') {
    console.log('   ✅ GA4 is enabled');
  } else {
    console.log('   ⚠️  GA4 is disabled (VITE_GA4_ENABLED !== true)');
  }

  // Check PostHog
  console.log('\n📈 PostHog Analytics:');
  if (!process.env.VITE_POSTHOG_KEY || !process.env.VITE_PUBLIC_POSTHOG_KEY) {
    console.error('   ❌ PostHog API key not configured!');
    hasErrors = true;
  } else {
    console.log(`   ✅ API Key: ${process.env.VITE_POSTHOG_KEY.substring(0, 20)}...`);
    console.log(`   ✅ Host: ${process.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'}`);

    // Test PostHog connection
    try {
      const response = await fetch(
        `${process.env.VITE_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'}/api/feature_flags/`,
        {
          headers: {
            Authorization: `Bearer ${process.env.VITE_POSTHOG_KEY}`,
          },
        }
      );

      if (response.ok) {
        console.log('   ✅ PostHog connection verified');
      } else {
        console.log('   ⚠️  Could not verify PostHog connection');
        console.log(`      Status: ${response.status}`);
      }
    } catch (error) {
      console.log('   ⚠️  Could not reach PostHog API');
      console.log(`      Error: ${error.message}`);
    }
  }

  // Check Sentry Error Tracking
  console.log('\n🐛 Sentry Error Tracking:');
  if (!process.env.SENTRY_DSN || process.env.SENTRY_DSN.includes('xxxxxxxxxxxxxxxxxxxxxxxxxxxx')) {
    console.log('   ⚠️  Sentry DSN not configured (optional but recommended)');
    console.log('      Sign up at https://sentry.io to get error tracking');
  } else {
    console.log(`   ✅ DSN configured: ${process.env.SENTRY_DSN.substring(0, 30)}...`);

    // Validate DSN format
    if (
      !process.env.SENTRY_DSN.match(/^https:\/\/[a-f0-9]+@[a-z0-9.-]+\.ingest\.sentry\.io\/\d+$/)
    ) {
      console.error('   ⚠️  Sentry DSN format looks incorrect');
    }
  }

  // Check Analytics Disable Flag
  console.log('\n⚙️  Analytics Settings:');
  if (process.env.VITE_DISABLE_ANALYTICS === 'true') {
    if (process.env.NODE_ENV === 'production') {
      console.error('   ❌ Analytics is disabled in production! (VITE_DISABLE_ANALYTICS=true)');
      console.log('      This should only be true in development');
      hasErrors = true;
    } else {
      console.log('   ℹ️  Analytics is disabled for development');
    }
  } else {
    console.log('   ✅ Analytics is enabled');
  }

  // Summary
  console.log('\n📋 Analytics Configuration Summary:');
  if (hasErrors) {
    console.error('   ❌ Some analytics services need configuration');
    console.log('\n💡 Next steps:');
    console.log('   1. Set up Google Analytics 4 and get your Measurement ID');
    console.log('   2. Verify PostHog configuration');
    console.log('   3. Consider setting up Sentry for error tracking');
    console.log('   4. Ensure VITE_DISABLE_ANALYTICS=false for production');
    process.exit(1);
  } else {
    console.log('   ✅ All required analytics services are configured!');
    console.log('\n💡 To test analytics:');
    console.log('   1. Deploy to production');
    console.log('   2. Visit your site');
    console.log('   3. Check real-time data in GA4 and PostHog dashboards');
  }
}

// Run verification
verifyAnalytics().catch(console.error);
