/**
 * Heatmap Tracking Configuration for AI Glossary Pro
 *
 * Configures heatmap tracking for critical landing page sections,
 * click patterns on CTAs, and scroll depth monitoring.
 */

export interface HeatmapConfig {
  id: string;
  name: string;
  selector: string;
  type: 'click' | 'move' | 'scroll' | 'attention';
  trackingOptions: TrackingOptions;
  segments?: string[];
}

export interface TrackingOptions {
  sampleRate?: number; // 0-1, percentage of users to track
  debounceMs?: number; // Debounce time for mouse move events
  precision?: number; // Pixel precision for position tracking
  captureRage?: boolean; // Track rage clicks
  captureDeadClicks?: boolean; // Track clicks on non-interactive elements
}

export interface ScrollTrackingConfig {
  thresholds: number[]; // Percentage thresholds to track
  trackTime?: boolean; // Track time spent at each depth
  trackVelocity?: boolean; // Track scroll velocity
}

// Critical page sections for heatmap tracking
export const heatmapSections: HeatmapConfig[] = [
  // Hero Section
  {
    id: 'hero_section',
    name: 'Hero Section Interactions',
    selector: '[data-section="hero"]',
    type: 'click',
    trackingOptions: {
      sampleRate: 1.0, // Track all users for hero section
      captureRage: true,
      captureDeadClicks: true,
    },
  },
  {
    id: 'hero_cta_primary',
    name: 'Primary Hero CTA',
    selector: '[data-cta="hero-primary"]',
    type: 'click',
    trackingOptions: {
      sampleRate: 1.0,
      precision: 1,
    },
  },
  {
    id: 'hero_cta_secondary',
    name: 'Secondary Hero CTA',
    selector: '[data-cta="hero-secondary"]',
    type: 'click',
    trackingOptions: {
      sampleRate: 1.0,
      precision: 1,
    },
  },

  // Features Section
  {
    id: 'features_section',
    name: 'Features Section',
    selector: '[data-section="features"]',
    type: 'attention',
    trackingOptions: {
      sampleRate: 0.5,
      debounceMs: 100,
    },
  },
  {
    id: 'feature_cards',
    name: 'Feature Card Interactions',
    selector: '[data-feature-card]',
    type: 'click',
    trackingOptions: {
      sampleRate: 0.5,
      captureDeadClicks: true,
    },
  },

  // Pricing Section
  {
    id: 'pricing_section',
    name: 'Pricing Section',
    selector: '[data-section="pricing"]',
    type: 'attention',
    trackingOptions: {
      sampleRate: 0.8,
      debounceMs: 50,
    },
  },
  {
    id: 'pricing_tier_selection',
    name: 'Pricing Tier Selection',
    selector: '[data-pricing-tier]',
    type: 'click',
    trackingOptions: {
      sampleRate: 1.0,
      precision: 1,
    },
  },
  {
    id: 'pricing_cta',
    name: 'Pricing CTAs',
    selector: '[data-cta^="pricing"]',
    type: 'click',
    trackingOptions: {
      sampleRate: 1.0,
      captureRage: true,
    },
  },

  // Testimonials Section
  {
    id: 'testimonials_section',
    name: 'Testimonials Section',
    selector: '[data-section="testimonials"]',
    type: 'attention',
    trackingOptions: {
      sampleRate: 0.3,
      debounceMs: 200,
    },
  },
  {
    id: 'testimonial_navigation',
    name: 'Testimonial Navigation',
    selector: '[data-testimonial-nav]',
    type: 'click',
    trackingOptions: {
      sampleRate: 0.5,
    },
  },

  // Navigation
  {
    id: 'main_navigation',
    name: 'Main Navigation',
    selector: 'nav[role="navigation"]',
    type: 'click',
    trackingOptions: {
      sampleRate: 0.5,
      captureDeadClicks: false,
    },
  },
  {
    id: 'mobile_menu',
    name: 'Mobile Menu',
    selector: '[data-mobile-menu]',
    type: 'click',
    trackingOptions: {
      sampleRate: 1.0,
    },
    segments: ['mobile'],
  },
];

