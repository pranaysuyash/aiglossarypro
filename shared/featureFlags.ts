/**
 * Feature Flags Configuration
 *
 * Controls which features are enabled/disabled for different environments
 * and launch phases.
 */

export interface FeatureFlags {
  // Future features - disabled for initial launch
  people: boolean;
  companies: boolean;
  projects: boolean;
  products: boolean;
  papers: boolean;
  sites: boolean;
  resources: boolean;

  // Core features - enabled for initial launch
  terms: boolean;
  categories: boolean;
  learningPaths: boolean;
  codeExamples: boolean;
  search: boolean;
  favorites: boolean;

  // Premium features
  advancedSearch: boolean;
  bulkExport: boolean;
  apiAccess: boolean;

  // Admin features
  adminPanel: boolean;
  contentManagement: boolean;
  userManagement: boolean;
  analytics: boolean;
}

// Default feature flags for initial launch
export const defaultFeatureFlags: FeatureFlags = {
  // Future features - DISABLED for initial launch
  people: false,
  companies: false,
  projects: false,
  products: false,
  papers: false,
  sites: false,
  resources: false,

  // Core features - ENABLED for initial launch
  terms: true,
  categories: true,
  learningPaths: true,
  codeExamples: true,
  search: true,
  favorites: true,

  // Premium features - ENABLED
  advancedSearch: true,
  bulkExport: true,
  apiAccess: false, // May be enabled later

  // Admin features - ENABLED
  adminPanel: true,
  contentManagement: true,
  userManagement: true,
  analytics: true,
};

// Environment-specific overrides
export const developmentFeatureFlags: Partial<FeatureFlags> = {
  // In development, we might want to test future features
  people: true,
  companies: true,
  projects: true,
  apiAccess: true,
};

export const productionFeatureFlags: Partial<FeatureFlags> = {
  // In production, strictly follow initial launch configuration
  people: false,
  companies: false,
  projects: false,
  products: false,
  papers: false,
  sites: false,
  resources: false,
  apiAccess: false,
};

/**
 * Get feature flags for current environment
 */
export function getFeatureFlags(): FeatureFlags {
  const env = process.env.NODE_ENV || 'development';

  let flags = { ...defaultFeatureFlags };

  if (env === 'development') {
    flags = { ...flags, ...developmentFeatureFlags };
  } else if (env === 'production') {
    flags = { ...flags, ...productionFeatureFlags };
  }

  // Allow environment variable overrides
  Object.keys(flags).forEach(key => {
    const envKey = `FEATURE_${key.toUpperCase()}`;
    const envValue = process.env[envKey];
    if (envValue !== undefined) {
      flags[key as keyof FeatureFlags] = envValue === 'true';
    }
  });

  return flags;
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return getFeatureFlags()[feature];
}

/**
 * Middleware to check feature flags
 */
export function requireFeature(feature: keyof FeatureFlags) {
  return (req: Request, res: Request, next: Request) => {
    if (!isFeatureEnabled(feature)) {
      return res.status(404).json({
        error: 'Feature not available',
        message: `The ${feature} feature is not enabled in this environment.`,
      });
    }
    next();
  };
}

/**
 * Client-side feature flag hook (for React components)
 */
export function useFeatureFlags() {
  // In a real implementation, this would fetch from an API or context
  // For now, we'll use the server-side flags
  return getFeatureFlags();
}

export default {
  getFeatureFlags,
  isFeatureEnabled,
  requireFeature,
  useFeatureFlags,
  defaultFeatureFlags,
  developmentFeatureFlags,
  productionFeatureFlags,
};
