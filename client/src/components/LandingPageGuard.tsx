import { useEffect, useState, Suspense } from 'react';
import { useExperiment } from '@/services/posthogExperiments';
import { posthog } from '@/lib/analytics';
import { LazyLandingPage, LazyLandingA } from '@/components/lazy/LazyPages';

/**
 * Landing Page A/B Test Guard
 * Routes users to different landing page variants based on PostHog experiment flags
 */
export function LandingPageGuard() {
  const [isLoading, setIsLoading] = useState(true);
  const landingExperiment = useExperiment('landingPageVariant', 'control');
  
  useEffect(() => {
    // Track experiment exposure
    posthog.capture('landing_page_experiment_exposure', {
      variant: landingExperiment.variant,
      timestamp: new Date().toISOString(),
    });
    
    // Small delay to ensure PostHog is initialized
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [landingExperiment.variant]);
  
  // Show loading state briefly to avoid flicker
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  // Route to appropriate landing page variant with Suspense
  const LandingComponent = landingExperiment.variant === 'marketing_sample' ? LazyLandingA : LazyLandingPage;
  
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading your experience...</p>
          </div>
        </div>
      }
    >
      <LandingComponent />
    </Suspense>
  );
}

// Hook for components that need to know which landing variant is active
export function useLandingVariant() {
  const experiment = useExperiment('landingPageVariant', 'control');
  
  return {
    variant: experiment.variant,
    isMarketingVariant: experiment.variant === 'marketing_sample',
    isControlVariant: experiment.variant === 'control',
    trackConversion: (conversionType: string, value?: number) => {
      experiment.trackConversion(`landing_${conversionType}`, value, {
        landing_variant: experiment.variant,
      });
    },
  };
}