# PostHog KPI Dashboard Configuration

## 🎯 Overview
Comprehensive KPI dashboard setup for AI Glossary Pro to track key business metrics, user behavior, A/B test performance, and conversion funnel optimization.

## 📊 Dashboard Structure

### Dashboard 1: Business Overview (Executive)
**Purpose**: High-level business metrics for leadership and stakeholders

#### Tile 1: Revenue & Conversion
- **Metric**: Revenue (Monthly)
- **Event**: Purchase completed
- **Filter**: event properties where `purchase_amount > 0`
- **Visualization**: Line chart (30 days)
- **Breakdown**: By utm_source
- **Goal**: Track monthly recurring revenue trends

#### Tile 2: New User Acquisition
- **Metric**: New Users (Daily)
- **Event**: User signed up
- **Filter**: event properties where `user_type = 'new'`
- **Visualization**: Line chart (7 days)
- **Breakdown**: By traffic source
- **Goal**: Monitor daily acquisition rates

#### Tile 3: Conversion Funnel
- **Metric**: Funnel conversion rate
- **Events**: 
  1. Page view (`landing_page_view`)
  2. Sample content viewed (`sample_term_view`)
  3. Sign up started (`signup_started`)
  4. Sign up completed (`signup_completed`)
  5. Purchase completed (`purchase_completed`)
- **Visualization**: Funnel chart
- **Time period**: Last 30 days
- **Goal**: Identify conversion bottlenecks

#### Tile 4: Monthly Active Users (MAU)
- **Metric**: Unique users
- **Event**: Any event
- **Filter**: user properties where `last_seen > -30d`
- **Visualization**: Single value with trend
- **Time period**: Last 30 days vs previous 30 days
- **Goal**: Track user engagement and retention

#### Tile 5: Customer Lifetime Value (CLV)
- **Metric**: Average revenue per user
- **Event**: Purchase completed
- **Formula**: Total revenue / Total unique purchasers
- **Visualization**: Single value with trend
- **Time period**: All time
- **Goal**: Track customer value optimization

### Dashboard 2: Product & User Experience
**Purpose**: Product performance and user behavior insights

#### Tile 6: Sample Terms Performance
- **Metric**: Sample term engagement rate
- **Event**: Sample term viewed
- **Filter**: event properties where `page_path LIKE '/sample/%'`
- **Visualization**: Bar chart
- **Breakdown**: By term slug
- **Goal**: Identify most engaging sample content

#### Tile 7: Search Behavior
- **Metric**: Search usage and success rate
- **Events**: 
  - Search performed (`search_query`)
  - Search result clicked (`search_result_click`)
- **Formula**: Click rate = Clicks / Searches * 100
- **Visualization**: Line chart with dual axis
- **Time period**: Last 14 days
- **Goal**: Optimize search functionality

#### Tile 8: Content Depth Engagement
- **Metric**: Average session duration
- **Event**: Page view
- **Filter**: session properties where `page_count > 1`
- **Visualization**: Histogram
- **Breakdown**: By user type (free vs premium)
- **Goal**: Measure content quality and engagement

#### Tile 9: Mobile vs Desktop Usage
- **Metric**: User sessions by device type
- **Event**: Session start
- **Breakdown**: By device type (mobile, desktop, tablet)
- **Visualization**: Pie chart
- **Time period**: Last 7 days
- **Goal**: Optimize for primary user devices

#### Tile 10: Feature Adoption
- **Metric**: Feature usage rates
- **Events**: Multiple feature-specific events
  - Favorites added (`favorite_added`)
  - Progress tracked (`progress_marked`)
  - Share clicked (`share_clicked`)
- **Visualization**: Stacked bar chart
- **Time period**: Last 30 days
- **Goal**: Track feature adoption and usage

### Dashboard 3: A/B Testing & Experiments
**Purpose**: Monitor experiment performance and statistical significance

#### Tile 11: Landing Page A/B Test
- **Metric**: Conversion rate by variant
- **Event**: Signup completed
- **Filter**: experiment properties where `experiment = 'landingPageVariant'`
- **Breakdown**: By variant (control vs marketing_sample)
- **Visualization**: Bar chart with confidence intervals
- **Goal**: Measure landing page optimization impact

