// @ts-nocheck
import { useMemo } from 'react';
import type { FeatureFlags } from '../../../shared/featureFlags';

/**
 * Client-side feature flags hook
 *
 * This hook provides access to feature flags on the client side.
 * For now, it mirrors the server-side configuration, but in a real
 * implementation, this could fetch from an API or be provided via context.
 */

// Client-side feature flags (should match server-side for initial launch)
const clientFeatureFlags: FeatureFlags = {
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

  // Premium features
  advancedSearch: true,
  bulkExport: true,
  apiAccess: false,

  // Admin features
  adminPanel: true,
  contentManagement: true,
  userManagement: true,
  analytics: true,
};

// Development overrides (if needed)
const developmentOverrides: Partial<FeatureFlags> = {
  // In development, we might want to enable future features for testing
  // Uncomment the following lines to enable in development:
  // people: true,
  // companies: true,
  // projects: true,
};

export function useFeatureFlags(): FeatureFlags {
  return useMemo(() => {
    let flags = { ...clientFeatureFlags };

    // Apply development overrides in development mode
    if (process.env.NODE_ENV === 'development') {
      flags = { ...flags, ...developmentOverrides };
    }

    return flags;
  }, []);
}

export function useFeatureFlag(feature: keyof FeatureFlags): boolean {
  const flags = useFeatureFlags();
  return flags[feature];
}

/**
 * Feature Flag Component
 *
 * A component that conditionally renders its children based on feature flags.
 *
 * Usage:
 * <FeatureFlag feature="people">
 *   <PeopleComponent />
 * </FeatureFlag>
 */
interface FeatureFlagProps {
  feature: keyof FeatureFlags;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureFlag({ feature, children, fallback = null }: FeatureFlagProps) {
  const isEnabled = useFeatureFlag(feature);

  if (!isEnabled) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for feature flag protection
 *
 * Usage:
 * const ProtectedPeopleComponent = withFeatureFlag(PeopleComponent, 'people');
 */
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  feature: keyof FeatureFlags,
  fallback: React.ComponentType<P> | null = null
) {
  return function FeatureFlaggedComponent(props: P) {
    const isEnabled = useFeatureFlag(feature);

    if (!isEnabled) {
      return fallback ? <fallback {...props} /> : null;
    }

    return <Component {...props} />;
  };
}

/**
 * Hook for conditional navigation based on feature flags
 */
export function useFeatureNavigation() {
  const flags = useFeatureFlags();

  return {
    canNavigateTo: (feature: keyof FeatureFlags) => flags[feature],
    getAvailableFeatures: () => {
      return Object.entries(flags)
        .filter(([_, enabled]) => enabled)
        .map(([feature, _]) => feature as keyof FeatureFlags);
    },
  };
}

export default useFeatureFlags;
