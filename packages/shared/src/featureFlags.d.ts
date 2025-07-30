/**
 * Feature Flags Configuration
 *
 * Controls which features are enabled/disabled for different environments
 * and launch phases.
 */
export interface FeatureFlags {
    people: boolean;
    companies: boolean;
    projects: boolean;
    products: boolean;
    papers: boolean;
    sites: boolean;
    resources: boolean;
    terms: boolean;
    categories: boolean;
    learningPaths: boolean;
    codeExamples: boolean;
    search: boolean;
    favorites: boolean;
    advancedSearch: boolean;
    bulkExport: boolean;
    apiAccess: boolean;
    adminPanel: boolean;
    contentManagement: boolean;
    userManagement: boolean;
    analytics: boolean;
}
export declare const defaultFeatureFlags: FeatureFlags;
export declare const developmentFeatureFlags: Partial<FeatureFlags>;
export declare const productionFeatureFlags: Partial<FeatureFlags>;
/**
 * Get feature flags for current environment
 */
export declare function getFeatureFlags(): FeatureFlags;
/**
 * Check if a feature is enabled
 */
export declare function isFeatureEnabled(feature: keyof FeatureFlags): boolean;
/**
 * Middleware to check feature flags
 */
export declare function requireFeature(feature: keyof FeatureFlags): (_req: any, res: any, next: any) => any;
/**
 * Client-side feature flag hook (for React components)
 */
export declare function useFeatureFlags(): FeatureFlags;
declare const _default: {
    getFeatureFlags: typeof getFeatureFlags;
    isFeatureEnabled: typeof isFeatureEnabled;
    requireFeature: typeof requireFeature;
    useFeatureFlags: typeof useFeatureFlags;
    defaultFeatureFlags: FeatureFlags;
    developmentFeatureFlags: Partial<FeatureFlags>;
    productionFeatureFlags: Partial<FeatureFlags>;
};
export default _default;
