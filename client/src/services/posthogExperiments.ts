import { posthog } from '@/lib/analytics';

export interface ExperimentFlags {
  // Landing page experiments
  landingPageVariant: 'control' | 'marketing_sample';
  landingPageBackground: 'control' | 'neural' | 'geometric' | 'fallback';
  landingPageCTA: 'control' | 'sample' | 'explore' | 'urgency' | 'benefit' | 'social_proof' | 'value' | 'action';
  landingPageMessaging: 'control' | 'focused' | 'technical';
  landingPageHeadline: 'control' | 'benefit_focused' | 'problem_solution' | 'social_proof' | 'authority' | 'curiosity' | 'value_prop' | 'savings_focused' | 'content_focused' | 'urgency_focused';
  socialProofPlacement: 'control' | 'above_fold' | 'below_hero' | 'in_features' | 'near_cta' | 'bottom' | 'numbers';
  urgencyMessaging: 'control' | 'time_limited' | 'quantity_limited' | 'social_pressure' | 'seasonal';
  
  // User experience experiments
  freeUserLimit: 'control' | 'expanded';
  onboardingFlow: 'control' | 'interactive' | 'simplified';
  searchExperience: 'control' | 'enhanced' | 'ai_powered';
  
  // Conversion experiments
  upgradePrompts: 'control' | 'value_focused' | 'urgency';
  paymentFlow: 'control' | 'mobile_optimized' | 'one_click';
  socialProof: 'control' | 'testimonials' | 'usage_stats';
  
  // New A/B test experiments
  exitIntentVariant: 'control' | 'value_focused' | 'urgency' | 'social_proof';
  trustBadgeStyle: 'minimal' | 'detailed' | 'animated';
  trustBadgePlacement: 'inline' | 'floating';
  floatingPricingVariant: 'control' | 'discount_focused' | 'urgency' | 'value';
  mediaLogosStyle: 'control' | 'animated' | 'carousel' | 'grid';
  mediaLogosPhrase: 'control' | 'authority' | 'social_proof' | 'credibility';
  mediaLogosPlacement: 'above_fold' | 'below_fold' | 'in_features' | 'near_cta';
  
  // Additional missing experiments
  pricingDisplay: 'value' | 'fallback' | 'action' | 'inline' | 'control' | 'marketing_sample' | 'neural' | 'geometric' | 'sample' | 'explore' | 'urgency' | 'benefit' | 'social_proof' | 'focused' | 'technical' | 'benefit_focused' | 'problem_solution' | 'authority' | 'curiosity' | 'value_prop' | 'above_fold' | 'below_hero' | 'in_features' | 'near_cta' | 'time_limited' | 'quantity_limited' | 'social_pressure' | 'seasonal' | 'expanded' | 'interactive' | 'simplified' | 'enhanced' | 'ai_powered' | 'value_focused' | 'mobile_optimized' | 'one_click' | 'testimonials' | 'usage_stats' | 'minimal' | 'detailed' | 'animated' | 'floating' | 'discount_focused' | 'carousel' | 'grid' | 'credibility' | 'below_fold' | 'simple' | 'comparison';
  landingPageCopy: 'value' | 'fallback' | 'action' | 'inline' | 'control' | 'marketing_sample' | 'neural' | 'geometric' | 'sample' | 'explore' | 'urgency' | 'benefit' | 'social_proof' | 'focused' | 'technical' | 'benefit_focused' | 'problem_solution' | 'authority' | 'curiosity' | 'value_prop' | 'above_fold' | 'below_hero' | 'in_features' | 'near_cta' | 'time_limited' | 'quantity_limited' | 'social_pressure' | 'seasonal' | 'expanded' | 'interactive' | 'simplified' | 'enhanced' | 'ai_powered' | 'value_focused' | 'mobile_optimized' | 'one_click' | 'testimonials' | 'usage_stats' | 'minimal' | 'detailed' | 'animated' | 'floating' | 'discount_focused' | 'carousel' | 'grid' | 'credibility' | 'below_fold' | 'pain_focused' | 'solution_focused' | 'urgency_focused';
  urgencyTactics: 'value' | 'fallback' | 'action' | 'inline' | 'control' | 'marketing_sample' | 'neural' | 'geometric' | 'sample' | 'explore' | 'urgency' | 'benefit' | 'social_proof' | 'focused' | 'technical' | 'benefit_focused' | 'problem_solution' | 'authority' | 'curiosity' | 'value_prop' | 'above_fold' | 'below_hero' | 'in_features' | 'near_cta' | 'time_limited' | 'quantity_limited' | 'social_pressure' | 'seasonal' | 'expanded' | 'interactive' | 'simplified' | 'enhanced' | 'ai_powered' | 'value_focused' | 'mobile_optimized' | 'one_click' | 'testimonials' | 'usage_stats' | 'minimal' | 'detailed' | 'animated' | 'floating' | 'discount_focused' | 'carousel' | 'grid' | 'credibility' | 'below_fold';
}

