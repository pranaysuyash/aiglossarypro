# PostHog Event Firing & A/B Attribution Testing

## 🎯 Testing Objective
Verify that all PostHog events are firing correctly and A/B test attribution is working properly across different experiment buckets.

## 📊 A/B Test Attribution Validation

### Landing Page Variant Testing

#### Test Setup
1. **Clear cookies/localStorage** to reset experiment assignment
2. **Navigate to homepage** multiple times to test bucket assignment
3. **Verify consistent variant** assignment within session
4. **Check PostHog feature flags** are properly set

#### Experiment Buckets to Test
- **Control Bucket**: Original landing page (`landingPageVariant = 'control'`)
- **Marketing Sample Bucket**: Landing A page (`landingPageVariant = 'marketing_sample'`)

#### Expected Attribution Properties
```javascript
// Control Bucket Events
{
  "event": "landing_page_view",
  "properties": {
    "$feature/landingPageVariant": "control",
    "landing_variant": "control",
    "page_path": "/",
    "experiment_variant": "control"
  }
}

// Marketing Sample Bucket Events  
{
  "event": "landing_page_view", 
  "properties": {
    "$feature/landingPageVariant": "marketing_sample",
    "landing_variant": "marketing_sample", 
    "page_path": "/",
    "experiment_variant": "marketing_sample"
  }
}
```

## 🔍 Event Firing Validation

### Core Events to Verify

#### 1. Landing Page Events
**Event Name**: `landing_page_view`
**Trigger**: Page load on homepage
**Required Properties**:
- `$feature/landingPageVariant`: ['control', 'marketing_sample']
- `landing_variant`: string
- `page_path`: string
- `utm_source`: string (if present)
- `experiment_variant`: string

**Test Steps**:
1. Open PostHog Live Events dashboard
2. Navigate to homepage in incognito window
3. Verify event appears in live feed
4. Check all required properties are present
5. Repeat for both A/B buckets

#### 2. Sample Content Events
**Event Name**: `sample_term_view`  
**Trigger**: Viewing individual sample terms
**Required Properties**:
- `term_slug`: string
- `term_category`: string  
- `user_type`: ['guest', 'free', 'premium']
- `source`: ['sample_page', 'search', 'landing']
- `experiment_variant`: string (inherited from session)

**Test Steps**:
1. Click "Explore Free Samples" CTA
2. Click on individual sample term
3. Verify event fires with correct properties
4. Test from both A/B variants

#### 3. Conversion Events
**Event Name**: `signup_completed`
**Trigger**: Successful account creation
**Required Properties**:
- `source`: string (referring page)
- `experiment_variant`: string
- `referrer_id`: string (if applicable)
- `utm_campaign`: string (if present)

**Test Steps**:
1. Complete signup flow from each A/B variant
2. Verify event fires with experiment attribution
3. Check conversion attribution is maintained

#### 4. CTA Interaction Events
**Event Name**: `cta_click`
**Trigger**: Clicking call-to-action buttons
**Required Properties**:
- `cta_text`: string
- `cta_location`: ['hero', 'pricing', 'footer']
- `experiment_variant`: string
- `landing_variant`: string

**Test Steps**:
1. Click various CTAs in both A/B variants
2. Verify different CTA texts are tracked correctly
3. Check experiment attribution persists

## 🧪 A/B Test Attribution Verification

### Attribution Flow Testing

#### Test 1: Bucket Assignment Consistency
```javascript
// Test Script for Browser Console
function testBucketConsistency() {
  // Check feature flag assignment
  const variant = posthog.getFeatureFlag('landingPageVariant');
  console.log('Assigned variant:', variant);
  
  // Verify consistent assignment across page reloads
  for(let i = 0; i < 5; i++) {
    setTimeout(() => {
      const currentVariant = posthog.getFeatureFlag('landingPageVariant');
      console.log(`Reload ${i+1}: ${currentVariant}`);
      if(currentVariant !== variant) {
        console.error('Inconsistent bucket assignment!');
      }
    }, i * 1000);
  }
}

testBucketConsistency();
```

#### Test 2: Event Attribution Chain
Verify experiment attribution flows through entire user journey:

1. **Landing Page**: `landing_page_view` with variant
2. **Sample View**: `sample_term_view` with inherited variant  
3. **CTA Click**: `cta_click` with variant context
4. **Signup**: `signup_completed` with full attribution chain

#### Test 3: Cross-Session Attribution
Test that attribution persists across:
- Page refreshes
- Navigation between pages
- Browser tab changes
- Short session breaks (< 30 minutes)

### Attribution Validation Checklist

#### PostHog Dashboard Verification
- [ ] Open PostHog Live Events
- [ ] Filter by `$feature/landingPageVariant` property
- [ ] Verify roughly 50/50 split between variants
- [ ] Check events include experiment context
- [ ] Confirm no events missing attribution

#### Event Property Validation
- [ ] All events include `experiment_variant` property
- [ ] Feature flags (`$feature/landingPageVariant`) are set
- [ ] User properties maintain experiment context
- [ ] Session properties include variant assignment

#### Conversion Attribution
- [ ] Conversion events trace back to original variant
- [ ] Revenue attribution works correctly
- [ ] Funnel analysis shows variant performance
- [ ] Cohort analysis includes experiment segmentation

## 🔧 Testing Tools & Scripts

### Browser Console Testing
```javascript
// Check current experiment assignment
console.log('Current variant:', posthog.getFeatureFlag('landingPageVariant'));

// Track test event with attribution
posthog.capture('test_event', {
  test_type: 'attribution_validation',
  experiment_variant: posthog.getFeatureFlag('landingPageVariant'),
  timestamp: new Date().toISOString()
});

// Check user properties
console.log('User properties:', posthog.getPersonPropertiesCache());
```

