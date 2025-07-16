/**
 * A/B Test Dashboard Configuration for AI Glossary Pro
 *
 * Defines key metrics, conversion tracking, and statistical thresholds
 * for all A/B testing experiments.
 */

export interface Metric {
  id: string;
  name: string;
  type: 'conversion' | 'engagement' | 'retention' | 'revenue';
  event: string;
  calculation: 'count' | 'unique' | 'sum' | 'average' | 'percentage';
  properties?: Record<string, any>;
  unit?: string;
}

export interface ABTestConfig {
  id: string;
  name: string;
  description: string;
  variants: string[];
  primaryMetric: string;
  secondaryMetrics: string[];
  minimumSampleSize: number;
  statisticalSignificance: number;
  minimumDetectableEffect: number;
}

// Core metrics for A/B testing
export const metrics: Record<string, Metric> = {
  // Conversion Metrics
  purchase_conversion_rate: {
    id: 'purchase_conversion_rate',
    name: 'Purchase Conversion Rate',
    type: 'conversion',
    event: 'purchase_completed',
    calculation: 'percentage',
    unit: '%',
  },

  trial_conversion_rate: {
    id: 'trial_conversion_rate',
    name: 'Trial to Paid Conversion Rate',
    type: 'conversion',
    event: 'purchase_completed',
    calculation: 'percentage',
    properties: {
      conversion_type: 'trial_to_paid',
    },
    unit: '%',
  },

  cta_click_rate: {
    id: 'cta_click_rate',
    name: 'CTA Click-Through Rate',
    type: 'engagement',
    event: 'cta_clicked',
    calculation: 'percentage',
    unit: '%',
  },

  // Engagement Metrics
  time_on_page: {
    id: 'time_on_page',
    name: 'Average Time on Page',
    type: 'engagement',
    event: 'page_view_duration',
    calculation: 'average',
    unit: 'seconds',
  },

  scroll_depth: {
    id: 'scroll_depth',
    name: 'Average Scroll Depth',
    type: 'engagement',
    event: 'scroll_depth_reached',
    calculation: 'average',
    unit: '%',
  },

  bounce_rate: {
    id: 'bounce_rate',
    name: 'Bounce Rate',
    type: 'engagement',
    event: 'session_bounced',
    calculation: 'percentage',
    unit: '%',
  },

  // Retention Metrics
  day_1_retention: {
    id: 'day_1_retention',
    name: 'Day 1 Retention',
    type: 'retention',
    event: 'user_returned',
    calculation: 'percentage',
    properties: {
      days_since_signup: 1,
    },
    unit: '%',
  },

  day_7_retention: {
    id: 'day_7_retention',
    name: 'Day 7 Retention',
    type: 'retention',
    event: 'user_returned',
    calculation: 'percentage',
    properties: {
      days_since_signup: 7,
    },
    unit: '%',
  },

  // Revenue Metrics
  average_order_value: {
    id: 'average_order_value',
    name: 'Average Order Value',
    type: 'revenue',
    event: 'purchase_completed',
    calculation: 'average',
    properties: {
      value_field: 'revenue',
    },
    unit: '$',
  },

  revenue_per_visitor: {
    id: 'revenue_per_visitor',
    name: 'Revenue Per Visitor',
    type: 'revenue',
    event: 'purchase_completed',
    calculation: 'sum',
    properties: {
      value_field: 'revenue',
    },
    unit: '$',
  },
};

// A/B Test Configurations
export const abTests: ABTestConfig[] = [
  {
    id: 'hero_section_test',
    name: 'Hero Section Optimization',
    description: 'Testing different hero section layouts and messaging',
    variants: ['control', 'benefit_focused', 'video_demo', 'social_proof'],
    primaryMetric: 'cta_click_rate',
    secondaryMetrics: ['scroll_depth', 'time_on_page', 'bounce_rate'],
    minimumSampleSize: 1000,
    statisticalSignificance: 0.95,
    minimumDetectableEffect: 0.05,
  },
  {
    id: 'pricing_page_test',
    name: 'Pricing Page Layout',
    description: 'Testing different pricing page presentations',
    variants: ['standard_tiers', 'comparison_table', 'feature_matrix', 'calculator'],
    primaryMetric: 'purchase_conversion_rate',
    secondaryMetrics: ['average_order_value', 'time_on_page', 'cta_click_rate'],
    minimumSampleSize: 800,
    statisticalSignificance: 0.95,
    minimumDetectableEffect: 0.1,
  },
  {
    id: 'onboarding_flow_test',
    name: 'Onboarding Flow Optimization',
    description: 'Testing different onboarding experiences',
    variants: ['step_by_step', 'video_tutorial', 'interactive_tour', 'minimal'],
    primaryMetric: 'day_7_retention',
    secondaryMetrics: ['day_1_retention', 'trial_conversion_rate', 'time_on_page'],
    minimumSampleSize: 500,
    statisticalSignificance: 0.95,
    minimumDetectableEffect: 0.15,
  },
  {
    id: 'social_proof_test',
    name: 'Social Proof Elements',
    description: 'Testing impact of different social proof presentations',
    variants: ['none', 'testimonials', 'logos', 'case_studies', 'combined'],
    primaryMetric: 'purchase_conversion_rate',
    secondaryMetrics: ['cta_click_rate', 'time_on_page', 'revenue_per_visitor'],
    minimumSampleSize: 1200,
    statisticalSignificance: 0.95,
    minimumDetectableEffect: 0.08,
  },
];

