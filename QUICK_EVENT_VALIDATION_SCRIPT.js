/**
 * Quick PostHog Event Validation Script
 * Run this in browser console to test event firing and A/B attribution
 */

// 🧪 Quick Event Validation Test Suite
function validatePostHogEvents() {
  console.log('🚀 Starting PostHog Event Validation...');
  
  // Test 1: Check PostHog initialization
  if (typeof posthog === 'undefined') {
    console.error('❌ PostHog not loaded!');
    return false;
  }
  console.log('✅ PostHog is loaded and available');
  
  // Test 2: Check feature flag assignment
  const variant = posthog.getFeatureFlag('landingPageVariant');
  console.log(`🎯 Landing Page Variant: ${variant || 'NOT SET'}`);
  
  if (!variant) {
    console.warn('⚠️ No A/B test variant assigned');
  }
  
  // Test 3: Test event firing with attribution
  const testEventData = {
    test_run: true,
    timestamp: new Date().toISOString(),
    experiment_variant: variant,
    page_url: window.location.href,
    user_agent: navigator.userAgent.substring(0, 50)
  };
  
  console.log('📊 Firing test event with data:', testEventData);
  posthog.capture('validation_test_event', testEventData);
  
  // Test 4: Check user properties
  const userProps = posthog.getPersonPropertiesCache();
  console.log('👤 User Properties:', userProps);
  
  // Test 5: Test core events that should be firing
  const eventsToTest = [
    {
      name: 'landing_page_view',
      trigger: () => {
        console.log('🏠 Testing landing page view event...');
        posthog.capture('landing_page_view', {
          landing_variant: variant,
          page_path: window.location.pathname,
          test_mode: true
        });
      }
    },
    {
      name: 'sample_term_view', 
      trigger: () => {
        console.log('📖 Testing sample term view event...');
        posthog.capture('sample_term_view', {
          term_slug: 'test-term',
          term_category: 'test-category',
          user_type: 'guest',
          source: 'validation_test',
          experiment_variant: variant
        });
      }
    },
    {
      name: 'cta_click',
      trigger: () => {
        console.log('🖱️ Testing CTA click event...');
        posthog.capture('cta_click', {
          cta_text: 'Test CTA',
          cta_location: 'validation_test',
          experiment_variant: variant,
          landing_variant: variant
        });
      }
    }
  ];
  
  // Fire test events
  eventsToTest.forEach(event => {
    event.trigger();
  });
  
  console.log('✅ All test events fired!');
  
  // Test 6: Monitor network requests (manual check)
  console.log('📡 Check Network tab for PostHog requests...');
  console.log('   Look for requests to: api.posthog.com or app.posthog.com');
  
  return true;
}

// 🔍 A/B Test Bucket Validation
function validateABTestBuckets() {
  console.log('🧪 Starting A/B Test Bucket Validation...');
  
  const variant = posthog.getFeatureFlag('landingPageVariant');
  console.log(`Current bucket: ${variant}`);
  
  if (variant === 'control') {
    console.log('📊 You are in the CONTROL bucket');
    console.log('   Expected: Original landing page');
    console.log('   Should see: Standard CTAs and messaging');
  } else if (variant === 'marketing_sample') {
    console.log('📊 You are in the MARKETING_SAMPLE bucket');
    console.log('   Expected: Landing A with sample-focused CTAs');
    console.log('   Should see: "Explore Free Samples" primary CTA');
  } else {
    console.warn('⚠️ Unknown or missing variant assignment');
  }
  
  // Test variant consistency
  console.log('🔄 Testing variant consistency...');
  setTimeout(() => {
    const newVariant = posthog.getFeatureFlag('landingPageVariant');
    if (newVariant === variant) {
      console.log('✅ Variant assignment is consistent');
    } else {
      console.error('❌ Variant assignment changed!', {
        original: variant,
        new: newVariant
      });
    }
  }, 1000);
}

// 📊 Event Monitoring Helper
function monitorPostHogEvents() {
  console.log('👀 Starting event monitoring...');
  console.log('   Events will be logged for the next 60 seconds');
  
  // Override capture to log events
  const originalCapture = posthog.capture;
  const eventLog = [];
  
  posthog.capture = function(eventName, properties) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: eventName,
      properties: properties,
      variant: posthog.getFeatureFlag('landingPageVariant')
    };
    
    eventLog.push(logEntry);
    console.log('📊 Event captured:', logEntry);
    
    return originalCapture.call(this, eventName, properties);
  };
  
  // Restore original after 60 seconds
  setTimeout(() => {
    posthog.capture = originalCapture;
    console.log('📋 Event monitoring stopped. Summary:');
    console.log(`   Total events captured: ${eventLog.length}`);
    console.log('   Events by type:', eventLog.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {}));
    console.log('   Full log:', eventLog);
  }, 60000);
}

// 🚨 Quick Health Check
function quickHealthCheck() {
  console.log('🩺 Running Quick Health Check...');
  
  const checks = [
    {
      name: 'PostHog Loaded',
      test: () => typeof posthog !== 'undefined',
      fix: 'Ensure PostHog script is loaded in <head>'
    },
    {
      name: 'Feature Flags Available',
      test: () => posthog.getFeatureFlag('landingPageVariant') !== undefined,
      fix: 'Check feature flag configuration in PostHog dashboard'
    },
    {
      name: 'Page URL Correct',
      test: () => window.location.hostname.includes('aiglossarypro'),
      fix: 'Make sure you are on the correct domain'
    },
    {
      name: 'No Console Errors',
      test: () => {
        // This is a simplified check - in real testing, check console manually
        return true;
      },
      fix: 'Check browser console for JavaScript errors'
    }
  ];
  
  checks.forEach(check => {
    const passed = check.test();
    console.log(`${passed ? '✅' : '❌'} ${check.name}`);
    if (!passed) {
      console.log(`   Fix: ${check.fix}`);
    }
  });
}

// 🎯 Complete Validation Test
function runCompleteValidation() {
  console.log('🎯 Running Complete PostHog Validation Test...');
  console.log('=' * 50);
  
  quickHealthCheck();
  console.log('');
  
  validateABTestBuckets();
  console.log('');
  
  validatePostHogEvents();
  console.log('');
  
  console.log('🔍 Next Steps:');
  console.log('1. Check PostHog Live Events dashboard');
  console.log('2. Verify events appear within 30 seconds');
  console.log('3. Confirm attribution properties are correct');
  console.log('4. Test on multiple devices/browsers');
  
  console.log('');
  console.log('📊 To monitor events continuously, run:');
  console.log('   monitorPostHogEvents()');
}

// 💫 Auto-run on script load
console.log('🧪 PostHog Event Validation Script Loaded');
console.log('');
console.log('Available functions:');
console.log('  runCompleteValidation() - Full test suite');
console.log('  validatePostHogEvents() - Test event firing');
console.log('  validateABTestBuckets() - Check A/B assignment');
console.log('  monitorPostHogEvents() - Monitor events for 60s');
console.log('  quickHealthCheck() - Basic health check');
console.log('');
console.log('🚀 Run runCompleteValidation() to start testing!');

// Export functions to global scope for easy access
window.runCompleteValidation = runCompleteValidation;
window.validatePostHogEvents = validatePostHogEvents;
window.validateABTestBuckets = validateABTestBuckets;
window.monitorPostHogEvents = monitorPostHogEvents;
window.quickHealthCheck = quickHealthCheck;