### PostHog Query Testing
```sql
-- Check event distribution by variant
SELECT 
  properties.$feature_landingPageVariant as variant,
  COUNT(*) as event_count,
  COUNT(DISTINCT person_id) as unique_users
FROM events 
WHERE event = 'landing_page_view'
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY variant;

-- Verify attribution chain integrity  
SELECT 
  person_id,
  properties.$feature_landingPageVariant as variant,
  COUNT(*) as events
FROM events
WHERE timestamp >= now() - INTERVAL 1 DAY
  AND properties.$feature_landingPageVariant IS NOT NULL
GROUP BY person_id, variant
HAVING COUNT(DISTINCT properties.$feature_landingPageVariant) > 1;
```

### Network Request Validation
```javascript
// Monitor PostHog network requests
// In Chrome DevTools Network tab, filter by "posthog"
// Verify requests include experiment properties

// Check event payload structure
const originalCapture = posthog.capture;
posthog.capture = function(eventName, properties) {
  console.log('Event:', eventName, 'Properties:', properties);
  return originalCapture.call(this, eventName, properties);
};
```

## 📊 Testing Results Validation

### Event Volume Verification
Expected event volumes per hour (rough estimates):
- `landing_page_view`: 50-100 events
- `sample_term_view`: 30-60 events  
- `cta_click`: 20-40 events
- `signup_completed`: 2-5 events

### A/B Split Validation
- **Bucket Distribution**: ~50% control, ~50% marketing_sample
- **Attribution Rate**: >95% of events include experiment context
- **Consistency**: <1% variant switching within sessions

### Performance Impact
- **Event Firing Delay**: <100ms after trigger
- **Network Overhead**: <5KB per event payload
- **JavaScript Errors**: 0 errors related to tracking

## 🐛 Common Issues & Troubleshooting

### Issue 1: Missing Feature Flags
**Symptoms**: Events fire but no `$feature/landingPageVariant` property
**Causes**: 
- PostHog not initialized before feature flag check
- Feature flag not configured in PostHog dashboard
- Race condition in code execution

**Solutions**:
```javascript
// Ensure PostHog is ready before checking flags
posthog.onFeatureFlags(() => {
  const variant = posthog.getFeatureFlag('landingPageVariant');
  // Now safe to use variant
});
```

### Issue 2: Inconsistent Attribution
**Symptoms**: Same user showing different variants
**Causes**:
- Feature flag evaluated multiple times
- Cookie/localStorage cleared mid-session
- Browser private/incognito mode

**Solutions**:
- Cache feature flag value in session
- Implement fallback attribution logic
- Add debugging for variant switches

### Issue 3: Events Not Firing
**Symptoms**: No events appearing in PostHog
**Causes**:
- JavaScript errors preventing execution  
- Network connectivity issues
- Event batching delays

**Solutions**:
- Check browser console for errors
- Verify PostHog network requests
- Test with immediate event flushing

## ✅ Validation Checklist

### Pre-Testing Setup
- [ ] PostHog project configured with feature flags
- [ ] Landing page A/B test is active
- [ ] Event tracking code deployed
- [ ] Test user accounts available

### Core Event Testing
- [ ] `landing_page_view` fires with variant attribution
- [ ] `sample_term_view` includes experiment context
- [ ] `cta_click` events track variant and location
- [ ] `signup_completed` maintains attribution chain

### A/B Attribution Testing  
- [ ] Bucket assignment is consistent within session
- [ ] Roughly 50/50 split between variants
- [ ] All events include experiment properties
- [ ] Attribution persists across page navigation

### PostHog Dashboard Testing
- [ ] Live events show real-time activity
- [ ] Event properties display correctly
- [ ] Funnel analysis works with variant breakdown
- [ ] User cohorts can be segmented by experiment

### Performance & Error Testing
- [ ] No JavaScript errors in console
- [ ] Event firing doesn't impact page performance
- [ ] Network requests complete successfully
- [ ] Event payloads are properly formatted

## 📈 Success Criteria

### Event Accuracy
- **100%** of landing page views include variant attribution
- **>95%** of user events maintain experiment context
- **<1%** variant switching within user sessions
- **0** JavaScript errors related to tracking

### Attribution Integrity
- **Consistent buckets**: Users stay in assigned variant
- **Complete chains**: Full journey attribution from landing → conversion
- **Real-time tracking**: Events appear in PostHog within 30 seconds
- **Accurate segmentation**: Dashboard analysis reflects true variant performance

## 📋 Test Execution Timeline

### Phase 1: Basic Event Verification (1 hour)
- [ ] Test core events fire correctly
- [ ] Verify event properties structure
- [ ] Check PostHog Live Events dashboard

### Phase 2: A/B Attribution Testing (2 hours)  
- [ ] Test bucket assignment consistency
- [ ] Verify attribution chain integrity
- [ ] Validate cross-session persistence

### Phase 3: Dashboard & Analysis (1 hour)
- [ ] Test PostHog dashboard functionality
- [ ] Verify funnel analysis with variants
- [ ] Check cohort segmentation works

### Phase 4: Performance & Edge Cases (1 hour)
- [ ] Test high-traffic scenarios
- [ ] Verify error handling
- [ ] Test edge cases (disabled JS, slow networks)

---

**Total Testing Time**: 5 hours
**Critical Pass Criteria**: All core events fire with proper attribution
**Success Metric**: >95% attribution accuracy across all events