export interface ExperimentMetrics {
  // Core conversion metrics
  signupRate: number;
  upgradeRate: number;
  retentionRate: number;
  
  // Engagement metrics
  pageViews: number;
  sessionDuration: number;
  bounceRate: number;
  termViewsPerSession: number;
  
  // Feature usage metrics
  searchUsage: number;
  favoriteUsage: number;
  socialShareUsage: number;
  
  // Revenue metrics
  lifetimeValue: number;
  averageOrderValue: number;
  conversionTime: number;
}

class PostHogExperimentsService {
  private isInitialized = false;
  private userProperties: Record<string, any> = {};
  
  // Initialize PostHog feature flags
  async initialize(userId?: string, userProperties?: Record<string, any>) {
    if (this.isInitialized) return;
    
    try {
      // Set user properties for targeting
      if (userId) {
        posthog.identify(userId, userProperties);
      }
      
      if (userProperties) {
        this.userProperties = userProperties;
        posthog.setPersonProperties(userProperties);
      }
      
      // Wait for feature flags to load
      await posthog.reloadFeatureFlags();
      
      this.isInitialized = true;
      console.log('🧪 PostHog experiments initialized');
      
    } catch (error) {
      console.error('Failed to initialize PostHog experiments:', error);
    }
  }
  
  // Get experiment variant for a feature
  getExperimentVariant<K extends keyof ExperimentFlags>(
    flagKey: K,
    defaultValue: ExperimentFlags[K]
  ): ExperimentFlags[K] {
    if (!this.isInitialized) {
      console.warn(`PostHog not initialized, returning default for ${flagKey}`);
      return defaultValue;
    }
    
    const variant = posthog.getFeatureFlag(flagKey) as ExperimentFlags[K];
    
    // Track flag evaluation
    this.trackFlagEvaluation(flagKey, variant || defaultValue);
    
    return variant || defaultValue;
  }
  
  // Check if user is in experiment
  isInExperiment<K extends keyof ExperimentFlags>(
    flagKey: K,
    variant: ExperimentFlags[K]
  ): boolean {
    return this.getExperimentVariant(flagKey, 'control' as ExperimentFlags[K]) === variant;
  }
  
