import { posthogExperiments } from './posthogExperiments';

/**
 * Active A/B Testing Configuration for Launch
 * 
 * This file configures and activates specific experiments for the launch.
 * Each experiment is designed to optimize different aspects of conversion.
 */

export interface ActiveExperiment {
  name: string;
  description: string;
  flagKey: string;
  variants: Array<{
    name: string;
    weight: number; // Percentage allocation
    description: string;
  }>;
  metrics: string[];
  status: 'active' | 'scheduled' | 'completed';
}

// Active experiments for launch optimization
export const ACTIVE_EXPERIMENTS: ActiveExperiment[] = [
  {
    name: 'Landing Page Headlines',
    description: 'Test different headline messaging to maximize initial engagement',
    flagKey: 'landingPageHeadline',
    status: 'active',
    variants: [
      { name: 'control', weight: 20, description: 'Master AI/ML Concepts in Minutes, Not Months' },
      { name: 'benefit_focused', weight: 20, description: 'The AI/ML Dictionary That Actually Makes Sense' },
      { name: 'problem_solution', weight: 20, description: 'Stop Googling Every AI Term - Get Clear Answers Here' },
      { name: 'social_proof', weight: 20, description: 'Join 10,000+ Developers Learning AI/ML the Smart Way' },
      { name: 'authority', weight: 20, description: 'The Industry-Standard AI/ML Reference Guide' },
    ],
    metrics: ['bounce_rate', 'time_on_page', 'scroll_depth', 'cta_clicks'],
  },
  
  {
    name: 'Exit-Intent Messaging',
    description: 'Optimize exit-intent popup messaging for maximum recovery',
    flagKey: 'exitIntentVariant',
    status: 'active',
    variants: [
      { name: 'control', weight: 25, description: 'Standard discount offer' },
      { name: 'value_focused', weight: 25, description: 'Emphasize features and value' },
      { name: 'urgency', weight: 25, description: 'Time-limited countdown offer' },
      { name: 'social_proof', weight: 25, description: 'Show community and testimonials' },
    ],
    metrics: ['exit_intent_shown', 'exit_intent_conversion', 'revenue_per_visitor'],
  },
  
  {
    name: 'Pricing Display Format',
    description: 'Test different ways to present pricing information',
    flagKey: 'pricingDisplay',
    status: 'active',
    variants: [
      { name: 'control', weight: 20, description: 'Standard pricing table' },
      { name: 'value_focused', weight: 20, description: 'Emphasize savings and value' },
      { name: 'simple', weight: 20, description: 'Simplified two-option display' },
      { name: 'comparison', weight: 20, description: 'Detailed competitor comparison' },
      { name: 'benefit_focused', weight: 20, description: 'Lead with benefits, then price' },
    ],
    metrics: ['pricing_view_time', 'pricing_cta_clicks', 'conversion_rate'],
  },
  
  {
    name: 'Social Proof Placement',
    description: 'Optimize where to show testimonials and trust signals',
    flagKey: 'socialProofPlacement',
    status: 'active',
    variants: [
      { name: 'control', weight: 25, description: 'Current placement' },
      { name: 'above_fold', weight: 25, description: 'Prominent hero section' },
      { name: 'near_cta', weight: 25, description: 'Close to call-to-action buttons' },
      { name: 'in_features', weight: 25, description: 'Integrated with feature list' },
    ],
    metrics: ['trust_signal_views', 'time_to_conversion', 'conversion_rate'],
  },
  
  {
    name: 'CTA Button Copy',
    description: 'Test different call-to-action button text',
    flagKey: 'landingPageCTA',
    status: 'active',
    variants: [
      { name: 'control', weight: 17, description: 'Get Started Free' },
      { name: 'action', weight: 17, description: 'Start Learning Now' },
      { name: 'benefit', weight: 17, description: 'Unlock All Terms' },
      { name: 'urgency', weight: 17, description: 'Claim Your Discount' },
      { name: 'value', weight: 16, description: 'Get Lifetime Access' },
      { name: 'social_proof', weight: 16, description: 'Join 10,000+ Users' },
    ],
    metrics: ['cta_click_rate', 'conversion_rate', 'revenue_per_click'],
  },
];

// Initialize and activate experiments
export async function activateExperiments() {
  try {
    await posthogExperiments.initialize();
    
    // Set experiment context
    posthogExperiments.setExperimentContext({
      launch_phase: getCurrentPhase(),
      device_type: getDeviceType(),
      traffic_source: getTrafficSource(),
      user_segment: getUserSegment(),
    });
    
    console.log('🧪 A/B tests activated:', ACTIVE_EXPERIMENTS.map(e => e.name));
    
    // Track experiment activation
    ACTIVE_EXPERIMENTS.forEach(experiment => {
      if (experiment.status === 'active') {
        posthogExperiments.trackExperimentExposure(
          experiment.flagKey as any,
          'control',
          {
            experiment_name: experiment.name,
            variants_count: experiment.variants.length,
          }
        );
      }
    });
    
  } catch (error) {
    console.error('Failed to activate experiments:', error);
  }
}

// Helper functions
function getCurrentPhase(): string {
  const phase = process.env.NEXT_PUBLIC_PRICING_PHASE || 'early';
  return phase;
}

function getDeviceType(): string {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getTrafficSource(): string {
  const urlParams = new URLSearchParams(window.location.search);
  const utm_source = urlParams.get('utm_source');
  const referrer = document.referrer;
  
  if (utm_source) return utm_source;
  if (!referrer) return 'direct';
  if (referrer.includes('google')) return 'google';
  if (referrer.includes('twitter')) return 'twitter';
  if (referrer.includes('linkedin')) return 'linkedin';
  return 'other';
}

function getUserSegment(): string {
  // Logic to determine user segment based on behavior
  const hasVisitedBefore = localStorage.getItem('returning_visitor') === 'true';
  const viewCount = parseInt(localStorage.getItem('page_views') || '0');
  
  if (!hasVisitedBefore) {
    localStorage.setItem('returning_visitor', 'true');
    return 'new_visitor';
  }
  
  if (viewCount > 5) return 'engaged_visitor';
  return 'returning_visitor';
}

// Export experiment results helper
export function getExperimentResults() {
  const activeVariants: Record<string, string> = {};
  
  ACTIVE_EXPERIMENTS.forEach(experiment => {
    if (experiment.status === 'active') {
      const variant = posthogExperiments.getExperimentVariant(
        experiment.flagKey as any,
        'control'
      );
      activeVariants[experiment.flagKey] = variant;
    }
  });
  
  return activeVariants;
}

// Track experiment goal conversions
export function trackExperimentGoal(goalName: string, value?: number) {
  const activeVariants = getExperimentResults();
  
  Object.entries(activeVariants).forEach(([flagKey, variant]) => {
    posthogExperiments.trackExperimentConversion(
      flagKey as any,
      variant as any,
      goalName,
      value
    );
  });
}