// Scroll depth tracking configuration
export const scrollTracking: ScrollTrackingConfig = {
  thresholds: [25, 50, 75, 90, 100], // Track at these percentage depths
  trackTime: true, // Track time spent at each depth
  trackVelocity: true, // Track how fast users scroll
};

// Click pattern analysis
export const clickPatterns = {
  // Rage click detection
  rageClickThreshold: {
    clicks: 3,
    timeWindow: 1000, // 1 second
    radius: 50, // pixels
  },

  // Dead click detection
  deadClickTracking: {
    enabled: true,
    reportThreshold: 10, // Report if more than 10 dead clicks on same element
  },

  // First click tracking
  firstClickImportance: {
    enabled: true,
    weight: 2.0, // Give first clicks double weight in heatmap
  },

  // Click sequence tracking
  sequenceTracking: {
    enabled: true,
    maxSequenceLength: 5,
    commonSequences: [
      ['hero_cta', 'pricing', 'checkout'],
      ['features', 'testimonials', 'pricing'],
      ['hero_video', 'features', 'pricing'],
    ],
  },
};

// Attention tracking configuration
export const attentionTracking = {
  // Mouse movement heatmap
  mouseMovement: {
    enabled: true,
    sampleRate: 0.1, // Sample 10% of users
    precision: 10, // 10px grid
    debounceMs: 50,
  },

  // Viewport tracking
  viewportTracking: {
    enabled: true,
    updateInterval: 1000, // Update every second
    trackIdleTime: true,
  },

  // Element visibility tracking
  visibilityTracking: {
    enabled: true,
    threshold: 0.5, // Element 50% visible
    minDuration: 1000, // Minimum 1 second visibility
  },
};

// Device-specific configurations
export const deviceConfigs = {
  desktop: {
    enableHover: true,
    trackMouseMovement: true,
    precision: 5,
  },
  mobile: {
    enableHover: false,
    trackMouseMovement: false,
    precision: 10,
    trackTouchPressure: true,
    trackGestures: ['swipe', 'pinch', 'long_press'],
  },
  tablet: {
    enableHover: false,
    trackMouseMovement: false,
    precision: 8,
    trackTouchPressure: true,
  },
};

// Heatmap visualization settings
export const visualizationSettings = {
  // Color scheme
  colorScheme: {
    cold: '#0000FF',
    warm: '#FFFF00',
    hot: '#FF0000',
    opacity: 0.6,
  },

  // Blur radius for heatmap points
  blurRadius: 20,

  // Minimum data points for display
  minDataPoints: 10,

  // Aggregation settings
  aggregation: {
    method: 'gaussian', // or 'linear'
    radius: 30,
  },
};

// Implementation helper for PostHog
export const implementHeatmapTracking = () => {
  return {
    // PostHog toolbar configuration
    toolbar: {
      heatmaps_enabled: true,
      heatmap_sample_rate: 0.1,
    },

    // Custom event tracking for heatmaps
    customEvents: heatmapSections.map(section => ({
      selector: section.selector,
      event_name: `heatmap_${section.id}`,
      properties: {
        section_name: section.name,
        tracking_type: section.type,
      },
    })),

    // Scroll tracking implementation
    scrollTracking: {
      events: scrollTracking.thresholds.map(threshold => ({
        name: `scroll_depth_${threshold}`,
        threshold: threshold,
        once: true,
      })),
    },

    // Rage click detection
    rageClickDetection: {
      selector: '*',
      threshold: clickPatterns.rageClickThreshold,
      event_name: 'rage_click_detected',
    },
  };
};

// Performance considerations
export const performanceConfig = {
  // Batching settings
  batching: {
    enabled: true,
    batchSize: 50,
    flushInterval: 5000, // 5 seconds
  },

  // Sampling strategies
  sampling: {
    strategy: 'adaptive', // Increase sampling for high-value pages
    baseRate: 0.1,
    highValuePages: {
      '/pricing': 1.0,
      '/checkout': 1.0,
      '/': 0.5,
    },
  },

  // Data retention
  retention: {
    rawData: 30, // days
    aggregatedData: 365, // days
  },
};
