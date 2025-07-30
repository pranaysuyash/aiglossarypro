"use strict";
/**
 * Feature Flags Configuration
 *
 * Controls which features are enabled/disabled for different environments
 * and launch phases.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.productionFeatureFlags = exports.developmentFeatureFlags = exports.defaultFeatureFlags = void 0;
exports.getFeatureFlags = getFeatureFlags;
exports.isFeatureEnabled = isFeatureEnabled;
exports.requireFeature = requireFeature;
exports.useFeatureFlags = useFeatureFlags;
// Default feature flags for initial launch
exports.defaultFeatureFlags = {
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
exports.developmentFeatureFlags = {
    // In development, we might want to test future features
    people: true,
    companies: true,
    projects: true,
    apiAccess: true,
};
exports.productionFeatureFlags = {
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
function getFeatureFlags() {
    const env = process.env.NODE_ENV || 'development';
    let flags = { ...exports.defaultFeatureFlags };
    if (env === 'development') {
        flags = { ...flags, ...exports.developmentFeatureFlags };
    }
    else if (env === 'production') {
        flags = { ...flags, ...exports.productionFeatureFlags };
    }
    // Allow environment variable overrides
    Object.keys(flags).forEach(key => {
        const envKey = `FEATURE_${key.toUpperCase()}`;
        const envValue = process.env[envKey];
        if (envValue !== undefined) {
            flags[key] = envValue === 'true';
        }
    });
    return flags;
}
/**
 * Check if a feature is enabled
 */
function isFeatureEnabled(feature) {
    return getFeatureFlags()[feature];
}
/**
 * Middleware to check feature flags
 */
function requireFeature(feature) {
    return (_req, res, next) => {
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
function useFeatureFlags() {
    // In a real implementation, this would fetch from an API or context
    // For now, we'll use the server-side flags
    return getFeatureFlags();
}
exports.default = {
    getFeatureFlags,
    isFeatureEnabled,
    requireFeature,
    useFeatureFlags,
    defaultFeatureFlags: exports.defaultFeatureFlags,
    developmentFeatureFlags: exports.developmentFeatureFlags,
    productionFeatureFlags: exports.productionFeatureFlags,
};