  // Track experiment exposure
  trackExperimentExposure<K extends keyof ExperimentFlags>(
    flagKey: K,
    variant: ExperimentFlags[K],
    context?: Record<string, any>
  ) {
    posthog.capture('experiment_exposure', {
      flag_key: flagKey,
      variant,
      experiment_context: context,
      user_properties: this.userProperties,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Track experiment conversion
  trackExperimentConversion<K extends keyof ExperimentFlags>(
    flagKey: K,
    variant: ExperimentFlags[K],
    conversionType: string,
    value?: number,
    properties?: Record<string, any>
  ) {
    posthog.capture('experiment_conversion', {
      flag_key: flagKey,
      variant,
      conversion_type: conversionType,
      conversion_value: value,
      time_to_conversion: this.getTimeToConversion(),
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Track feature usage within experiments
  trackFeatureUsage<K extends keyof ExperimentFlags>(
    flagKey: K,
    variant: ExperimentFlags[K],
    feature: string,
    usage_data?: Record<string, any>
  ) {
    posthog.capture('experiment_feature_usage', {
      flag_key: flagKey,
      variant,
      feature,
      usage_data,
      session_id: this.getSessionId(),
      timestamp: new Date().toISOString(),
    });
  }
  
  // Track experiment metrics
  trackExperimentMetrics<K extends keyof ExperimentFlags>(
    flagKey: K,
    variant: ExperimentFlags[K],
    metrics: Partial<ExperimentMetrics>
  ) {
    posthog.capture('experiment_metrics', {
      flag_key: flagKey,
      variant,
      metrics,
      session_duration: this.getSessionDuration(),
      timestamp: new Date().toISOString(),
    });
  }
  
  // Get all active experiments for user
  getActiveExperiments(): Record<string, string> {
    const flags = posthog.getFeatureFlags();
    const experiments: Record<string, string> = {};
    
    // Filter for experiment flags only
    const experimentKeys: (keyof ExperimentFlags)[] = [
      'landingPageVariant',
      'landingPageBackground',
      'landingPageCTA', 
      'landingPageMessaging',
      'landingPageHeadline',
      'socialProofPlacement',
      'urgencyMessaging',
      'freeUserLimit',
      'onboardingFlow',
      'searchExperience',
      'upgradePrompts',
      'paymentFlow',
      'socialProof',
      'exitIntentVariant',
      'trustBadgeStyle',
      'trustBadgePlacement',
      'floatingPricingVariant',
      'mediaLogosStyle',
      'mediaLogosPhrase',
      'mediaLogosPlacement'
    ];
    
    experimentKeys.forEach(key => {
      if (flags[key]) {
        experiments[key] = flags[key];
      }
    });
    
    return experiments;
  }
  
  // Track user journey through experiment funnel
  trackExperimentFunnel<K extends keyof ExperimentFlags>(
    flagKey: K,
    variant: ExperimentFlags[K],
    funnelStep: string,
    stepData?: Record<string, any>
  ) {
    posthog.capture('experiment_funnel_step', {
      flag_key: flagKey,
      variant,
      funnel_step: funnelStep,
      step_data: stepData,
      funnel_position: this.getFunnelPosition(funnelStep),
      session_id: this.getSessionId(),
      timestamp: new Date().toISOString(),
    });
  }
  
  // Set experiment context (device, location, etc.)
  setExperimentContext(context: Record<string, any>) {
    this.userProperties = {
      ...this.userProperties,
      experiment_context: context
    };
    
    posthog.setPersonProperties({
      experiment_context: context
    });
  }
  
  // Track experiment errors/issues
  trackExperimentError<K extends keyof ExperimentFlags>(
    flagKey: K,
    variant: ExperimentFlags[K],
    error: string,
    errorContext?: Record<string, any>
  ) {
    posthog.capture('experiment_error', {
      flag_key: flagKey,
      variant,
      error_message: error,
      error_context: errorContext,
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Helper methods
  private trackFlagEvaluation<K extends keyof ExperimentFlags>(
    flagKey: K,
    variant: ExperimentFlags[K]
  ) {
    posthog.capture('feature_flag_called', {
      flag_key: flagKey,
      flag_value: variant,
      timestamp: new Date().toISOString(),
    });
  }
  
  private getTimeToConversion(): number {
    const sessionStart = sessionStorage.getItem('session_start_time');
    if (!sessionStart) return 0;
    
    return Math.floor((Date.now() - parseInt(sessionStart)) / 1000);
  }
  
  private getSessionDuration(): number {
    const sessionStart = sessionStorage.getItem('session_start_time');
    if (!sessionStart) return 0;
    
    return Math.floor((Date.now() - parseInt(sessionStart)) / 1000);
  }
  
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('posthog_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('posthog_session_id', sessionId);
    }
    return sessionId;
  }
  
  private getFunnelPosition(step: string): number {
    const funnelSteps = [
      'page_view',
      'hero_view',
      'content_engagement',
      'cta_click',
      'signup_start',
      'signup_complete',
      'first_usage',
      'upgrade_consideration',
      'upgrade_complete'
    ];
    
    return funnelSteps.indexOf(step) + 1;
  }
}

// Export singleton instance
export const posthogExperiments = new PostHogExperimentsService();

// React hooks for easy component integration
export function useExperiment<K extends keyof ExperimentFlags>(
  flagKey: K,
  defaultValue: ExperimentFlags[K]
) {
  const variant = posthogExperiments.getExperimentVariant(flagKey, defaultValue);
  
  // Track exposure on first render
  React.useEffect(() => {
    posthogExperiments.trackExperimentExposure(flagKey, variant);
  }, [flagKey, variant]);
  
  return {
    variant,
    isVariant: (targetVariant: ExperimentFlags[K]) => variant === targetVariant,
    trackConversion: (conversionType: string, value?: number, properties?: Record<string, any>) =>
      posthogExperiments.trackExperimentConversion(flagKey, variant, conversionType, value, properties),
    trackFeatureUsage: (feature: string, usage_data?: Record<string, any>) =>
      posthogExperiments.trackFeatureUsage(flagKey, variant, feature, usage_data),
    trackFunnelStep: (step: string, stepData?: Record<string, any>) =>
      posthogExperiments.trackExperimentFunnel(flagKey, variant, step, stepData),
  };
}

// Utility for tracking experiment metrics across the app
export function useExperimentMetrics<K extends keyof ExperimentFlags>(
  flagKey: K,
  variant: ExperimentFlags[K]
) {
  return {
    trackMetrics: (metrics: Partial<ExperimentMetrics>) =>
      posthogExperiments.trackExperimentMetrics(flagKey, variant, metrics),
    trackError: (error: string, context?: Record<string, any>) =>
      posthogExperiments.trackExperimentError(flagKey, variant, error, context),
  };
}

// Import React for the hooks
import React from 'react';