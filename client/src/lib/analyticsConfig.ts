// Analytics configuration for different environments
export interface AnalyticsConfig {
  ga4: {
    measurementId: string;
    enabled: boolean;
    debugMode: boolean;
    cookieFlags: string;
    cookieExpires: number;
  };
  posthog: {
    apiKey: string;
    enabled: boolean;
    apiHost: string;
    debugMode: boolean;
  };
  privacy: {
    anonymizeIp: boolean;
    allowGoogleSignals: boolean;
    allowAdPersonalization: boolean;
    respectDoNotTrack: boolean;
  };
  sampling: {
    pageviewSampleRate: number;
    eventSampleRate: number;
  };
  features: {
    enhancedMeasurement: boolean;
    crossDomainTracking: boolean;
    customDimensions: boolean;
  };
}

// Environment-specific configurations
const developmentConfig: AnalyticsConfig = {
  ga4: {
    measurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX',
    enabled: import.meta.env.VITE_GA4_ENABLED === 'true',
    debugMode: true,
    cookieFlags: 'SameSite=Lax',
    cookieExpires: 86400 // 1 day for development
  },
  posthog: {
    apiKey: import.meta.env.VITE_POSTHOG_KEY || '',
    enabled: !!import.meta.env.VITE_POSTHOG_KEY,
    apiHost: 'https://app.posthog.com',
    debugMode: true
  },
  privacy: {
    anonymizeIp: true,
    allowGoogleSignals: false,
    allowAdPersonalization: false,
    respectDoNotTrack: true
  },
  sampling: {
    pageviewSampleRate: 100, // Track all events in development
    eventSampleRate: 100
  },
  features: {
    enhancedMeasurement: true,
    crossDomainTracking: false,
    customDimensions: true
  }
};

const productionConfig: AnalyticsConfig = {
  ga4: {
    measurementId: import.meta.env.VITE_GA4_MEASUREMENT_ID || '',
    enabled: import.meta.env.VITE_GA4_ENABLED === 'true',
    debugMode: false,
    cookieFlags: 'SameSite=Strict;Secure',
    cookieExpires: 63072000 // 2 years for production
  },
  posthog: {
    apiKey: import.meta.env.VITE_POSTHOG_KEY || '',
    enabled: !!import.meta.env.VITE_POSTHOG_KEY,
    apiHost: 'https://app.posthog.com',
    debugMode: false
  },
  privacy: {
    anonymizeIp: true,
    allowGoogleSignals: false,
    allowAdPersonalization: false,
    respectDoNotTrack: true
  },
  sampling: {
    pageviewSampleRate: 100,
    eventSampleRate: 100
  },
  features: {
    enhancedMeasurement: true,
    crossDomainTracking: false,
    customDimensions: true
  }
};

const testConfig: AnalyticsConfig = {
  ga4: {
    measurementId: 'G-TEST1234567',
    enabled: false, // Disable in tests
    debugMode: true,
    cookieFlags: 'SameSite=Lax',
    cookieExpires: 3600 // 1 hour for tests
  },
  posthog: {
    apiKey: '',
    enabled: false, // Disable in tests
    apiHost: 'https://app.posthog.com',
    debugMode: true
  },
  privacy: {
    anonymizeIp: true,
    allowGoogleSignals: false,
    allowAdPersonalization: false,
    respectDoNotTrack: true
  },
  sampling: {
    pageviewSampleRate: 0, // No tracking in tests
    eventSampleRate: 0
  },
  features: {
    enhancedMeasurement: false,
    crossDomainTracking: false,
    customDimensions: false
  }
};

// Get current environment configuration
export function getAnalyticsConfig(): AnalyticsConfig {
  const environment = import.meta.env.NODE_ENV || 'development';
  
  switch (environment) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

// Validate analytics configuration
export function validateAnalyticsConfig(config: AnalyticsConfig): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate GA4 configuration
  if (config.ga4.enabled) {
    if (!config.ga4.measurementId) {
      errors.push('GA4 measurement ID is required when GA4 is enabled');
    } else if (!config.ga4.measurementId.startsWith('G-')) {
      errors.push('GA4 measurement ID must start with "G-"');
    }
    
    if (config.ga4.cookieExpires <= 0) {
      warnings.push('GA4 cookie expiration should be greater than 0');
    }
  }

  // Validate PostHog configuration
  if (config.posthog.enabled && !config.posthog.apiKey) {
    errors.push('PostHog API key is required when PostHog is enabled');
  }

  // Validate sampling rates
  if (config.sampling.pageviewSampleRate < 0 || config.sampling.pageviewSampleRate > 100) {
    errors.push('Pageview sample rate must be between 0 and 100');
  }
  
  if (config.sampling.eventSampleRate < 0 || config.sampling.eventSampleRate > 100) {
    errors.push('Event sample rate must be between 0 and 100');
  }

  // Production-specific validations
  if (import.meta.env.NODE_ENV === 'production') {
    if (config.ga4.debugMode) {
      warnings.push('GA4 debug mode is enabled in production');
    }
    
    if (config.posthog.debugMode) {
      warnings.push('PostHog debug mode is enabled in production');
    }
    
    if (!config.ga4.cookieFlags.includes('Secure')) {
      warnings.push('GA4 cookies should be secure in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Get analytics configuration with validation
export function getValidatedAnalyticsConfig(): {
  config: AnalyticsConfig;
  validation: ReturnType<typeof validateAnalyticsConfig>;
} {
  const config = getAnalyticsConfig();
  const validation = validateAnalyticsConfig(config);
  
  if (!validation.isValid) {
    console.error('Analytics configuration validation failed:', validation.errors);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('Analytics configuration warnings:', validation.warnings);
  }
  
  return { config, validation };
}

// Environment helpers
export const isProduction = () => import.meta.env.NODE_ENV === 'production';
export const isDevelopment = () => import.meta.env.NODE_ENV === 'development';
export const isTest = () => import.meta.env.NODE_ENV === 'test';

// Analytics feature flags
export const analyticsFeatures = {
  enableGA4: () => {
    const config = getAnalyticsConfig();
    return config.ga4.enabled && !!config.ga4.measurementId;
  },
  
  enablePostHog: () => {
    const config = getAnalyticsConfig();
    return config.posthog.enabled && !!config.posthog.apiKey;
  },
  
  enableDebugMode: () => {
    const config = getAnalyticsConfig();
    return config.ga4.debugMode || config.posthog.debugMode;
  },
  
  enableCustomDimensions: () => {
    const config = getAnalyticsConfig();
    return config.features.customDimensions;
  },
  
  enableEnhancedMeasurement: () => {
    const config = getAnalyticsConfig();
    return config.features.enhancedMeasurement;
  }
};

// Default export
export default getAnalyticsConfig;