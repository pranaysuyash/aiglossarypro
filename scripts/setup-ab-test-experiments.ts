#!/usr/bin/env tsx
/**
 * Script to set up A/B test experiments in PostHog
 * Run with: npm run setup:ab-tests
 */

import { config } from 'dotenv';

config();

// PostHog experiment configurations
const experiments = [
  {
    key: 'exitIntentVariant',
    name: 'Exit Intent Popup - Message Testing',
    description: 'Test different messaging strategies for exit intent popups',
    variants: [
      { key: 'control', name: 'Basic Offer', rollout_percentage: 25 },
      { key: 'value_focused', name: 'Feature Benefits', rollout_percentage: 25 },
      { key: 'urgency', name: 'Time Limited', rollout_percentage: 25 },
      { key: 'social_proof', name: 'Community Focus', rollout_percentage: 25 },
    ],
    metrics: [
      'exit_intent_conversion',
      'exit_intent_cta_clicked',
      'signup_completed',
      'upgrade_completed',
    ],
  },
  {
    key: 'trustBadgeStyle',
    name: 'Trust Badges - Visual Style',
    description: 'Test different visual presentations of trust badges',
    variants: [
      { key: 'minimal', name: 'Minimal Style', rollout_percentage: 33 },
      { key: 'detailed', name: 'Detailed Info', rollout_percentage: 33 },
      { key: 'animated', name: 'Interactive', rollout_percentage: 34 },
    ],
    metrics: ['trust_badge_clicked', 'time_on_page', 'bounce_rate', 'conversion_rate'],
  },
  {
    key: 'trustBadgePlacement',
    name: 'Trust Badges - Placement',
    description: 'Test inline vs floating trust badge placement',
    variants: [
      { key: 'inline', name: 'Inline in Content', rollout_percentage: 50 },
      { key: 'floating', name: 'Floating Widget', rollout_percentage: 50 },
    ],
    metrics: ['trust_badge_clicked', 'scroll_depth', 'engagement_rate'],
  },
  {
    key: 'floatingPricingVariant',
    name: 'Floating Pricing Widget - Messaging',
    description: 'Test different pricing widget messaging strategies',
    variants: [
      { key: 'control', name: 'Standard', rollout_percentage: 25 },
      { key: 'discount_focused', name: 'Discount Heavy', rollout_percentage: 25 },
      { key: 'urgency', name: 'Time Pressure', rollout_percentage: 25 },
      { key: 'value', name: 'Value Focused', rollout_percentage: 25 },
    ],
    metrics: [
      'floating_pricing_clicked',
      'floating_pricing_dismissed',
      'pricing_page_visited',
      'purchase_completed',
    ],
  },
  {
    key: 'mediaLogosStyle',
    name: 'Media Logos - Display Style',
    description: 'Test different ways to display media/trust logos',
    variants: [
      { key: 'control', name: 'Static', rollout_percentage: 25 },
      { key: 'animated', name: 'Animated', rollout_percentage: 25 },
      { key: 'carousel', name: 'Auto-scroll', rollout_percentage: 25 },
      { key: 'grid', name: 'Grid Layout', rollout_percentage: 25 },
    ],
    metrics: ['media_logo_clicked', 'section_engagement', 'trust_perception_score'],
  },
  {
    key: 'mediaLogosPhrase',
    name: 'Media Logos - Headline Copy',
    description: 'Test different headlines for media logos section',
    variants: [
      { key: 'control', name: 'As Featured In', rollout_percentage: 25 },
      { key: 'authority', name: 'Industry Leaders', rollout_percentage: 25 },
      { key: 'social_proof', name: 'Join 10K+ Users', rollout_percentage: 25 },
      { key: 'credibility', name: 'Recommended By', rollout_percentage: 25 },
    ],
    metrics: ['section_viewed', 'scroll_past_rate', 'conversion_influence'],
  },
  {
    key: 'mediaLogosPlacement',
    name: 'Media Logos - Page Placement',
    description: 'Test optimal placement for media logos on landing page',
    variants: [
      { key: 'above_fold', name: 'Above Fold', rollout_percentage: 25 },
      { key: 'below_fold', name: 'Below Fold', rollout_percentage: 25 },
      { key: 'in_features', name: 'In Features', rollout_percentage: 25 },
      { key: 'near_cta', name: 'Near CTA', rollout_percentage: 25 },
    ],
    metrics: ['visibility_rate', 'interaction_rate', 'conversion_attribution'],
  },
];

