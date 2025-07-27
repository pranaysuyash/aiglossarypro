import { posthogExperiments } from '@/services/posthogExperiments';
import { posthog } from './analytics';
import { ga4Analytics } from './ga4Analytics';

export interface ConversionEvent {
  event_name: string;
  conversion_type: 'signup' | 'upgrade' | 'engagement' | 'feature_usage';
  value?: number;
  currency?: string;
  user_properties?: Record<string, unknown>;
  experiment_context?: {
    active_experiments: Record<string, string>;
    variant_exposures: string[];
  };
}

export interface UserJourneyStep {
  step_name: string;
  step_type: 'page_view' | 'interaction' | 'conversion' | 'drop_off';
  timestamp: Date;
  page_path: string;
  user_properties: Record<string, unknown>;
  experiment_context?: Record<string, string>;
}

class EnhancedAnalyticsService {
  private userJourney: UserJourneyStep[] = [];
  private sessionStartTime: Date = new Date();
  private conversionFunnel: string[] = [
    'landing_view',
    'hero_engagement',
    'content_exploration',
    'cta_click',
    'signup_start',
    'signup_complete',
    'first_usage',
    'feature_adoption',
    'upgrade_consideration',
    'upgrade_complete',
  ];

  // Enhanced conversion tracking with experiment context
  trackConversionWithExperiments(event: ConversionEvent) {
    const activeExperiments = posthogExperiments.getActiveExperiments();
    const experimentContext = {
      active_experiments: activeExperiments,
      variant_exposures: Object.keys(activeExperiments),
    };

    // Track with PostHog
    posthog.capture('enhanced_conversion', {
      ...event,
      experiment_context: experimentContext,
      session_duration: this.getSessionDuration(),
      journey_step_count: this.userJourney.length,
      funnel_position: this.getFunnelPosition(event.event_name),
      timestamp: new Date().toISOString(),
    });

    // Track experiment conversions for each active experiment
    Object.entries(activeExperiments).forEach(([flagKey, variant]) => {
      posthogExperiments.trackExperimentConversion(
        flagKey as any,
        variant as any,
        event.conversion_type,
        event.value,
        {
          event_name: event.event_name,
          session_duration: this.getSessionDuration(),
          journey_length: this.userJourney.length,
        }
      );
    });

    // Track with GA4
    ga4Analytics.trackConversion({
      event_name: event.event_name,
      conversion_type: event.conversion_type,
      funnel_stage: event.event_name,
      value: event.value || 1,
      currency: event.currency || 'USD',
      event_category: 'enhanced_conversion',
      custom_parameters: {
        experiment_context: JSON.stringify(experimentContext),
        session_duration: this.getSessionDuration(),
        journey_steps: this.userJourney.length,
      },
    });
  }

  // Track user journey with experiment context
  trackJourneyStep(step: Omit<UserJourneyStep, 'timestamp' | 'experiment_context'>) {
    const activeExperiments = posthogExperiments.getActiveExperiments();

    const journeyStep: UserJourneyStep = {
      ...step,
      timestamp: new Date(),
      experiment_context: activeExperiments,
    };

    this.userJourney.push(journeyStep);

    // Keep only last 50 steps to prevent memory issues
    if (this.userJourney.length > 50) {
      this.userJourney = this.userJourney.slice(-50);
    }

    // Track with PostHog
    posthog.capture('user_journey_step', {
      step_name: step.step_name,
      step_type: step.step_type,
      page_path: step.page_path,
      user_properties: step.user_properties,
      experiment_context: activeExperiments,
      journey_position: this.userJourney.length,
      session_duration: this.getSessionDuration(),
      timestamp: new Date().toISOString(),
    });

    // Track funnel progression
    const funnelPosition = this.getFunnelPosition(step.step_name);
    if (funnelPosition > 0) {
      this.trackFunnelProgression(step.step_name, funnelPosition, activeExperiments);
    }

    // Update experiment contexts
    Object.entries(activeExperiments).forEach(([flagKey, variant]) => {
      posthogExperiments.trackExperimentFunnel(flagKey as any, variant as any, step.step_name, {
        step_type: step.step_type,
        page_path: step.page_path,
        journey_position: this.userJourney.length,
      });
    });
  }

  // Track feature usage with A/B testing context
  trackFeatureUsageWithExperiments(feature_name: string, usage_data: Record<string, unknown> = {}) {
    const activeExperiments = posthogExperiments.getActiveExperiments();

    posthog.capture('feature_usage_enhanced', {
      feature_name,
      usage_data,
      experiment_context: activeExperiments,
      session_duration: this.getSessionDuration(),
      journey_position: this.userJourney.length,
      timestamp: new Date().toISOString(),
    });

    // Track for each active experiment
    Object.entries(activeExperiments).forEach(([flagKey, variant]) => {
      posthogExperiments.trackFeatureUsage(
        flagKey as any,
        variant as any,
        feature_name,
        usage_data
      );
    });

    // Track with GA4
    ga4Analytics.trackEngagement({
      event_name: 'feature_usage',
      engagement_type: 'feature_interaction',
      engagement_value: 1,
      page_location: window.location.href,
      page_title: document.title,
      event_category: 'feature_usage',
      event_label: feature_name,
      custom_parameters: {
        feature_name,
        experiment_context: JSON.stringify(activeExperiments),
        ...usage_data,
      },
    });
  }

