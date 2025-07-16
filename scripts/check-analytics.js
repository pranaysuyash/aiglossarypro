#!/usr/bin/env node

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from client/.env
config({ path: resolve(process.cwd(), 'client/.env') });

console.log('🔍 Checking analytics configuration...\n');

// Check PostHog configuration
console.log('📊 PostHog Configuration:');
console.log(`   VITE_POSTHOG_KEY: ${process.env.VITE_POSTHOG_KEY ? '✅ Set' : '❌ Not set'}`);
console.log(
  `   VITE_PUBLIC_POSTHOG_KEY: ${process.env.VITE_PUBLIC_POSTHOG_KEY ? '✅ Set' : '❌ Not set'}`
);
console.log(`   VITE_PUBLIC_POSTHOG_HOST: ${process.env.VITE_PUBLIC_POSTHOG_HOST || 'Not set'}`);
console.log(`   VITE_DISABLE_ANALYTICS: ${process.env.VITE_DISABLE_ANALYTICS || 'false'}`);

// Check Google Analytics configuration
console.log('\n📈 Google Analytics Configuration:');
console.log(`   VITE_GA4_MEASUREMENT_ID: ${process.env.VITE_GA4_MEASUREMENT_ID || 'Not set'}`);
console.log(`   VITE_GA4_ENABLED: ${process.env.VITE_GA4_ENABLED || 'false'}`);

// Analytics status
console.log('\n🎯 Analytics Status:');
const isAnalyticsDisabled =
  process.env.NODE_ENV === 'development' && process.env.VITE_DISABLE_ANALYTICS === 'true';
console.log(`   Analytics Disabled in Local Dev: ${isAnalyticsDisabled ? '✅ YES' : '❌ NO'}`);
console.log(`   Environment: ${process.env.NODE_ENV || 'Not set'}`);

if (isAnalyticsDisabled) {
  console.log('\n✅ Analytics tracking is DISABLED for local development');
  console.log('   PostHog and GA4 will not send any tracking events');
} else {
  console.log('\n⚠️  Analytics tracking is ENABLED');
  console.log(
    '   Set VITE_DISABLE_ANALYTICS=true in client/.env to disable tracking in development'
  );
}
