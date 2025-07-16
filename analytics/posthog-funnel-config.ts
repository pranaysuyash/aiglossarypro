/**
 * PostHog Funnel Configuration for AI Glossary Pro A/B Tests
 *
 * This configuration defines all conversion funnels needed for tracking
 * A/B test performance and user journey optimization.
 */

export interface FunnelStep {
  id: string;
  name: string;
  event: string;
  properties?: Record<string, any>;
}

export interface FunnelConfig {
  id: string;
  name: string;
  description: string;
  steps: FunnelStep[];
  conversionWindow?: number; // in hours
  exclusions?: string[]; // events that exclude users from funnel
}

// Main conversion funnels for A/B testing
export const funnels: FunnelConfig[] = [
  {
    id: 'landing_to_purchase',
    name: 'Landing Page to Purchase',
    description: 'Complete funnel from landing page visit to successful purchase',
    conversionWindow: 168, // 7 days
    steps: [
      {
        id: 'landing_view',
        name: 'View Landing Page',
        event: 'pageview',
        properties: {
          pathname: '/',
        },
      },
      {
        id: 'cta_click',
        name: 'Click CTA',
        event: 'cta_clicked',
        properties: {
          cta_location: ['hero', 'pricing', 'features', 'testimonials'],
        },
      },
      {
        id: 'pricing_view',
        name: 'View Pricing',
        event: 'pageview',
        properties: {
          pathname: '/pricing',
        },
      },
      {
        id: 'checkout_start',
        name: 'Start Checkout',
        event: 'checkout_started',
      },
      {
        id: 'purchase_complete',
        name: 'Complete Purchase',
        event: 'purchase_completed',
      },
    ],
  },
  {
    id: 'free_trial_conversion',
    name: 'Free Trial to Paid Conversion',
    description: 'Track users converting from free trial to paid subscription',
    conversionWindow: 336, // 14 days
    steps: [
      {
        id: 'trial_start',
        name: 'Start Free Trial',
        event: 'trial_started',
      },
      {
        id: 'feature_usage',
        name: 'Use Premium Feature',
        event: 'premium_feature_used',
      },
      {
        id: 'upgrade_prompt',
        name: 'View Upgrade Prompt',
        event: 'upgrade_prompt_viewed',
      },
      {
        id: 'trial_conversion',
        name: 'Convert to Paid',
        event: 'purchase_completed',
        properties: {
          conversion_type: 'trial_to_paid',
        },
      },
    ],
  },
  {
    id: 'onboarding_completion',
    name: 'User Onboarding Completion',
    description: 'Track completion rate of onboarding flow',
    conversionWindow: 24, // 1 day
    steps: [
      {
        id: 'onboarding_start',
        name: 'Start Onboarding',
        event: 'onboarding_started',
      },
      {
        id: 'profile_complete',
        name: 'Complete Profile',
        event: 'profile_completed',
      },
      {
        id: 'first_search',
        name: 'First Term Search',
        event: 'term_searched',
        properties: {
          is_first_search: true,
        },
      },
      {
        id: 'onboarding_finish',
        name: 'Finish Onboarding',
        event: 'onboarding_completed',
      },
    ],
  },
  {
    id: 'feature_engagement',
    name: 'Feature Engagement Funnel',
    description: 'Track engagement with key features',
    conversionWindow: 72, // 3 days
    steps: [
      {
        id: 'login',
        name: 'User Login',
        event: 'user_logged_in',
      },
      {
        id: 'search_term',
        name: 'Search for Term',
        event: 'term_searched',
      },
      {
        id: 'view_visualization',
        name: 'View 3D Visualization',
        event: 'visualization_viewed',
      },
      {
        id: 'save_term',
        name: 'Save Term',
        event: 'term_saved',
      },
    ],
  },
];

// Conversion events for each A/B test variant
export const conversionEvents = {
  // Hero Section A/B Test
  hero_engagement: {
    primary: 'cta_clicked',
    secondary: ['video_played', 'scroll_past_hero'],
    properties: {
      cta_location: 'hero',
      variant: ['control', 'variant_a', 'variant_b'],
    },
  },

  // Pricing Page A/B Test
  pricing_conversion: {
    primary: 'checkout_started',
    secondary: ['pricing_tier_selected', 'faq_expanded'],
    properties: {
      pricing_layout: ['standard', 'comparison_table', 'feature_focused'],
    },
  },

  // Onboarding Flow A/B Test
  onboarding_success: {
    primary: 'onboarding_completed',
    secondary: ['step_completed', 'help_requested'],
    properties: {
      flow_type: ['guided', 'self_serve', 'video_tutorial'],
    },
  },

  // Social Proof A/B Test
  social_proof_impact: {
    primary: 'purchase_completed',
    secondary: ['testimonial_viewed', 'case_study_clicked'],
    properties: {
      social_proof_type: ['testimonials', 'logos', 'statistics', 'combined'],
    },
  },
};

// Funnel drop-off analysis configuration
export const dropOffAnalysis = {
  // Calculate drop-off rates between each step
  calculateDropOff: true,

  // Minimum sample size for statistical significance
  minSampleSize: 100,

  // Confidence level for statistical tests
  confidenceLevel: 0.95,

  // Alert thresholds for significant drop-offs
  alertThresholds: {
    critical: 0.7, // 70% drop-off
    warning: 0.5, // 50% drop-off
    info: 0.3, // 30% drop-off
  },
};

// Custom funnel filters
export const funnelFilters = {
  // User segments
  segments: ['new_users', 'returning_users', 'trial_users', 'paid_users'],

  // Traffic sources
  sources: ['organic', 'paid_search', 'social', 'direct', 'referral'],

  // Device types
  devices: ['desktop', 'mobile', 'tablet'],

  // Geographic regions
  regions: ['north_america', 'europe', 'asia_pacific', 'other'],
};

// Export configuration for PostHog
export const posthogFunnelConfig = {
  funnels,
  conversionEvents,
  dropOffAnalysis,
  funnelFilters,

  // Helper function to create PostHog funnel
  createPostHogFunnel: (funnelId: string) => {
    const funnel = funnels.find(f => f.id === funnelId);
    if (!funnel) throw new Error(`Funnel ${funnelId} not found`);

    return {
      name: funnel.name,
      steps: funnel.steps.map(step => ({
        id: step.event,
        name: step.name,
        properties: step.properties,
      })),
      conversion_window_limit: funnel.conversionWindow,
      conversion_window_unit: 'hour',
    };
  },
};