  // Track conversion funnel with dropout analysis
  trackFunnelProgression(step_name: string, position: number, experiments: Record<string, string>) {
    const previousSteps = this.userJourney
      .filter(step => this.getFunnelPosition(step.step_name) < position)
      .map(step => step.step_name);

    const dropoutPoints = this.identifyDropoutPoints(position);

    posthog.capture('funnel_progression', {
      current_step: step_name,
      funnel_position: position,
      previous_steps: previousSteps,
      dropout_points: dropoutPoints,
      experiment_context: experiments,
      completion_rate: (position / this.conversionFunnel.length) * 100,
      timestamp: new Date().toISOString(),
    });
  }

  // Advanced cohort analysis for experiments
  trackCohortMetrics(cohort_type: string, cohort_properties: Record<string, unknown>) {
    const activeExperiments = posthogExperiments.getActiveExperiments();

    posthog.capture('cohort_metrics', {
      cohort_type,
      cohort_properties,
      experiment_context: activeExperiments,
      session_metrics: {
        duration: this.getSessionDuration(),
        journey_length: this.userJourney.length,
        engagement_score: this.calculateEngagementScore(),
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Get user journey summary
  getJourneySummary(): {
    steps: UserJourneyStep[];
    duration: number;
    funnelProgress: number;
    dropoutRisk: number;
    experimentExposures: string[];
  } {
    const uniqueExperiments = new Set(
      this.userJourney.flatMap(step => Object.keys(step.experiment_context || {}))
    );

    const lastStep = this.userJourney[this.userJourney.length - 1];
    const lastFunnelPosition = lastStep ? this.getFunnelPosition(lastStep.step_name) : 0;

    return {
      steps: this.userJourney,
      duration: this.getSessionDuration(),
      funnelProgress: (lastFunnelPosition / this.conversionFunnel.length) * 100,
      dropoutRisk: this.calculateDropoutRisk(),
      experimentExposures: Array.from(uniqueExperiments),
    };
  }

  // Private helper methods
  private getSessionDuration(): number {
    return Math.floor((Date.now() - this.sessionStartTime.getTime()) / 1000);
  }

  private getFunnelPosition(stepName: string): number {
    return this.conversionFunnel.indexOf(stepName) + 1;
  }

  private identifyDropoutPoints(currentPosition: number): string[] {
    const expectedSteps = this.conversionFunnel.slice(0, currentPosition);
    const actualSteps = this.userJourney.map(step => step.step_name);

    return expectedSteps.filter(step => !actualSteps.includes(step));
  }

  private calculateEngagementScore(): number {
    if (this.userJourney.length === 0) {return 0;}

    const interactionSteps = this.userJourney.filter(
      step => step.step_type === 'interaction'
    ).length;

    const sessionMinutes = this.getSessionDuration() / 60;
    const pageViews = this.userJourney.filter(step => step.step_type === 'page_view').length;

    // Engagement score formula: interactions + time-based score + page depth
    const timeScore = Math.min(sessionMinutes * 2, 20); // Max 20 points for time
    const interactionScore = interactionSteps * 5; // 5 points per interaction
    const depthScore = Math.min(pageViews * 2, 10); // Max 10 points for depth

    return Math.min(timeScore + interactionScore + depthScore, 100);
  }

  private calculateDropoutRisk(): number {
    const sessionDuration = this.getSessionDuration();
    const lastActivity = this.userJourney[this.userJourney.length - 1];

    if (!lastActivity) {return 100;}

    const timeSinceLastActivity = (Date.now() - lastActivity.timestamp.getTime()) / 1000;

    // Risk factors
    let risk = 0;

    // Time-based risk
    if (timeSinceLastActivity > 300)
      {risk += 40;} // 5 minutes inactive
    else if (timeSinceLastActivity > 120) {risk += 20;} // 2 minutes inactive

    // Engagement-based risk
    const engagementScore = this.calculateEngagementScore();
    if (engagementScore < 20) {risk += 30;}
    else if (engagementScore < 40) {risk += 15;}

    // Funnel position risk
    const lastFunnelPosition = this.getFunnelPosition(lastActivity.step_name);
    if (lastFunnelPosition === 0)
      {risk += 30;} // Not in funnel
    else if (lastFunnelPosition < 3) {risk += 20;} // Early in funnel

    return Math.min(risk, 100);
  }

  // Reset session (for new visits)
  resetSession() {
    this.userJourney = [];
    this.sessionStartTime = new Date();

    posthog.capture('session_reset', {
      timestamp: new Date().toISOString(),
    });
  }
}

// Export singleton instance
export const enhancedAnalytics = new EnhancedAnalyticsService();

// React hooks for easy component integration
export function useEnhancedAnalytics() {
  return {
    trackConversion: (event: ConversionEvent) =>
      enhancedAnalytics.trackConversionWithExperiments(event),
    trackJourneyStep: (step: Omit<UserJourneyStep, 'timestamp' | 'experiment_context'>) =>
      enhancedAnalytics.trackJourneyStep(step),
    trackFeatureUsage: (feature: string, data?: Record<string, unknown>) =>
      enhancedAnalytics.trackFeatureUsageWithExperiments(feature, data),
    getJourneySummary: () => enhancedAnalytics.getJourneySummary(),
    trackCohort: (type: string, properties: Record<string, unknown>) =>
      enhancedAnalytics.trackCohortMetrics(type, properties),
  };
}