// Conversion goals for each experiment
const conversionGoals = {
  primary: [
    {
      name: 'Signup Conversion',
      event: 'signup_completed',
      description: 'User completes registration',
    },
    {
      name: 'Upgrade Conversion',
      event: 'upgrade_completed',
      description: 'User upgrades to paid plan',
    },
    {
      name: 'Trial Start',
      event: 'trial_started',
      description: 'User starts free trial',
    },
  ],
  secondary: [
    {
      name: 'Pricing Page Visit',
      event: 'pricing_page_viewed',
      description: 'User visits pricing page',
    },
    {
      name: 'Feature Engagement',
      event: 'feature_explored',
      description: 'User interacts with key features',
    },
    {
      name: 'Content Engagement',
      event: 'content_engaged',
      description: 'User engages with content',
    },
  ],
};

// Sample tracking implementation
function generateTrackingCode(experiment: any) {
  return `
// ${experiment.name}
const { variant, trackConversion } = useExperiment('${experiment.key}', '${experiment.variants[0].key}');

// Track exposure
useEffect(() => {
  posthog.capture('experiment_exposure', {
    experiment: '${experiment.key}',
    variant: variant,
    timestamp: new Date().toISOString()
  });
}, [variant]);

// Track conversion
const handleConversion = () => {
  trackConversion('primary_action');
  posthog.capture('${experiment.key}_conversion', {
    variant: variant,
    conversion_type: 'primary',
    timestamp: new Date().toISOString()
  });
};
`;
}

// Output experiment setup instructions
console.log('🧪 A/B Test Experiment Setup Guide\n');
console.log('='.repeat(50));

experiments.forEach((experiment, index) => {
  console.log(`\n${index + 1}. ${experiment.name}`);
  console.log(`   Key: ${experiment.key}`);
  console.log(`   Description: ${experiment.description}`);
  console.log('\n   Variants:');
  experiment.variants.forEach(variant => {
    console.log(`   - ${variant.name} (${variant.key}): ${variant.rollout_percentage}%`);
  });
  console.log('\n   Key Metrics:');
  experiment.metrics.forEach(metric => {
    console.log(`   - ${metric}`);
  });
  console.log('\n   Sample Tracking Code:');
  console.log(generateTrackingCode(experiment));
});

console.log('\n' + '='.repeat(50));
console.log('\n📊 Conversion Goals\n');

console.log('Primary Goals:');
conversionGoals.primary.forEach(goal => {
  console.log(`- ${goal.name}: ${goal.event}`);
  console.log(`  ${goal.description}`);
});

console.log('\nSecondary Goals:');
conversionGoals.secondary.forEach(goal => {
  console.log(`- ${goal.name}: ${goal.event}`);
  console.log(`  ${goal.description}`);
});

console.log('\n' + '='.repeat(50));
console.log('\n🚀 Implementation Steps:\n');
console.log('1. Create feature flags in PostHog dashboard');
console.log('2. Set up experiments with variants and rollout percentages');
console.log('3. Define success metrics and conversion events');
console.log('4. Implement tracking in components using useExperiment hook');
console.log('5. Monitor results and iterate based on data');

console.log('\n✅ Next Steps:');
console.log('- Review experiment configurations');
console.log('- Set up PostHog feature flags');
console.log('- Deploy to staging for testing');
console.log('- Launch experiments in production');
console.log('- Monitor performance and conversions');
