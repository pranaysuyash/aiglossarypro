import { useEffect, useState } from 'react';
import posthog from 'posthog-js';

export function useABTest(experimentName: string) {
  const [variant, setVariant] = useState<string>('control');
  
  useEffect(() => {
    // Check if PostHog is available
    if (typeof window !== 'undefined' && posthog) {
      try {
        // Get the feature flag value from PostHog
        const assignment = posthog.getFeatureFlag(experimentName);
        
        // Set variant based on PostHog assignment or default to control
        if (assignment && typeof assignment === 'string') {
          setVariant(assignment);
        } else {
          setVariant('control');
        }
        
        // Track the experiment assignment
        posthog.capture('experiment_assignment', {
          experiment_name: experimentName,
          variant: assignment || 'control',
          timestamp: new Date().toISOString(),
        });
        
      } catch (error) {
        console.warn(`Failed to get A/B test variant for ${experimentName}:`, error);
        setVariant('control');
      }
    } else {
      // PostHog not available, use control
      setVariant('control');
    }
  }, [experimentName]);
  
  return variant;
}

// Hook for multiple A/B tests
export function useMultipleABTests(experiments: string[]) {
  const [variants, setVariants] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (typeof window !== 'undefined' && posthog && experiments.length > 0) {
      const experimentVariants: Record<string, string> = {};
      
      experiments.forEach((experimentName) => {
        try {
          const assignment = posthog.getFeatureFlag(experimentName);
          experimentVariants[experimentName] = (assignment as string) || 'control';
          
          // Track each experiment assignment
          posthog.capture('experiment_assignment', {
            experiment_name: experimentName,
            variant: experimentVariants[experimentName],
            timestamp: new Date().toISOString(),
          });
          
        } catch (error) {
          console.warn(`Failed to get A/B test variant for ${experimentName}:`, error);
          experimentVariants[experimentName] = 'control';
        }
      });
      
      setVariants(experimentVariants);
    } else {
      // PostHog not available or no experiments, use control for all
      const controlVariants = experiments.reduce((acc, exp) => {
        acc[exp] = 'control';
        return acc;
      }, {} as Record<string, string>);
      setVariants(controlVariants);
    }
  }, [experiments]);
  
  return variants;
}

// Hook for checking if a feature flag is enabled
export function useFeatureFlag(flagName: string) {
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && posthog) {
      try {
        const flagValue = posthog.isFeatureEnabled(flagName);
        setIsEnabled(!!flagValue);
        
        // Track feature flag evaluation
        posthog.capture('feature_flag_evaluation', {
          feature_flag: flagName,
          enabled: !!flagValue,
          timestamp: new Date().toISOString(),
        });
        
      } catch (error) {
        console.warn(`Failed to evaluate feature flag ${flagName}:`, error);
        setIsEnabled(false);
      }
    }
  }, [flagName]);
  
  return isEnabled;
}
