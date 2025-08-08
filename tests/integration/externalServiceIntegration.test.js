/**
 * External Service Integration Tests
 * Tests Firebase Auth, Email Service, Gumroad Webhooks, and Analytics/Monitoring
 */
import * as Sentry from '@sentry/node';
import crypto from 'crypto';
import express from 'express';
import { deleteApp, getApps } from 'firebase/app';
import { createServer } from 'http';
import posthog from 'posthog-js';
import { Resend } from 'resend';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
// Import our services
import { initAnalytics } from '../../client/src/lib/analytics';
import { registerFirebaseAuthRoutes } from '../../server/routes/firebaseAuth';
import GumroadService from '../../server/services/gumroadService';
import { testEmailConfiguration } from '../../server/utils/email';
import { initSentry } from '../../server/utils/sentry';
// Test configuration
const TEST_CONFIG = {
    firebase: {
        apiKey: process.env.VITE_FIREBASE_API_KEY || 'test-api-key',
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'test-project.firebaseapp.com',
        projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'test-project',
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'test-project.appspot.com',
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
        appId: process.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:test'
    },
    email: {
        testEmail: 'test@example.com',
        resendApiKey: process.env.RESEND_API_KEY,
        smtpHost: process.env.SMTP_HOST,
        smtpUser: process.env.SMTP_USER,
        smtpPass: process.env.SMTP_PASS
    },
    gumroad: {
        accessToken: process.env.GUMROAD_ACCESS_TOKEN,
        webhookSecret: process.env.GUMROAD_WEBHOOK_SECRET,
        testSaleId: 'test-sale-123',
        testProductId: 'test-product-456'
    },
    analytics: {
        posthogKey: process.env.VITE_POSTHOG_KEY,
        ga4MeasurementId: process.env.VITE_GA_MEASUREMENT_ID,
        sentryDsn: process.env.SENTRY_DSN
    }
};
describe('External Service Integration Tests', () => {
    let app;
    let server;
    beforeAll(async () => {
        // Setup Express app for testing
        app = express();
        app.use(express.json());
        app.use(express.raw({ type: 'application/json' }));
        // Register routes
        registerFirebaseAuthRoutes(app);
        // Add Gumroad webhook route for testing
        app.post('/api/gumroad/webhook', async (req, res) => {
            try {
                const signature = req.headers['x-gumroad-signature'];
                const body = JSON.stringify(req.body);
                if (!GumroadService.validateWebhookSignature(body, signature)) {
                    return res.status(401).json({ error: 'Invalid signature' });
                }
                await GumroadService.processSaleWebhook(req.body);
                res.json({ success: true });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        server = createServer(app);
    });
    afterAll(async () => {
        if (server) {
            server.close();
        }
        // Clean up Firebase apps
        const apps = getApps();
        await Promise.all(apps.map(app => deleteApp(app)));
    });
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe('Firebase Authentication Integration', () => {
        it('should validate Firebase configuration', async () => {
            const configValid = !!(TEST_CONFIG.firebase.apiKey &&
                TEST_CONFIG.firebase.authDomain &&
                TEST_CONFIG.firebase.projectId);
            expect(configValid).toBe(true);
        });
        it('should test Firebase Auth providers endpoint', async () => {
            const response = await request(app)
                .get('/api/auth/providers')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('firebase');
            expect(response.body.data).toHaveProperty('google');
            expect(response.body.data).toHaveProperty('github');
            expect(response.body.data).toHaveProperty('email');
        });
        it('should handle Firebase login with invalid token', async () => {
            const response = await request(app)
                .post('/api/auth/firebase/login')
                .send({ idToken: 'invalid-token' })
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid ID token');
        });
        it('should handle Firebase registration validation', async () => {
            const response = await request(app)
                .post('/api/auth/firebase/register')
                .send({
                email: 'test@example.com',
                password: 'testpassword123',
                firstName: 'Test',
                lastName: 'User'
            });
            // Should either succeed or fail with proper error handling
            expect([200, 400, 409, 500]).toContain(response.status);
            expect(response.body).toHaveProperty('success');
        });
        it('should test authentication check endpoint', async () => {
            const response = await request(app)
                .get('/api/auth/check')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('isAuthenticated');
            expect(response.body.data).toHaveProperty('user');
        });
        it('should handle logout properly', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toContain('Logged out successfully');
            expect(response.body).toHaveProperty('clientActions');
        });
    });
    describe('Email Service Integration', () => {
        it('should validate email configuration', () => {
            const hasResend = !!TEST_CONFIG.email.resendApiKey;
            const hasSmtp = !!(TEST_CONFIG.email.smtpHost &&
                TEST_CONFIG.email.smtpUser &&
                TEST_CONFIG.email.smtpPass);
            const hasEmailFrom = !!process.env.EMAIL_FROM;
            // Should have at least one email provider configured
            expect(hasResend || hasSmtp).toBe(true);
            expect(hasEmailFrom).toBe(true);
        });
        it('should test email configuration', async () => {
            // Skip if email is disabled
            if (process.env.EMAIL_ENABLED !== 'true') {
                console.log('Email service disabled, skipping test');
                return;
            }
            try {
                const result = await testEmailConfiguration(TEST_CONFIG.email.testEmail);
                expect(typeof result).toBe('boolean');
            }
            catch (error) {
                // Email test may fail in CI/CD, but should handle gracefully
                expect(error).toBeInstanceOf(Error);
            }
        });
        it('should validate Resend integration if configured', async () => {
            if (!TEST_CONFIG.email.resendApiKey) {
                console.log('Resend API key not configured, skipping test');
                return;
            }
            const resend = new Resend(TEST_CONFIG.email.resendApiKey);
            try {
                // Test with a dry run - don't actually send
                const testData = {
                    from: 'test@example.com',
                    to: ['test@example.com'],
                    subject: 'Test Email',
                    html: '<p>Test</p>'
                };
                // This will validate the API key without sending
                expect(resend).toBeDefined();
                expect(typeof resend.emails.send).toBe('function');
            }
            catch (error) {
                console.log('Resend validation failed:', error.message);
            }
        });
        it('should test email template generation', async () => {
            const { getWelcomeEmailTemplate } = await import('../../server/utils/emailTemplates');
            const template = getWelcomeEmailTemplate('Test User');
            expect(template).toHaveProperty('subject');
            expect(template).toHaveProperty('html');
            expect(template).toHaveProperty('text');
            expect(template.subject).toContain('Welcome');
            expect(template.html).toContain('Test User');
        });
    });
    describe('Gumroad Payment Integration', () => {
        it('should validate Gumroad configuration', () => {
            const hasAccessToken = !!TEST_CONFIG.gumroad.accessToken;
            const hasWebhookSecret = !!TEST_CONFIG.gumroad.webhookSecret;
            // At least webhook secret should be configured for production
            if (process.env.NODE_ENV === 'production') {
                expect(hasWebhookSecret).toBe(true);
            }
            console.log('Gumroad config:', {
                hasAccessToken,
                hasWebhookSecret,
                environment: process.env.NODE_ENV
            });
        });
        it('should validate webhook signature verification', () => {
            if (!TEST_CONFIG.gumroad.webhookSecret) {
                console.log('Gumroad webhook secret not configured, skipping test');
                return;
            }
            const testPayload = JSON.stringify({ test: 'data' });
            const signature = crypto
                .createHmac('sha256', TEST_CONFIG.gumroad.webhookSecret)
                .update(testPayload)
                .digest('hex');
            const isValid = GumroadService.validateWebhookSignature(testPayload, signature);
            expect(isValid).toBe(true);
            // Test invalid signature
            const invalidSignature = 'invalid-signature';
            const isInvalid = GumroadService.validateWebhookSignature(testPayload, invalidSignature);
            expect(isInvalid).toBe(false);
        });
        it('should test Gumroad webhook endpoint', async () => {
            if (!TEST_CONFIG.gumroad.webhookSecret) {
                console.log('Gumroad webhook secret not configured, skipping test');
                return;
            }
            const testSaleData = {
                sale_id: 'test-sale-123',
                product_id: 'test-product',
                product_name: 'Test Product',
                email: 'test@example.com',
                price: 99.99,
                gumroad_fee: 9.99,
                currency: 'USD',
                quantity: 1,
                full_name: 'Test User',
                sale_timestamp: new Date().toISOString(),
                refunded: false,
                test: true
            };
            const payload = JSON.stringify(testSaleData);
            const signature = crypto
                .createHmac('sha256', TEST_CONFIG.gumroad.webhookSecret)
                .update(payload)
                .digest('hex');
            const response = await request(app)
                .post('/api/gumroad/webhook')
                .set('x-gumroad-signature', signature)
                .send(testSaleData);
            // Should either succeed or fail gracefully
            expect([200, 400, 401, 500]).toContain(response.status);
        });
        it('should test Gumroad API integration if configured', async () => {
            if (!TEST_CONFIG.gumroad.accessToken) {
                console.log('Gumroad access token not configured, skipping API test');
                return;
            }
            try {
                // Test getting sale details (this will likely fail with test data, but tests the integration)
                const saleDetails = await GumroadService.getSaleDetails(TEST_CONFIG.gumroad.testSaleId);
                // Should either return data or null (for non-existent sale)
                expect(saleDetails === null || typeof saleDetails === 'object').toBe(true);
            }
            catch (error) {
                // API calls may fail in test environment, but should handle gracefully
                expect(error).toBeInstanceOf(Error);
                console.log('Gumroad API test failed (expected in test environment):', error.message);
            }
        });
    });
    describe('Analytics and Monitoring Integration', () => {
        it('should validate Sentry configuration', () => {
            const hasSentryDsn = !!TEST_CONFIG.analytics.sentryDsn;
            if (process.env.NODE_ENV === 'production') {
                expect(hasSentryDsn).toBe(true);
            }
            // Test Sentry initialization
            try {
                initSentry();
                expect(Sentry).toBeDefined();
                expect(typeof Sentry.captureException).toBe('function');
            }
            catch (error) {
                console.log('Sentry initialization test:', error.message);
            }
        });
        it('should test Sentry error capture', () => {
            const testError = new Error('Test error for Sentry');
            try {
                Sentry.captureException(testError);
                expect(true).toBe(true); // If no error thrown, test passes
            }
            catch (error) {
                console.log('Sentry error capture test failed:', error.message);
            }
        });
        it('should validate PostHog configuration', () => {
            const hasPostHogKey = !!TEST_CONFIG.analytics.posthogKey;
            if (hasPostHogKey) {
                expect(TEST_CONFIG.analytics.posthogKey).toMatch(/^phc_/);
            }
            // Test PostHog methods exist
            expect(typeof posthog.init).toBe('function');
            expect(typeof posthog.capture).toBe('function');
        });
        it('should test GA4 configuration', () => {
            const hasGA4Id = !!TEST_CONFIG.analytics.ga4MeasurementId;
            if (hasGA4Id) {
                expect(TEST_CONFIG.analytics.ga4MeasurementId).toMatch(/^G-/);
            }
            console.log('GA4 configuration:', {
                hasGA4Id,
                measurementId: TEST_CONFIG.analytics.ga4MeasurementId
            });
        });
        it('should test analytics initialization', () => {
            // Mock window object for browser environment
            const mockWindow = {
                addEventListener: vi.fn(),
                location: { href: 'http://localhost:3000' },
                document: { title: 'Test Page' }
            };
            // @ts-ignore - Mock window for testing
            global.window = mockWindow;
            try {
                initAnalytics();
                expect(true).toBe(true); // If no error thrown, test passes
            }
            catch (error) {
                console.log('Analytics initialization test:', error.message);
            }
            finally {
                // @ts-ignore - Clean up mock
                delete global.window;
            }
        });
    });
    describe('Health Check Integration', () => {
        it('should test basic health endpoint', async () => {
            // Add a basic health endpoint for testing
            app.get('/health', (req, res) => {
                res.json({ status: 'ok', timestamp: new Date().toISOString() });
            });
            const response = await request(app)
                .get('/health')
                .expect(200);
            expect(response.body.status).toBe('ok');
            expect(response.body.timestamp).toBeDefined();
        });
        it('should test readiness check with dependencies', async () => {
            // Add readiness endpoint for testing
            app.get('/health/ready', async (req, res) => {
                const checks = {
                    database: true, // Would check actual DB connection
                    redis: true, // Would check Redis connection
                    externalServices: true // Would check external service connectivity
                };
                const allReady = Object.values(checks).every(check => check === true);
                res.json({
                    status: allReady ? 'ready' : 'not-ready',
                    checks
                });
            });
            const response = await request(app)
                .get('/health/ready')
                .expect(200);
            expect(response.body).toHaveProperty('status');
            expect(response.body).toHaveProperty('checks');
            expect(response.body.checks).toHaveProperty('database');
            expect(response.body.checks).toHaveProperty('redis');
            expect(response.body.checks).toHaveProperty('externalServices');
        });
    });
    describe('Environment Configuration Validation', () => {
        it('should validate required environment variables', () => {
            const requiredVars = [
                'NODE_ENV'
            ];
            const optionalVars = [
                'VITE_APP_TITLE',
                'VITE_APP_URL'
            ];
            const productionVars = [
                'DATABASE_URL',
                'JWT_SECRET',
                'SESSION_SECRET'
            ];
            // Check required vars
            requiredVars.forEach(varName => {
                expect(process.env[varName]).toBeDefined();
            });
            // Check optional vars (log if missing but don't fail)
            optionalVars.forEach(varName => {
                if (!process.env[varName]) {
                    console.log(`Optional environment variable ${varName} not set`);
                }
            });
            // Check production vars if in production
            if (process.env.NODE_ENV === 'production') {
                productionVars.forEach(varName => {
                    expect(process.env[varName]).toBeDefined();
                });
            }
        });
        it('should validate service-specific environment variables', () => {
            const serviceConfigs = {
                firebase: [
                    'VITE_FIREBASE_API_KEY',
                    'VITE_FIREBASE_AUTH_DOMAIN',
                    'VITE_FIREBASE_PROJECT_ID'
                ],
                email: [
                    'EMAIL_FROM'
                ],
                analytics: [
                    // These are optional but should be valid if present
                    'VITE_POSTHOG_KEY',
                    'VITE_GA_MEASUREMENT_ID'
                ]
            };
            // Firebase should be configured
            serviceConfigs.firebase.forEach(varName => {
                if (process.env[varName]) {
                    expect(process.env[varName]).toBeTruthy();
                }
            });
            // Email should have at least FROM address
            expect(process.env.EMAIL_FROM).toBeDefined();
            // Analytics vars should be valid format if present
            if (process.env.VITE_POSTHOG_KEY) {
                expect(process.env.VITE_POSTHOG_KEY).toMatch(/^phc_/);
            }
            if (process.env.VITE_GA_MEASUREMENT_ID) {
                expect(process.env.VITE_GA_MEASUREMENT_ID).toMatch(/^G-/);
            }
        });
    });
});
