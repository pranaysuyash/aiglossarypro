"use strict";
/**
 * Analytics Configuration for Production
 * Handles PostHog and Google Analytics integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = void 0;
const posthog_node_1 = require("posthog-node");
const logger_1 = require("../utils/logger");
class AnalyticsService {
    constructor() {
        this.posthog = null;
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
    initializePostHog() {
        if (!this.config.posthog.apiKey) {
            logger_1.log.info('PostHog API key not configured - analytics disabled');
            return;
        }
        if (!this.config.posthog.enabled) {
            logger_1.log.info('PostHog disabled in development mode');
            return;
        }
        try {
            this.posthog = new posthog_node_1.PostHog(this.config.posthog.apiKey, {
                host: this.config.posthog.host,
                flushAt: process.env.NODE_ENV === 'production' ? 20 : 1,
                flushInterval: process.env.NODE_ENV === 'production' ? 10000 : 1000,
            });
            logger_1.log.info('PostHog analytics initialized', {
                host: this.config.posthog.host,
                enabled: this.config.posthog.enabled,
            });
        }
        catch (error) {
            logger_1.log.error('Failed to initialize PostHog:', error);
        }
    }
    /**
     * Track user event
     */
    track(distinctId, event, properties = {}, options = {}) {
        if (!this.posthog || !this.config.posthog.enabled) {
            logger_1.log.debug('Analytics disabled - event not tracked:', { distinctId, event, properties });
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
                    // timestamp: options.timestamp, // Not supported
                },
                // timestamp: options.timestamp, // Not supported
                sendFeatureFlags: options.sendFeatureFlags,
            });
            logger_1.log.debug('Event tracked:', { distinctId, event, properties });
        }
        catch (error) {
            logger_1.log.error('Error tracking event:', { error: error, ...{ distinctId, event } });
        }
    }
    /**
     * Identify user with properties
     */
    identify(distinctId, properties = {}, _options = {}) {
        if (!this.posthog || !this.config.posthog.enabled) {
            logger_1.log.debug('Analytics disabled - user not identified:', { distinctId, properties });
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
                // timestamp: options.timestamp, // Not supported
            });
            logger_1.log.debug('User identified:', { distinctId, properties });
        }
        catch (error) {
            logger_1.log.error('Error identifying user:', { error: error, ...{ distinctId } });
        }
    }
    /**
     * Track page view
     */
    trackPageView(distinctId, url, properties = {}) {
        this.track(distinctId, '$pageview', {
            $current_url: url,
            ...properties,
        });
    }
    /**
     * Track business events
     */
    trackBusinessEvent(distinctId, event, properties = {}) {
        this.track(distinctId, event, {
            ...properties,
            business_event: true,
        });
    }
    /**
     * Track conversion events
     */
    trackConversion(distinctId, conversionType, value, properties = {}) {
        this.track(distinctId, 'conversion', {
            conversion_type: conversionType,
            conversion_value: value,
            ...properties,
        });
    }
    /**
     * Track user journey milestones
     */
    trackMilestone(distinctId, milestone, properties = {}) {
        this.track(distinctId, 'milestone_reached', {
            milestone,
            ...properties,
        });
    }
    /**
     * Track performance metrics
     */
    trackPerformance(distinctId, metric, value, properties = {}) {
        this.track(distinctId, 'performance_metric', {
            metric_name: metric,
            metric_value: value,
            ...properties,
        });
    }
    /**
     * Track errors (non-sensitive)
     */
    trackError(distinctId, errorType, errorMessage, properties = {}) {
        this.track(distinctId, 'error_occurred', {
            error_type: errorType,
            error_message: errorMessage,
            ...properties,
        });
    }
    /**
     * Set user properties (for user profiles)
     */
    setUserProperties(distinctId, properties) {
        if (!this.posthog || !this.config.posthog.enabled) {
            logger_1.log.debug('Analytics disabled - user properties not set:', { distinctId, properties });
            return;
        }
        try {
            this.posthog.capture({
                distinctId,
                event: '$set',
                properties,
            });
            logger_1.log.debug('User properties set:', { distinctId, properties });
        }
        catch (error) {
            logger_1.log.error('Error setting user properties:', { error: error, ...{ distinctId } });
        }
    }
    /**
     * Create alias for user (link anonymous to identified user)
     */
    alias(distinctId, alias) {
        if (!this.posthog || !this.config.posthog.enabled) {
            logger_1.log.debug('Analytics disabled - alias not created:', { distinctId, alias });
            return;
        }
        try {
            this.posthog.alias({
                distinctId,
                alias,
            });
            logger_1.log.debug('User alias created:', { distinctId, alias });
        }
        catch (error) {
            logger_1.log.error('Error creating alias:', { error: error, ...{ distinctId, alias } });
        }
    }
    /**
     * Get feature flag for user
     */
    async getFeatureFlag(key, distinctId, defaultValue = false) {
        if (!this.posthog || !this.config.posthog.enabled) {
            logger_1.log.debug('Analytics disabled - returning default feature flag:', { key, defaultValue });
            return defaultValue;
        }
        try {
            const flag = await this.posthog.getFeatureFlag(key, distinctId);
            return flag === true || flag === 'true';
        }
        catch (error) {
            logger_1.log.error('Error getting feature flag:', { error: error, ...{ key, distinctId } });
            return defaultValue;
        }
    }
    /**
     * Flush analytics data (useful for serverless or before shutdown)
     */
    async flush(_timeout = 3000) {
        if (!this.posthog) {
            return;
        }
        try {
            await this.posthog.flush();
            logger_1.log.info('Analytics data flushed successfully');
        }
        catch (error) {
            logger_1.log.error('Error flushing analytics data:', error);
        }
    }
    /**
     * Shutdown analytics service
     */
    async shutdown() {
        if (!this.posthog) {
            return;
        }
        try {
            await this.posthog.shutdown();
            logger_1.log.info('Analytics service shutdown successfully');
        }
        catch (error) {
            logger_1.log.error('Error shutting down analytics service:', error);
        }
    }
    /**
     * Get analytics service status
     */
    getStatus() {
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
    async testConfiguration() {
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
                logger_1.log.info('PostHog configuration test passed');
            }
            catch (error) {
                logger_1.log.error('PostHog configuration test failed:', error);
            }
        }
        // Google Analytics test (if needed)
        if (this.config.googleAnalytics.enabled) {
            results.googleAnalytics = true; // GA4 is client-side, so just check config
            logger_1.log.info('Google Analytics configuration available');
        }
        return results;
    }
}
// Export singleton instance
exports.analyticsService = new AnalyticsService();
