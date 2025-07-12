# PostHog KPI Dashboard - Quick Setup Guide

## 🚀 5-Minute Setup Checklist

### Step 1: Import Dashboard Templates
1. Go to PostHog dashboard: [https://app.posthog.com](https://app.posthog.com)
2. Navigate to **Insights** → **Dashboards**
3. Click **"New Dashboard"**
4. Copy configurations from `POSTHOG_DASHBOARD_QUERIES.json`

### Step 2: Create Essential Business Metrics (Priority 1)

#### Monthly Revenue Trend
- **Event**: `purchase_completed`
- **Filter**: `purchase_amount_cents > 0`
- **Math**: Sum of `purchase_amount_cents`
- **Time range**: Last 30 days
- **Breakdown**: By `utm_source`

#### Conversion Funnel
- **Events sequence**:
  1. `landing_page_view` → "Landing Page Visit"
  2. `sample_term_view` → "Sample Content Viewed"  
  3. `signup_started` → "Signup Started"
  4. `signup_completed` → "Account Created"
  5. `purchase_completed` → "Purchase Completed"
- **Window**: 14 days
- **Time range**: Last 30 days

#### Daily New Signups
- **Event**: `signup_completed`
- **Filter**: `user_type = "new"`
- **Time range**: Last 7 days
- **Breakdown**: By `utm_source`

### Step 3: A/B Testing Dashboard (Priority 2)

#### Landing Page A/B Test Performance
- **Event**: `signup_completed`
- **Filter**: `experiment_variant` is set
- **Breakdown**: By `$feature/landingPageVariant`
- **Time range**: Last 14 days

#### CTA Performance Comparison
- **Event**: `cta_click`
- **Filter**: `cta_location = "hero"`
- **Breakdown**: By `cta_variant`
- **Time range**: Last 14 days

### Step 4: Product Analytics (Priority 3)

#### Sample Terms Engagement
- **Event**: `sample_term_view`
- **Filter**: `$current_url` contains "/sample/"
- **Breakdown**: By `term_slug`
- **Display**: Table format
- **Time range**: Last 7 days

#### Device Usage Distribution
- **Event**: `$pageview`
- **Breakdown**: By `$device_type`
- **Display**: Pie chart
- **Time range**: Last 7 days

## 📊 Quick Dashboard URLs

Once created, bookmark these dashboard URLs:

- **Executive Summary**: `/insights/dashboards/[business-kpis-id]`
- **A/B Testing**: `/insights/dashboards/[ab-testing-id]`
- **Product Analytics**: `/insights/dashboards/[product-analytics-id]`
- **Marketing Attribution**: `/insights/dashboards/[marketing-id]`

## 🔧 Event Tracking Verification

### Test These Events Are Firing:
```bash
# Check in PostHog Events tab:
1. signup_completed
2. purchase_completed  
3. sample_term_view
4. landing_page_view
5. cta_click
```

### Missing Events? Add to Frontend:
```javascript
// In your React components:
posthog.capture('sample_term_view', {
  term_slug: 'neural-network',
  term_category: 'deep-learning',
  user_type: 'guest'
});

posthog.capture('cta_click', {
  cta_text: 'Explore Free Samples',
  cta_location: 'hero',
  experiment_variant: 'marketing_sample'
});
```

## ⚠️ Common Setup Issues

### Issue 1: No Data Showing
- **Solution**: Verify events are firing in PostHog Live Events
- **Check**: Event names match exactly (case sensitive)

### Issue 2: Experiment Data Missing  
- **Solution**: Ensure feature flags are properly set
- **Check**: `$feature/landingPageVariant` property exists

### Issue 3: Revenue Not Tracking
- **Solution**: Verify `purchase_amount_cents` is sent as number
- **Check**: Gumroad webhook is sending purchase events

## 🎯 Success Validation

### Week 1 Targets:
- [ ] All 5 business KPI tiles showing data
- [ ] A/B test variants have >100 users each
- [ ] Sample terms showing engagement data
- [ ] Revenue tracking working

### Week 2 Targets:
- [ ] Conversion funnel shows clear drop-off points
- [ ] Marketing attribution working
- [ ] Retention cohorts populated
- [ ] Alerts configured for critical metrics

## 📧 Setup Completion Email

```
Subject: PostHog KPI Dashboards Ready ✅

Team,

Your AI Glossary Pro analytics dashboards are now live:

📊 Business Overview: [Dashboard URL]
🧪 A/B Testing: [Dashboard URL]  
📱 Product Analytics: [Dashboard URL]
📈 Marketing Attribution: [Dashboard URL]

Key metrics now tracked:
✅ Revenue and conversion rates
✅ A/B test performance 
✅ Sample terms engagement
✅ User retention cohorts

Next steps:
1. Bookmark dashboard URLs
2. Set up weekly review meeting
3. Configure alerts for critical drops
4. Train team on reading the data

Questions? Reply to this email.

Analytics Team
```

---

**Total Setup Time**: 2-3 hours
**Data Population**: 24-48 hours  
**First Review**: 1 week after setup