#### Tile 12: CTA Performance
- **Metric**: Click-through rate by CTA variant
- **Event**: CTA clicked
- **Filter**: experiment properties where `experiment = 'landingPageCTA'`
- **Breakdown**: By CTA variant (control, sample, explore)
- **Visualization**: Line chart with trend
- **Goal**: Optimize call-to-action effectiveness

#### Tile 13: Experiment Sample Sizes
- **Metric**: User count by experiment variant
- **Event**: Experiment exposure
- **Breakdown**: By experiment and variant
- **Visualization**: Table
- **Goal**: Ensure adequate sample sizes for statistical significance

#### Tile 14: Revenue Impact by Experiment
- **Metric**: Revenue per user by experiment variant
- **Event**: Purchase completed
- **Filter**: user properties where `experiment_variant IS NOT NULL`
- **Breakdown**: By experiment variant
- **Visualization**: Bar chart
- **Goal**: Measure direct revenue impact of experiments

### Dashboard 4: Marketing & Acquisition
**Purpose**: Track marketing channel performance and user acquisition

#### Tile 15: Traffic Sources
- **Metric**: Sessions by traffic source
- **Event**: Session start
- **Breakdown**: By utm_source
- **Visualization**: Pie chart
- **Time period**: Last 30 days
- **Goal**: Identify most effective marketing channels

#### Tile 16: Campaign Performance
- **Metric**: Conversion rate by campaign
- **Events**: 
  - Campaign visit (`page_view` with UTM)
  - Conversion (`signup_completed`)
- **Filter**: utm_campaign IS NOT NULL
- **Breakdown**: By utm_campaign
- **Visualization**: Table with conversion rate
- **Goal**: Optimize marketing campaign effectiveness

#### Tile 17: Referral Program Performance
- **Metric**: Referral conversion and revenue
- **Events**: 
  - Referral click (`referral_click`)
  - Referral signup (`signup_completed` with referrer)
  - Referral purchase (`purchase_completed` with referrer)
- **Visualization**: Funnel chart
- **Goal**: Track referral program effectiveness

#### Tile 18: SEO Performance
- **Metric**: Organic search traffic and conversions
- **Event**: Page view
- **Filter**: utm_source = 'google' AND utm_medium = 'organic'
- **Breakdown**: By landing page
- **Visualization**: Bar chart
- **Goal**: Track SEO optimization impact

### Dashboard 5: Retention & Engagement
**Purpose**: Monitor user retention and long-term engagement

#### Tile 19: User Retention Cohorts
- **Metric**: User retention by signup cohort
- **Event**: User activity (any event)
- **Cohort**: By signup week
- **Visualization**: Retention table
- **Time period**: 12 weeks
- **Goal**: Track long-term user engagement

#### Tile 20: Daily/Weekly Active Users
- **Metric**: DAU and WAU trends
- **Event**: Any user activity
- **Visualization**: Line chart with dual axis
- **Time period**: Last 90 days
- **Goal**: Monitor engagement consistency

#### Tile 21: Churn Analysis
- **Metric**: Users who haven't returned
- **Event**: Last activity date
- **Filter**: user properties where `last_seen < -14d`
- **Visualization**: Line chart
- **Goal**: Identify and reduce user churn

#### Tile 22: Premium User Engagement
- **Metric**: Premium feature usage
- **Event**: Premium feature used
- **Filter**: user properties where `subscription_tier = 'premium'`
- **Breakdown**: By feature type
- **Visualization**: Stacked area chart
- **Goal**: Validate premium value proposition

## 🛠️ PostHog Configuration Scripts

### Custom Events Setup
```javascript
// Sample term engagement tracking
posthog.capture('sample_term_view', {
  term_slug: termSlug,
  term_category: termCategory,
  user_type: userType,
  source: 'sample_page'
});

// Conversion funnel tracking
posthog.capture('signup_started', {
  source: landingPageVariant,
  experiment_variant: experimentVariant
});

// Feature usage tracking
posthog.capture('feature_used', {
  feature_name: featureName,
  user_tier: userTier,
  session_duration: sessionDuration
});
```

### Custom Properties
```javascript
// User properties
posthog.setPersonProperties({
  subscription_tier: 'free|premium',
  signup_date: new Date().toISOString(),
  experiment_groups: experimentGroups,
  referrer_id: referrerId
});

// Session properties
posthog.capture('session_start', {
  device_type: getDeviceType(),
  utm_source: getUtmSource(),
  landing_page: window.location.pathname
});
```

