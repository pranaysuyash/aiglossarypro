# A/B Test Components Documentation

## Overview

This document describes the four new A/B test components implemented for AI Glossary Pro to optimize conversion rates and user engagement.

## Components

### 1. Exit Intent Popup

**Purpose**: Capture users who are about to leave the site with targeted offers.

**Location**: `/client/src/components/ab-tests/ExitIntentPopup.tsx`

**Variants**:
- `control`: Basic offer with 20% discount
- `value_focused`: Emphasizes features and benefits
- `urgency`: Time-limited offer with countdown timer
- `social_proof`: Highlights user base and testimonials

**Key Features**:
- Triggers when mouse leaves viewport from top
- Only shows once per session
- Mobile-responsive (disabled on mobile)
- Tracks conversion metrics

**PostHog Events**:
- `exit_intent_popup_shown`
- `exit_intent_popup_closed`
- `exit_intent_cta_clicked`
- `exit_intent_conversion`

### 2. Trust Badges

**Purpose**: Build credibility and trust with security/quality indicators.

**Location**: `/client/src/components/ab-tests/TrustBadges.tsx`

**Style Variants**:
- `minimal`: Shows 3 core badges
- `detailed`: Shows all badges with descriptions
- `animated`: Hover animations and effects

**Placement Variants**:
- `inline`: Embedded in page flow
- `floating`: Sticky sidebar widget

**Key Features**:
- 6 different trust indicators (SSL, Privacy, Ratings, etc.)
- Responsive grid layout
- Click tracking for each badge

**PostHog Events**:
- `trust_badges_viewed`
- `trust_badge_clicked`

### 3. Floating Pricing Widget

**Purpose**: Keep pricing visible and accessible while users browse.

**Location**: `/client/src/components/ab-tests/FloatingPricingWidget.tsx`

**Variants**:
- `control`: Basic upgrade prompt
- `discount_focused`: Highlights savings
- `urgency`: Countdown timer with limited offer
- `value`: Emphasizes most popular choice

**Key Features**:
- Appears after 20% scroll or 10 seconds
- Expandable to show features
- Dismissible with memory
- Countdown timer for urgency variant

**PostHog Events**:
- `floating_pricing_shown`
- `floating_pricing_dismissed`
- `floating_pricing_cta_clicked`
- `floating_pricing_clicked`

### 4. Media Logos

**Purpose**: Social proof through media mentions and industry credibility.

**Location**: `/client/src/components/ab-tests/MediaLogos.tsx`

**Style Variants**:
- `control`: Static logo display
- `animated`: Fade-in animations
- `carousel`: Auto-scrolling logos
- `grid`: Card-based layout

**Phrase Variants**:
- `control`: "As Featured In"
- `authority`: "Trusted By Industry Leaders"
- `social_proof`: "Join 10,000+ Professionals Using"
- `credibility`: "Recommended By Top Publications"

**Placement Variants**:
- `above_fold`: Right after hero section
- `below_fold`: After social proof
- `in_features`: Within feature sections
- `near_cta`: Close to pricing

**PostHog Events**:
- `media_logos_viewed`
- `media_logo_clicked`

## Integration

All components are integrated into the landing page at `/client/src/pages/LandingPage.tsx`:

```tsx
import { ExitIntentPopup, TrustBadges, FloatingPricingWidget, MediaLogos } from '@/components/ab-tests';

// In component:
<ExitIntentPopup />
<FloatingPricingWidget />
<MediaLogos placement="above_fold" />
<TrustBadges placement="inline" variant="minimal" />
```

## PostHog Configuration

The experiment flags are defined in `/client/src/services/posthogExperiments.ts`:

```typescript
exitIntentVariant: 'control' | 'value_focused' | 'urgency' | 'social_proof';
trustBadgeStyle: 'minimal' | 'detailed' | 'animated';
trustBadgePlacement: 'inline' | 'floating';
floatingPricingVariant: 'control' | 'discount_focused' | 'urgency' | 'value';
mediaLogosStyle: 'control' | 'animated' | 'carousel' | 'grid';
mediaLogosPhrase: 'control' | 'authority' | 'social_proof' | 'credibility';
mediaLogosPlacement: 'above_fold' | 'below_fold' | 'in_features' | 'near_cta';
```

## Setting Up Experiments in PostHog

1. **Create Feature Flags**:
   - Log into PostHog dashboard
   - Navigate to Feature Flags
   - Create flags for each experiment variant
   - Set rollout percentages for each variant

2. **Define Success Metrics**:
   - Primary: Conversion rate (signups, upgrades)
   - Secondary: Engagement (clicks, time on page)
   - Custom: Component-specific interactions

3. **Experiment Configuration Example**:
   ```json
   {
     "key": "exitIntentVariant",
     "name": "Exit Intent Popup Experiment",
     "variants": [
       { "key": "control", "rollout": 25 },
       { "key": "value_focused", "rollout": 25 },
       { "key": "urgency", "rollout": 25 },
       { "key": "social_proof", "rollout": 25 }
     ]
   }
   ```

4. **Track Conversions**:
   - Monitor `experiment_conversion` events
   - Filter by `flag_key` and `variant`
   - Compare conversion rates across variants

## Best Practices

1. **Testing Duration**:
   - Run experiments for at least 2 weeks
   - Ensure statistical significance before decisions
   - Account for day-of-week variations

2. **Variant Distribution**:
   - Start with equal distribution
   - Use multi-armed bandit for optimization
   - Consider user segmentation

3. **Performance Monitoring**:
   - Watch for negative impacts on page load
   - Monitor bounce rates
   - Check mobile performance

4. **Iteration**:
   - Test one major change at a time
   - Document learnings
   - Build on successful variants

## Troubleshooting

**Exit Intent Not Triggering**:
- Check if user is on mobile (disabled)
- Verify 5-second delay has passed
- Ensure popup hasn't been shown in session

**Trust Badges Not Visible**:
- Check placement variant configuration
- Verify scroll position for floating variant
- Confirm PostHog flags are loaded

**Floating Widget Issues**:
- Check scroll threshold (20%)
- Verify dismissal state in session storage
- Ensure timer is running for urgency variant

**Media Logos Animation**:
- Confirm browser supports CSS animations
- Check if styles are properly injected
- Verify carousel variant scroll behavior