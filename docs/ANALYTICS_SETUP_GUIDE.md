# AI Glossary Pro Analytics Setup Guide

This guide provides comprehensive instructions for setting up analytics and measurement for A/B testing using PostHog and the configuration files provided.

## Table of Contents

1. [Overview](#overview)
2. [PostHog Setup](#posthog-setup)
3. [Funnel Configuration](#funnel-configuration)
4. [Dashboard Setup](#dashboard-setup)
5. [Heatmap Implementation](#heatmap-implementation)
6. [Automated Reporting](#automated-reporting)
7. [Alert Configuration](#alert-configuration)
8. [Best Practices](#best-practices)

## Overview

The analytics setup consists of five main components:

1. **Funnel Tracking** - Conversion funnels for user journey analysis
2. **A/B Test Dashboards** - Real-time monitoring of experiments
3. **Heatmap Tracking** - Visual analysis of user interactions
4. **Automated Reports** - Scheduled insights and recommendations
5. **Alert System** - Proactive monitoring and notifications

## PostHog Setup

### Initial Configuration

1. Install PostHog SDK:
```bash
npm install posthog-js
```

2. Initialize PostHog in your application:
```typescript
import posthog from 'posthog-js';
import { posthogFunnelConfig } from './analytics/posthog-funnel-config';
import { implementHeatmapTracking } from './analytics/heatmap-tracking-config';

// Initialize PostHog
posthog.init(process.env.VITE_POSTHOG_KEY, {
  api_host: process.env.VITE_POSTHOG_HOST,
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: false, // We'll manually track specific events
  ...implementHeatmapTracking()
});
```

### Event Tracking Implementation

```typescript
// Track conversion events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  posthog.capture(eventName, {
    ...properties,
    timestamp: new Date().toISOString(),
    session_id: posthog.get_session_id()
  });
};

// Track A/B test variants
export const trackVariant = (testId: string, variant: string) => {
  posthog.capture('experiment_viewed', {
    experiment_id: testId,
    variant: variant
  });
  
  // Set feature flag for consistent experience
  posthog.feature_flags.override({ [testId]: variant });
};
```

## Funnel Configuration

### Creating Funnels in PostHog

1. Navigate to PostHog Dashboard → Insights → Funnels
2. Use the configuration from `posthog-funnel-config.ts`:

```typescript
import { funnels, posthogFunnelConfig } from './analytics/posthog-funnel-config';

// Example: Create landing to purchase funnel
const landingToPurchase = posthogFunnelConfig.createPostHogFunnel('landing_to_purchase');

// In PostHog UI:
// 1. Click "New Funnel"
// 2. Add each step from landingToPurchase.steps
// 3. Set conversion window to 168 hours (7 days)
// 4. Apply filters for A/B test variants
```

### Key Funnels to Set Up

1. **Landing to Purchase** - Main conversion funnel
2. **Free Trial Conversion** - Trial to paid tracking
3. **Onboarding Completion** - User activation
4. **Feature Engagement** - Product usage patterns

## Dashboard Setup

### Creating A/B Test Dashboards

1. Import dashboard configuration:
```typescript
import { createDashboard, abTests } from './analytics/ab-test-dashboard-config';

// Create dashboard for hero section test
const heroDashboard = createDashboard('hero_section_test');
```

2. In PostHog Dashboard:
   - Click "Dashboards" → "New Dashboard"
   - Name it according to the test
   - Add widgets from the configuration

### Essential Dashboard Widgets

1. **Conversion Rate Chart**
   - Type: Line chart
   - Breakdown by variant
   - Show confidence intervals

2. **Statistical Significance Calculator**
   - Type: Custom insight
   - Display p-value and confidence intervals
   - Highlight when significance reached

3. **Sample Size Progress**
   - Type: Progress bar
   - Show current vs. required sample size
   - Estimate completion date

4. **Segment Analysis**
   - Type: Bar chart
   - Break down by device, source, user type
   - Identify winning segments

## Heatmap Implementation

### Setting Up Heatmap Tracking

1. Add data attributes to trackable elements:
```html
<!-- Hero Section -->
<section data-section="hero">
  <button data-cta="hero-primary">Get Started</button>
  <button data-cta="hero-secondary">Learn More</button>
</section>

<!-- Pricing Section -->
<section data-section="pricing">
  <div data-pricing-tier="starter">...</div>
  <div data-pricing-tier="pro">...</div>
</section>
```

2. Implement scroll tracking:
```typescript
import { scrollTracking } from './analytics/heatmap-tracking-config';

// Track scroll depth
let maxScroll = 0;
const trackScrollDepth = () => {
  const scrollPercentage = (window.scrollY / document.body.scrollHeight) * 100;
  
  scrollTracking.thresholds.forEach(threshold => {
    if (scrollPercentage >= threshold && maxScroll < threshold) {
      trackEvent(`scroll_depth_${threshold}`, {
        page: window.location.pathname,
        time_to_scroll: performance.now()
      });
      maxScroll = threshold;
    }
  });
};

window.addEventListener('scroll', debounce(trackScrollDepth, 100));
```

### Analyzing Heatmap Data

1. Access PostHog Toolbar (press 'p' + 'h' on your site)
2. Enable heatmap view
3. Filter by date range and variants
4. Export heatmap data for deeper analysis

## Automated Reporting

### Setting Up Report Schedules

1. Configure report automation:
```typescript
import { reportTemplates, generateReport } from './analytics/automated-reporting-structure';

// Schedule weekly summary report
const scheduleWeeklyReport = async () => {
  const report = await generateReport(
    'weekly_ab_test_summary',
    'all_tests',
    { from: lastWeek, to: today }
  );
  
  // Send via configured channels
  await sendReport(report);
};
```

2. Create report webhooks in PostHog:
   - Go to Project Settings → Webhooks
   - Add webhook for report generation
   - Configure to trigger on schedule

### Report Templates

1. **Weekly Summary** - Overview of all active tests
2. **Test Completion** - Detailed analysis when test ends
3. **Daily Monitoring** - Health checks and anomalies

## Alert Configuration

### Setting Up Alerts

1. Configure alerts in PostHog:
```typescript
import { alertConfigs, createPostHogAlert } from './analytics/alert-configurations';

// Create test winner alert
const winnerAlert = createPostHogAlert(
  alertConfigs.find(a => a.id === 'test_winner_detected')
);
```

2. Set up notification channels:
   - Email: Configure SMTP settings
   - Slack: Add Slack integration
   - Webhooks: Configure endpoint URLs

### Critical Alerts to Configure

1. **Sample Ratio Mismatch** - Detect randomization issues
2. **Performance Degradation** - Monitor variant performance
3. **Test Winner** - Notify when significance reached
4. **Low Sample Collection** - Track test health

## Best Practices

### 1. Data Quality

- Validate event tracking implementation
- Use consistent naming conventions
- Include relevant properties with events
- Implement data validation

### 2. Statistical Rigor

- Don't peek at results early
- Wait for minimum sample size
- Consider multiple testing corrections
- Document decision criteria upfront

### 3. Performance Optimization

- Use sampling for high-traffic pages
- Batch event submissions
- Implement client-side caching
- Monitor analytics impact on performance

### 4. Privacy and Compliance

- Implement consent management
- Anonymize PII data
- Follow GDPR/CCPA guidelines
- Document data retention policies

### 5. Continuous Improvement

- Review alert effectiveness weekly
- Tune thresholds based on false positives
- Update report templates based on feedback
- Conduct quarterly analytics audits

## Troubleshooting

### Common Issues

1. **Events not tracking**
   - Check PostHog initialization
   - Verify event names match configuration
   - Check browser console for errors

2. **Funnel drop-offs incorrect**
   - Verify event order
   - Check conversion window settings
   - Ensure user identification is consistent

3. **Heatmaps not showing**
   - Confirm toolbar is loaded
   - Check selector specificity
   - Verify sufficient data collected

4. **Alerts not firing**
   - Test webhook endpoints
   - Verify threshold configuration
   - Check alert cooldown settings

## Next Steps

1. Complete PostHog setup and verify tracking
2. Create funnels for each key user journey
3. Set up dashboards for active A/B tests
4. Configure critical alerts
5. Schedule automated reports
6. Train team on interpretation guidelines
7. Establish review cadence for results

Remember to regularly review and update your analytics setup as your product and testing needs evolve.