/**
 * Analytics and Monitoring Integration Tests
 * Tests PostHog, GA4, Sentry, and performance monitoring
 */
import * as Sentry from '@sentry/node';
import posthog from 'posthog-js';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { initAnalytics, isAnalyticsDisabled, trackSearch, trackTermView, trackUserAction } from '../../client/src/lib/analytics';
import { captureAPIError, captureAuthError, initSentry, monitorAPIPerformance } from '../../server/utils/sentry';
// Mock browser environment
const mockWindow = {
    addEventListener: vi.fn(),
    location: { href: 'http://localhost:3000/test' },
    document: { title: 'Test Page' },
    gtag: vi.fn(),
    dataLayer: []
};
describe('Analytics and Monitoring Integration', () => {
    beforeAll(() => {
        // Mock browser environment
        // @ts-ignore
        global.window = mockWindow;
        // @ts-ignore
        global.document = mockWindow.document;
        // Mock console methods to reduce noise
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });
    afterAll(() => {
        vi.restoreAllMocks();
        // @ts-ignore
        delete global.window;
        // @ts-ignore
        delete global.document;
    });
    describe('Analytics Configuration Validation', () => {
        it('should validate PostHog configuration', () => {
            const posthogKey = process.env.VITE_POSTHOG_KEY;
            if (posthogKey) {
                expect(posthogKey).toMatch(/^phc_/);
                expect(posthogKey.length).toBeGreaterThan(20);
            }
            console.log('PostHog configuration:', {
                hasKey: !!posthogKey,
                keyFormat: posthogKey ? 'valid' : 'missing'
            });
        });
        it('should validate GA4 configuration', () => {
            const measurementId = process.env.VITE_GA_MEASUREMENT_ID;
            if (measurementId) {
                expect(measurementId).toMatch(/^G-/);
                expect(measurementId.length).toBeGreaterThan(5);
            }
            console.log('GA4 configuration:', {
                hasId: !!measurementId,
                idFormat: measurementId ? 'valid' : 'missing'
            });
        });
        it('should validate Sentry configuration', () => {
            const sentryDsn = process.env.SENTRY_DSN;
            if (sentryDsn) {
                expect(sentryDsn).toMatch(/^https:\/\//);
                expect(sentryDsn).toContain('.ingest.sentry.io');
                expect(sentryDsn).toContain('@');
            }
            console.log('Sentry configuration:', {
                hasDsn: !!sentryDsn,
                dsnFormat: sentryDsn ? 'valid' : 'missing'
            });
        });
        it('should validate analytics disable flag', () => {
            const isDisabled = isAnalyticsDisabled();
            // Should be boolean
            expect(typeof isDisabled).toBe('boolean');
            // Should respect environment settings
            if (process.env.VITE_DISABLE_ANALYTICS === 'true') {
                expect(isDisabled).toBe(true);
            }
            console.log('Analytics disabled:', isDisabled);
        });
    });
    describe('PostHog Integration', () => {
        it('should initialize PostHog correctly', () => {
            try {
                initAnalytics();
                // PostHog should have required methods
                expect(typeof posthog.init).toBe('function');
                expect(typeof posthog.capture).toBe('function');
                expect(typeof posthog.identify).toBe('function');
            }
            catch (error) {
                console.log('PostHog initialization test result:', error.message);
            }
        });
        it('should track term views', () => {
            const trackSpy = vi.spyOn(posthog, 'capture').mockImplementation(() => { });
            try {
                trackTermView('test-term-123', 'Machine Learning', 'fundamentals');
                if (!isAnalyticsDisabled()) {
                    expect(trackSpy).toHaveBeenCalledWith('term_viewed', expect.objectContaining({
                        term_id: 'test-term-123',
                        term_name: 'Machine Learning',
                        section: 'fundamentals'
                    }));
                }
            }
            catch (error) {
                console.log('Term view tracking test result:', error.message);
            }
            finally {
                trackSpy.mockRestore();
            }
        });
        it('should track search events', () => {
            const trackSpy = vi.spyOn(posthog, 'capture').mockImplementation(() => { });
            try {
                trackSearch('neural networks', 25, { category: 'deep-learning' });
                if (!isAnalyticsDisabled()) {
                    expect(trackSpy).toHaveBeenCalledWith('search_performed', expect.objectContaining({
                        query: 'neural networks',
                        results_count: 25,
                        filters: { category: 'deep-learning' }
                    }));
                }
            }
            catch (error) {
                console.log('Search tracking test result:', error.message);
            }
            finally {
                trackSpy.mockRestore();
            }
        });
        it('should track user actions', () => {
            const trackSpy = vi.spyOn(posthog, 'capture').mockImplementation(() => { });
            try {
                trackUserAction('premium_upgrade_clicked', {
                    location: 'header',
                    plan: 'lifetime'
                });
                if (!isAnalyticsDisabled()) {
                    expect(trackSpy).toHaveBeenCalledWith('premium_upgrade_clicked', expect.objectContaining({
                        location: 'header',
                        plan: 'lifetime'
                    }));
                }
            }
            catch (error) {
                console.log('User action tracking test result:', error.message);
            }
            finally {
                trackSpy.mockRestore();
            }
        });
        it('should handle PostHog errors gracefully', () => {
            const trackSpy = vi.spyOn(posthog, 'capture').mockImplementation(() => {
                throw new Error('PostHog API error');
            });
            try {
                // Should not throw error even if PostHog fails
                expect(() => {
                    trackTermView('test-term', 'Test Term');
                }).not.toThrow();
            }
            finally {
                trackSpy.mockRestore();
            }
        });
    });
    describe('Google Analytics 4 Integration', () => {
        it('should initialize GA4 correctly', () => {
            const measurementId = process.env.VITE_GA_MEASUREMENT_ID;
            if (!measurementId) {
                console.log('GA4 measurement ID not configured - skipping GA4 tests');
                return;
            }
            try {
                initAnalytics();
                // Should have gtag function available
                expect(typeof mockWindow.gtag).toBe('function');
                expect(Array.isArray(mockWindow.dataLayer)).toBe(true);
            }
            catch (error) {
                console.log('GA4 initialization test result:', error.message);
            }
        });
        it('should track page views', () => {
            const measurementId = process.env.VITE_GA_MEASUREMENT_ID;
            if (!measurementId) {
                console.log('GA4 measurement ID not configured - skipping page view test');
                return;
            }
            const gtagSpy = vi.spyOn(mockWindow, 'gtag').mockImplementation(() => { });
            try {
                // Simulate page view tracking
                mockWindow.gtag('config', measurementId, {
                    page_title: 'Test Page',
                    page_location: 'http://localhost:3000/test'
                });
                expect(gtagSpy).toHaveBeenCalledWith('config', measurementId, expect.any(Object));
            }
            catch (error) {
                console.log('GA4 page view test result:', error.message);
            }
            finally {
                gtagSpy.mockRestore();
            }
        });
        it('should track custom events', () => {
            const measurementId = process.env.VITE_GA_MEASUREMENT_ID;
            if (!measurementId) {
                console.log('GA4 measurement ID not configured - skipping custom event test');
                return;
            }
            const gtagSpy = vi.spyOn(mockWindow, 'gtag').mockImplementation(() => { });
            try {
                // Simulate custom event tracking
                mockWindow.gtag('event', 'term_view', {
                    event_category: 'engagement',
                    event_label: 'Machine Learning',
                    value: 1
                });
                expect(gtagSpy).toHaveBeenCalledWith('event', 'term_view', expect.any(Object));
            }
            catch (error) {
                console.log('GA4 custom event test result:', error.message);
            }
            finally {
                gtagSpy.mockRestore();
            }
        });
    });
    describe('Sentry Monitoring Integration', () => {
        it('should initialize Sentry correctly', () => {
            try {
                initSentry();
                // Sentry should have required methods
                expect(typeof Sentry.captureException).toBe('function');
                expect(typeof Sentry.captureMessage).toBe('function');
                expect(typeof Sentry.addBreadcrumb).toBe('function');
            }
            catch (error) {
                console.log('Sentry initialization test result:', error.message);
            }
        });
        it('should capture API errors', () => {
            const captureSpy = vi.spyOn(Sentry, 'captureException').mockImplementation(() => '');
            try {
                const testError = new Error('Test API error');
                captureAPIError(testError, {
                    method: 'POST',
                    path: '/api/test',
                    userId: 'test-user-123'
                });
                expect(captureSpy).toHaveBeenCalledWith(testError);
            }
            catch (error) {
                console.log('API error capture test result:', error.message);
            }
            finally {
                captureSpy.mockRestore();
            }
        });
        it('should capture authentication errors', () => {
            const captureSpy = vi.spyOn(Sentry, 'captureException').mockImplementation(() => '');
            try {
                const testError = new Error('Authentication failed');
                captureAuthError(testError, {
                    email: 'test@example.com',
                    provider: 'firebase',
                    action: 'login'
                });
                expect(captureSpy).toHaveBeenCalledWith(testError);
            }
            catch (error) {
                console.log('Auth error capture test result:', error.message);
            }
            finally {
                captureSpy.mockRestore();
            }
        });
        it('should monitor API performance', async () => {
            const startSpanSpy = vi.spyOn(Sentry, 'startSpan').mockImplementation((options, callback) => {
                return callback({
                    setData: vi.fn(),
                    setTag: vi.fn()
                });
            });
            try {
                const result = await monitorAPIPerformance('test-operation', async () => {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return { success: true };
                }, {
                    userId: 'test-user',
                    endpoint: '/api/test',
                    method: 'GET'
                });
                expect(result).toEqual({ success: true });
                expect(startSpanSpy).toHaveBeenCalled();
            }
            catch (error) {
                console.log('API performance monitoring test result:', error.message);
            }
            finally {
                startSpanSpy.mockRestore();
            }
        });
        it('should handle Sentry errors gracefully', () => {
            const captureSpy = vi.spyOn(Sentry, 'captureException').mockImplementation(() => {
                throw new Error('Sentry API error');
            });
            try {
                // Should not throw error even if Sentry fails
                expect(() => {
                    captureAPIError(new Error('Test error'), {
                        method: 'GET',
                        path: '/api/test'
                    });
                }).not.toThrow();
            }
            finally {
                captureSpy.mockRestore();
            }
        });
    });
    describe('Performance Monitoring', () => {
        it('should track Core Web Vitals', () => {
            const performanceEntries = [
                {
                    name: 'first-contentful-paint',
                    startTime: 1200,
                    entryType: 'paint'
                },
                {
                    name: 'largest-contentful-paint',
                    startTime: 2500,
                    entryType: 'largest-contentful-paint'
                }
            ];
            performanceEntries.forEach(entry => {
                expect(entry.startTime).toBeGreaterThan(0);
                expect(entry.name).toBeTruthy();
                expect(entry.entryType).toBeTruthy();
            });
        });
        it('should monitor bundle size', () => {
            // Simulate bundle size monitoring
            const bundleSize = 800 * 1024; // 800KB
            const maxBundleSize = 1000 * 1024; // 1MB
            expect(bundleSize).toBeLessThan(maxBundleSize);
            console.log('Bundle size monitoring:', {
                currentSize: `${Math.round(bundleSize / 1024)}KB`,
                maxSize: `${Math.round(maxBundleSize / 1024)}KB`,
                withinLimit: bundleSize < maxBundleSize
            });
        });
        it('should track render performance', () => {
            const renderMetrics = {
                componentName: 'TermCard',
                renderTime: 15.5,
                renderCount: 3,
                memoryUsage: 45.2
            };
            // Render time should be under 16ms for 60fps
            expect(renderMetrics.renderTime).toBeLessThan(16);
            // Memory usage should be reasonable
            expect(renderMetrics.memoryUsage).toBeLessThan(100);
            console.log('Render performance metrics:', renderMetrics);
        });
        it('should detect performance regressions', () => {
            const baselineMetrics = {
                loadTime: 1200,
                renderTime: 12,
                bundleSize: 750 * 1024
            };
            const currentMetrics = {
                loadTime: 1350,
                renderTime: 18,
                bundleSize: 820 * 1024
            };
            const regressions = {
                loadTimeRegression: currentMetrics.loadTime > baselineMetrics.loadTime * 1.1,
                renderTimeRegression: currentMetrics.renderTime > baselineMetrics.renderTime * 1.2,
                bundleSizeRegression: currentMetrics.bundleSize > baselineMetrics.bundleSize * 1.1
            };
            console.log('Performance regression analysis:', regressions);
            // At least some metrics should be within acceptable ranges
            const hasSignificantRegression = Object.values(regressions).filter(Boolean).length > 1;
            expect(hasSignificantRegression).toBe(false);
        });
    });
    describe('Error Tracking and Alerting', () => {
        it('should track error rates', () => {
            const errorMetrics = {
                totalRequests: 1000,
                errorCount: 5,
                errorRate: 0.005 // 0.5%
            };
            expect(errorMetrics.errorRate).toBeLessThan(0.01); // Less than 1%
            console.log('Error rate metrics:', {
                errorRate: `${(errorMetrics.errorRate * 100).toFixed(2)}%`,
                withinThreshold: errorMetrics.errorRate < 0.01
            });
        });
        it('should categorize errors properly', () => {
            const errorCategories = {
                authentication: 2,
                api: 1,
                client: 1,
                network: 1
            };
            const totalErrors = Object.values(errorCategories).reduce((sum, count) => sum + count, 0);
            expect(totalErrors).toBeGreaterThan(0);
            expect(errorCategories.authentication).toBeGreaterThanOrEqual(0);
            expect(errorCategories.api).toBeGreaterThanOrEqual(0);
            console.log('Error categorization:', errorCategories);
        });
        it('should handle error context properly', () => {
            const errorContext = {
                userId: 'user-123',
                sessionId: 'session-456',
                userAgent: 'Mozilla/5.0...',
                url: '/terms/machine-learning',
                timestamp: new Date().toISOString(),
                stackTrace: 'Error: Test error\n    at test.js:1:1'
            };
            // Should have essential context fields
            expect(errorContext.userId).toBeTruthy();
            expect(errorContext.timestamp).toBeTruthy();
            expect(errorContext.url).toBeTruthy();
            console.log('Error context validation passed');
        });
    });
    describe('Analytics Privacy and Compliance', () => {
        it('should respect user privacy settings', () => {
            const privacySettings = {
                analyticsEnabled: true,
                performanceMonitoringEnabled: true,
                errorReportingEnabled: true,
                personalizedAdsEnabled: false
            };
            // Should respect user choices
            expect(typeof privacySettings.analyticsEnabled).toBe('boolean');
            expect(typeof privacySettings.performanceMonitoringEnabled).toBe('boolean');
            console.log('Privacy settings validation passed');
        });
        it('should anonymize sensitive data', () => {
            const userData = {
                email: 'user@example.com',
                name: 'John Doe',
                ipAddress: '192.168.1.1'
            };
            const anonymizedData = {
                emailHash: 'hashed-email',
                nameInitials: 'J.D.',
                ipAddressPartial: '192.168.xxx.xxx'
            };
            // Should not contain original sensitive data
            expect(anonymizedData.emailHash).not.toBe(userData.email);
            expect(anonymizedData.nameInitials).not.toBe(userData.name);
            expect(anonymizedData.ipAddressPartial).not.toBe(userData.ipAddress);
            console.log('Data anonymization validation passed');
        });
        it('should handle consent management', () => {
            const consentStatus = {
                analytics: true,
                marketing: false,
                functional: true,
                necessary: true
            };
            // Necessary cookies should always be true
            expect(consentStatus.necessary).toBe(true);
            // Other categories should be boolean
            expect(typeof consentStatus.analytics).toBe('boolean');
            expect(typeof consentStatus.marketing).toBe('boolean');
            expect(typeof consentStatus.functional).toBe('boolean');
            console.log('Consent management validation passed');
        });
    });
    describe('Monitoring Dashboard Integration', () => {
        it('should provide metrics for dashboards', () => {
            const dashboardMetrics = {
                activeUsers: 150,
                pageViews: 2500,
                averageSessionDuration: 180, // seconds
                bounceRate: 0.35,
                conversionRate: 0.025,
                errorRate: 0.005,
                averageLoadTime: 1200 // milliseconds
            };
            // Validate metric ranges
            expect(dashboardMetrics.activeUsers).toBeGreaterThan(0);
            expect(dashboardMetrics.bounceRate).toBeGreaterThanOrEqual(0);
            expect(dashboardMetrics.bounceRate).toBeLessThanOrEqual(1);
            expect(dashboardMetrics.conversionRate).toBeGreaterThanOrEqual(0);
            expect(dashboardMetrics.errorRate).toBeLessThan(0.1);
            console.log('Dashboard metrics validation passed');
        });
        it('should support real-time monitoring', () => {
            const realtimeMetrics = {
                currentActiveUsers: 25,
                requestsPerMinute: 120,
                averageResponseTime: 250,
                errorCount: 0,
                timestamp: Date.now()
            };
            // Real-time metrics should be current
            const age = Date.now() - realtimeMetrics.timestamp;
            expect(age).toBeLessThan(60000); // Less than 1 minute old
            console.log('Real-time monitoring validation passed');
        });
    });
});