// Statistical Configuration
export const statisticalConfig = {
  // Confidence levels
  confidenceLevels: {
    low: 0.9,
    standard: 0.95,
    high: 0.99,
  },

  // Power analysis settings
  statisticalPower: 0.8,

  // Multiple testing correction
  multipleTestingCorrection: 'bonferroni',

  // Test duration constraints
  minimumTestDuration: 7, // days
  maximumTestDuration: 30, // days

  // Sample size calculator
  calculateSampleSize: (
    baselineRate: number,
    mde: number,
    significance: number = 0.95,
    power: number = 0.8
  ): number => {
    // Simplified sample size calculation
    const alpha = 1 - significance;
    const beta = 1 - power;
    const p1 = baselineRate;
    const p2 = baselineRate * (1 + mde);
    const pooledP = (p1 + p2) / 2;
    const pooledQ = 1 - pooledP;

    const zAlpha = 1.96; // for 95% confidence
    const zBeta = 0.84; // for 80% power

    const n = (2 * pooledP * pooledQ * (zAlpha + zBeta) ** 2) / (p2 - p1) ** 2;

    return Math.ceil(n);
  },
};

// Dashboard Layout Configuration
export const dashboardLayout = {
  // Main dashboard sections
  sections: [
    {
      id: 'overview',
      name: 'Test Overview',
      widgets: ['test_status', 'sample_size_progress', 'duration'],
    },
    {
      id: 'primary_metrics',
      name: 'Primary Metrics',
      widgets: ['conversion_rate_chart', 'statistical_significance', 'confidence_intervals'],
    },
    {
      id: 'secondary_metrics',
      name: 'Secondary Metrics',
      widgets: ['engagement_metrics', 'retention_curves', 'revenue_impact'],
    },
    {
      id: 'segments',
      name: 'Segment Analysis',
      widgets: ['device_breakdown', 'traffic_source', 'user_cohorts'],
    },
  ],

  // Widget configurations
  widgets: {
    conversion_rate_chart: {
      type: 'line_chart',
      metrics: ['conversion_rate'],
      groupBy: 'variant',
      interval: 'daily',
    },
    statistical_significance: {
      type: 'significance_calculator',
      showConfidenceInterval: true,
      showPValue: true,
    },
    sample_size_progress: {
      type: 'progress_bar',
      target: 'minimumSampleSize',
      showProjectedCompletion: true,
    },
  },
};

// Real-time monitoring configuration
export const monitoringConfig = {
  // Update frequency
  updateInterval: 300, // 5 minutes

  // Sample ratio monitoring
  sampleRatioAlert: {
    enabled: true,
    tolerance: 0.05, // 5% deviation
    checkInterval: 3600, // hourly
  },

  // Performance monitoring
  performanceMetrics: ['page_load_time', 'time_to_interactive', 'error_rate'],

  // Alert conditions
  alerts: [
    {
      name: 'Sample Ratio Mismatch',
      condition: 'sample_ratio_deviation > 0.05',
      severity: 'critical',
    },
    {
      name: 'Low Sample Size',
      condition: 'daily_samples < expected_daily_samples * 0.5',
      severity: 'warning',
    },
    {
      name: 'Test Winner',
      condition: 'statistical_significance >= 0.95 && sample_size >= minimum',
      severity: 'info',
    },
  ],
};

// Export functions for PostHog dashboard creation
export const createDashboard = (testId: string) => {
  const test = abTests.find(t => t.id === testId);
  if (!test) throw new Error(`Test ${testId} not found`);

  return {
    name: test.name,
    description: test.description,
    tags: ['ab_test', testId],
    items: [
      // Primary metric chart
      {
        name: `${test.primaryMetric} by Variant`,
        type: 'chart',
        filters: {
          events: [metrics[test.primaryMetric].event],
          breakdown: 'variant',
          date_from: '-7d',
        },
      },
      // Secondary metrics
      ...test.secondaryMetrics.map(metricId => ({
        name: `${metrics[metricId].name} by Variant`,
        type: 'chart',
        filters: {
          events: [metrics[metricId].event],
          breakdown: 'variant',
          date_from: '-7d',
        },
      })),
    ],
  };
};