### Cohort Definitions
```javascript
// Power Users Cohort
// Users who have viewed 10+ terms in last 30 days
{
  "name": "Power Users",
  "filters": [
    {
      "event": "term_view",
      "timeframe": "last_30_days",
      "count": "gte_10"
    }
  ]
}

// Experiment Participants
// Users in current A/B tests
{
  "name": "A/B Test Participants",
  "filters": [
    {
      "property": "experiment_variant",
      "operator": "is_set"
    }
  ]
}
```

## 📈 Goals & Targets

### Business Metrics Targets
- **Monthly Revenue Growth**: 15% MoM
- **Conversion Rate**: 2.5% (landing to purchase)
- **Customer Acquisition Cost**: <$50
- **Customer Lifetime Value**: >$300
- **Monthly Active Users**: 10% growth MoM

### Product Metrics Targets
- **Sample Term Engagement**: 60% of visitors view 2+ terms
- **Search Success Rate**: 85% of searches result in clicks
- **Feature Adoption**: 40% of users use 2+ features
- **Mobile Experience**: <3s page load time
- **User Satisfaction**: 4.5+ average rating

### Retention Targets
- **1-Week Retention**: 35%
- **4-Week Retention**: 20%
- **12-Week Retention**: 15%
- **Churn Rate**: <5% monthly
- **Premium Retention**: 90% annual

## 🚨 Alerts & Monitoring

### Critical Alerts (Immediate notification)
1. **Revenue Drop**: Daily revenue <80% of 7-day average
2. **Conversion Rate Drop**: Signup rate <70% of baseline
3. **Site Down**: Error rate >5% for 5+ minutes
4. **Experiment Issues**: Sample size imbalance >20%

### Warning Alerts (Daily digest)
1. **Traffic Drop**: Daily visitors <85% of 7-day average
2. **Engagement Drop**: Session duration <90% of baseline
3. **Feature Issues**: Feature usage <80% of baseline
4. **Mobile Issues**: Mobile conversion <85% of desktop

### Weekly Review Alerts
1. **Cohort Performance**: Retention rate changes >10%
2. **Marketing Performance**: Channel ROI changes >15%
3. **Product Performance**: Feature adoption changes >20%
4. **Customer Feedback**: NPS score changes >0.5 points

## 🔧 Implementation Timeline

### Week 1: Basic Business Metrics
- [ ] Set up revenue and conversion tracking
- [ ] Configure user acquisition metrics
- [ ] Create basic funnel analysis
- [ ] Implement MAU/DAU tracking

### Week 2: Product Analytics
- [ ] Add sample terms performance tracking
- [ ] Set up search behavior analytics
- [ ] Configure feature adoption metrics
- [ ] Implement mobile vs desktop analysis

### Week 3: A/B Testing Infrastructure
- [ ] Create experiment tracking dashboards
- [ ] Set up statistical significance monitoring
- [ ] Configure variant performance comparison
- [ ] Implement experiment sample size tracking

### Week 4: Advanced Analytics
- [ ] Set up cohort retention analysis
- [ ] Configure marketing attribution
- [ ] Implement referral program tracking
- [ ] Create SEO performance monitoring

### Week 5: Alerts & Automation
- [ ] Configure critical business alerts
- [ ] Set up warning notifications
- [ ] Create weekly review automations
- [ ] Test all alert systems

## 📋 PostHog Dashboard Import/Export

### Dashboard JSON Export
```json
{
  "name": "AI Glossary Pro - Business Overview",
  "tiles": [
    {
      "type": "insight",
      "insight": {
        "name": "Monthly Revenue",
        "filters": {
          "events": [{"id": "purchase_completed"}],
          "properties": [{"key": "purchase_amount", "operator": "gt", "value": 0}]
        }
      }
    }
  ]
}
```

### Access & Permissions
- **Admin Access**: Full dashboard management
- **Team Access**: View all dashboards, edit product dashboards
- **Stakeholder Access**: View business overview dashboard only
- **Customer Success**: View retention and engagement dashboards

---

**Setup Completion Target**: 5 business days
**First Review**: 1 week after setup
**Monthly Review**: First Monday of each month