/**
 * Analytics Configuration for Production
 * Handles PostHog and Google Analytics integration
 */
declare class AnalyticsService {
    private posthog;
    private config;
    constructor();
    private initializePostHog;
    /**
     * Track user event
     */
    track(distinctId: string, event: string, properties?: Record<string, any>, options?: {
        timestamp?: Date;
        sendFeatureFlags?: boolean;
    }): void;
    /**
     * Identify user with properties
     */
    identify(distinctId: string, properties?: Record<string, any>, _options?: {
        timestamp?: Date;
    }): void;
    /**
     * Track page view
     */
    trackPageView(distinctId: string, url: string, properties?: Record<string, any>): void;
    /**
     * Track business events
     */
    trackBusinessEvent(distinctId: string, event: 'user_registered' | 'premium_purchased' | 'payment_completed' | 'search_performed' | 'term_viewed', properties?: Record<string, any>): void;
    /**
     * Track conversion events
     */
    trackConversion(distinctId: string, conversionType: 'registration' | 'premium_upgrade' | 'payment' | 'email_signup', value?: number, properties?: Record<string, any>): void;
    /**
     * Track user journey milestones
     */
    trackMilestone(distinctId: string, milestone: 'first_search' | 'first_term_view' | 'profile_completed' | 'first_bookmark' | 'premium_trial_started', properties?: Record<string, any>): void;
    /**
     * Track performance metrics
     */
    trackPerformance(distinctId: string, metric: 'page_load_time' | 'search_response_time' | 'api_response_time', value: number, properties?: Record<string, any>): void;
    /**
     * Track errors (non-sensitive)
     */
    trackError(distinctId: string, errorType: string, errorMessage: string, properties?: Record<string, any>): void;
    /**
     * Set user properties (for user profiles)
     */
    setUserProperties(distinctId: string, properties: Record<string, any>): void;
    /**
     * Create alias for user (link anonymous to identified user)
     */
    alias(distinctId: string, alias: string): void;
    /**
     * Get feature flag for user
     */
    getFeatureFlag(key: string, distinctId: string, defaultValue?: boolean): Promise<boolean>;
    /**
     * Flush analytics data (useful for serverless or before shutdown)
     */
    flush(_timeout?: number): Promise<void>;
    /**
     * Shutdown analytics service
     */
    shutdown(): Promise<void>;
    /**
     * Get analytics service status
     */
    getStatus(): {
        posthog: {
            enabled: boolean;
            configured: boolean;
        };
        googleAnalytics: {
            enabled: boolean;
            configured: boolean;
        };
    };
    /**
     * Test analytics configuration
     */
    testConfiguration(): Promise<{
        posthog: boolean;
        googleAnalytics: boolean;
    }>;
}
export declare const analyticsService: AnalyticsService;
export interface AnalyticsEvent {
    distinctId: string;
    event: string;
    properties?: Record<string, any>;
}
export {};
