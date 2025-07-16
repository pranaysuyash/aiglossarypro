/**
 * Analytics Configuration for Production
 * Handles PostHog and Google Analytics integration
 */

import { PostHog } from 'posthog-node';
import { log as logger } from '../utils/logger';

interface AnalyticsConfig {
  posthog: {
    apiKey?: string;
    host?: string;
    enabled: boolean;
  };
  googleAnalytics: {
    measurementId?: string;
    enabled: boolean;
  };
}

class AnalyticsService {
  private posthog: PostHog | null = null;
  private config: AnalyticsConfig;

  constructor() {
    this.config = {
      posthog: {
        apiKey: process.env.POSTHOG_API_KEY,
        host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
        enabled: !!(process.env.POSTHOG_API_KEY && process.env.NODE_ENV === 'production'),
      },
      googleAnalytics: {
        measurementId: process.env.VITE_GA4_MEASUREMENT_ID,
        enabled: !!(process.env.VITE_GA4_MEASUREMENT_ID && process.env.VITE_GA4_ENABLED === 'true'),
      },
    };

    this.initializePostHog();
  }

  private initializePostHog(): void {
    if (!this.config.posthog.apiKey) {
      logger.info('PostHog API key not configured - analytics disabled');
      return;
    }

    if (!this.config.posthog.enabled) {
      logger.info('PostHog disabled in development mode');
      return;
    }

    try {
      this.posthog = new PostHog(this.config.posthog.apiKey, {
        host: this.config.posthog.host,
        flushAt: process.env.NODE_ENV === 'production' ? 20 : 1,
        flushInterval: process.env.NODE_ENV === 'production' ? 10000 : 1000,
      });

      logger.info('PostHog analytics initialized', {
        host: this.config.posthog.host,
        enabled: this.config.posthog.enabled,
      });
    } catch (error) {
      logger.error('Failed to initialize PostHog:', error);
    }
  }

  /**
   * Track user event
   */
  track(
    distinctId: string,
    event: string,
    properties: Record<string, any> = {},
    options: {
      timestamp?: Date;
      sendFeatureFlags?: boolean;
    } = {}
  ): void {
    if (!this.posthog || !this.config.posthog.enabled) {
      logger.debug('Analytics disabled - event not tracked:', { distinctId, event, properties });
      return;
    }

    try {
      this.posthog.capture({
        distinctId,
        event,
        properties: {
          ...properties,
          $lib: 'ai-glossary-pro-server',
          environment: process.env.NODE_ENV,
          timestamp: options.timestamp,
        },
        timestamp: options.timestamp,
        sendFeatureFlags: options.sendFeatureFlags,
      });

      logger.debug('Event tracked:', { distinctId, event, properties });
    } catch (error) {
      logger.error('Error tracking event:', error, { distinctId, event });
    }
  }

  /**
   * Identify user with properties
   */
  identify(
    distinctId: string,
    properties: Record<string, any> = {},
    options: {
      timestamp?: Date;
    } = {}
  ): void {
    if (!this.posthog || !this.config.posthog.enabled) {
      logger.debug('Analytics disabled - user not identified:', { distinctId, properties });
      return;
    }

    try {
      this.posthog.identify({
        distinctId,
        properties: {
          ...properties,
          $lib: 'ai-glossary-pro-server',
          environment: process.env.NODE_ENV,
        },
        timestamp: options.timestamp,
      });

      logger.debug('User identified:', { distinctId, properties });
    } catch (error) {
      logger.error('Error identifying user:', error, { distinctId });
    }
  }

  /**
   * Track page view
   */
  trackPageView(distinctId: string, url: string, properties: Record<string, any> = {}): void {
    this.track(distinctId, '$pageview', {
      $current_url: url,
      ...properties,
    });
  }

  /**
   * Track business events
   */
  trackBusinessEvent(
    distinctId: string,
    event:
      | 'user_registered'
      | 'premium_purchased'
      | 'payment_completed'
      | 'search_performed'
      | 'term_viewed',
    properties: Record<string, any> = {}
  ): void {
    this.track(distinctId, event, {
      ...properties,
      business_event: true,
    });
  }

  /**
   * Track conversion events
   */
  trackConversion(
    distinctId: string,
    conversionType: 'registration' | 'premium_upgrade' | 'payment' | 'email_signup',
    value?: number,
    properties: Record<string, any> = {}
  ): void {
    this.track(distinctId, 'conversion', {
      conversion_type: conversionType,
      conversion_value: value,
      ...properties,
    });
  }

  /**
   * Track user journey milestones
   */
  trackMilestone(
    distinctId: string,
    milestone:
      | 'first_search'
      | 'first_term_view'
      | 'profile_completed'
      | 'first_bookmark'
      | 'premium_trial_started',
    properties: Record<string, any> = {}
  ): void {
    this.track(distinctId, 'milestone_reached', {
      milestone,
      ...properties,
    });
  }

  /**
   * Track performance metrics
   */
  trackPerformance(
    distinctId: string,
    metric: 'page_load_time' | 'search_response_time' | 'api_response_time',
    value: number,
    properties: Record<string, any> = {}
  ): void {
    this.track(distinctId, 'performance_metric', {
      metric_name: metric,
      metric_value: value,
      ...properties,
    });
  }

  /**
   * Track errors (non-sensitive)
   */
  trackError(
    distinctId: string,
    errorType: string,
    errorMessage: string,
    properties: Record<string, any> = {}
  ): void {
    this.track(distinctId, 'error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      ...properties,
    });
  }

  /**
   * Set user properties (for user profiles)
   */
  setUserProperties(distinctId: string, properties: Record<string, any>): void {
    if (!this.posthog || !this.config.posthog.enabled) {
      logger.debug('Analytics disabled - user properties not set:', { distinctId, properties });
      return;
    }

    try {
      this.posthog.capture({
        distinctId,
        event: '$set',
        properties,
      });

      logger.debug('User properties set:', { distinctId, properties });
    } catch (error) {
      logger.error('Error setting user properties:', error, { distinctId });
    }
  }

  /**
   * Create alias for user (link anonymous to identified user)
   */
  alias(distinctId: string, alias: string): void {
    if (!this.posthog || !this.config.posthog.enabled) {
      logger.debug('Analytics disabled - alias not created:', { distinctId, alias });
      return;
    }

    try {
      this.posthog.alias({
        distinctId,
        alias,
      });

      logger.debug('User alias created:', { distinctId, alias });
    } catch (error) {
      logger.error('Error creating alias:', error, { distinctId, alias });
    }
  }

  /**
   * Get feature flag for user
   */
  async getFeatureFlag(
    key: string,
    distinctId: string,
    defaultValue = false
  ): Promise<boolean> {
    if (!this.posthog || !this.config.posthog.enabled) {
      logger.debug('Analytics disabled - returning default feature flag:', { key, defaultValue });
      return defaultValue;
    }

    try {
      const flag = await this.posthog.getFeatureFlag(key, distinctId);
      return flag === true || flag === 'true';
    } catch (error) {
      logger.error('Error getting feature flag:', error, { key, distinctId });
      return defaultValue;
    }
  }

  /**
   * Flush analytics data (useful for serverless or before shutdown)
   */
  async flush(timeout = 3000): Promise<void> {
    if (!this.posthog) {
      return;
    }

    try {
      await this.posthog.flush();
      logger.info('Analytics data flushed successfully');
    } catch (error) {
      logger.error('Error flushing analytics data:', error);
    }
  }

  /**
   * Shutdown analytics service
   */
  async shutdown(): Promise<void> {
    if (!this.posthog) {
      return;
    }

    try {
      await this.posthog.shutdown();
      logger.info('Analytics service shutdown successfully');
    } catch (error) {
      logger.error('Error shutting down analytics service:', error);
    }
  }

  /**
   * Get analytics service status
   */
  getStatus(): {
    posthog: { enabled: boolean; configured: boolean };
    googleAnalytics: { enabled: boolean; configured: boolean };
  } {
    return {
      posthog: {
        enabled: this.config.posthog.enabled,
        configured: !!this.config.posthog.apiKey,
      },
      googleAnalytics: {
        enabled: this.config.googleAnalytics.enabled,
        configured: !!this.config.googleAnalytics.measurementId,
      },
    };
  }

  /**
   * Test analytics configuration
   */
  async testConfiguration(): Promise<{
    posthog: boolean;
    googleAnalytics: boolean;
  }> {
    const results = {
      posthog: false,
      googleAnalytics: false,
    };

    // Test PostHog
    if (this.posthog && this.config.posthog.enabled) {
      try {
        this.track('test-user', 'configuration_test', {
          test: true,
          timestamp: new Date(),
        });
        await this.flush(1000);
        results.posthog = true;
        logger.info('PostHog configuration test passed');
      } catch (error) {
        logger.error('PostHog configuration test failed:', error);
      }
    }

    // Google Analytics test (if needed)
    if (this.config.googleAnalytics.enabled) {
      results.googleAnalytics = true; // GA4 is client-side, so just check config
      logger.info('Google Analytics configuration available');
    }

    return results;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Export types for external use
export interface AnalyticsEvent {
  distinctId: string;
  event: string;
  properties?: Record<string, any>;
}
