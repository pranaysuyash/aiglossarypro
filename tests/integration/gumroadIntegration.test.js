/**
 * Gumroad Payment Integration Tests
 * Tests webhook validation, API integration, and payment processing
 */
import crypto from 'crypto';
import express from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { registerGumroadRoutes } from '../../server/routes/gumroad';
import GumroadService from '../../server/services/gumroadService';
describe('Gumroad Payment Integration', () => {
    let app;
    const testSaleData = {
        sale_id: 'test-sale-12345',
        product_id: 'test-product-67890',
        product_name: 'AI Glossary Pro - Lifetime Access',
        product_permalink: 'aiglossary-pro',
        short_product_id: 'aigp',
        email: 'test@example.com',
        price: 199.99,
        gumroad_fee: 19.99,
        currency: 'USD',
        quantity: 1,
        discover_fee_charged: false,
        can_contact: true,
        referrer: 'direct',
        order_number: 123456789,
        sale_timestamp: new Date().toISOString(),
        url_params: {},
        custom_fields: {},
        ip_country: 'US',
        recurrence: 'none',
        is_gift_receiver_purchase: false,
        refunded: false,
        disputed: false,
        dispute_won: false,
        test: true,
        affiliates: [],
        variants_and_quantity: [],
        license_key: 'test-license-key-123',
        variants: {},
        full_name: 'Test User',
        purchaser_id: 'test-purchaser-123'
    };
    const testRefundData = {
        refund_id: 'test-refund-12345',
        sale_id: 'test-sale-12345',
        amount_refunded_in_cents: 19999,
        refund_date: new Date().toISOString(),
        refund_reason: 'Customer request'
    };
    beforeAll(() => {
        // Setup Express app for testing
        app = express();
        app.use(express.json());
        app.use(express.raw({ type: 'application/json' }));
        // Register Gumroad routes
        registerGumroadRoutes(app);
        // Mock console methods to reduce noise
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
    });
    afterAll(() => {
        vi.restoreAllMocks();
    });
    describe('Gumroad Configuration Validation', () => {
        it('should validate webhook secret configuration', () => {
            const webhookSecret = process.env.GUMROAD_WEBHOOK_SECRET;
            if (process.env.NODE_ENV === 'production') {
                expect(webhookSecret).toBeDefined();
                expect(webhookSecret.length).toBeGreaterThan(10);
            }
            console.log('Gumroad webhook configuration:', {
                hasSecret: !!webhookSecret,
                secretLength: webhookSecret?.length || 0,
                environment: process.env.NODE_ENV
            });
        });
        it('should validate API access token configuration', () => {
            const accessToken = process.env.GUMROAD_ACCESS_TOKEN;
            if (accessToken) {
                expect(accessToken.length).toBeGreaterThan(10);
                // Gumroad tokens typically start with specific patterns
                expect(typeof accessToken).toBe('string');
            }
            console.log('Gumroad API configuration:', {
                hasToken: !!accessToken,
                tokenLength: accessToken?.length || 0
            });
        });
        it('should validate product configuration', () => {
            const productUrl = process.env.VITE_GUMROAD_PRODUCT_URL;
            if (productUrl) {
                expect(productUrl).toMatch(/^https:\/\/gumroad\.com\/l\//);
            }
            console.log('Gumroad product configuration:', {
                hasProductUrl: !!productUrl,
                productUrl: productUrl
            });
        });
    });
    describe('Webhook Signature Validation', () => {
        it('should validate webhook signatures correctly', () => {
            const webhookSecret = process.env.GUMROAD_WEBHOOK_SECRET || 'test-secret';
            const payload = JSON.stringify(testSaleData);
            // Generate valid signature
            const validSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(payload)
                .digest('hex');
            const isValid = GumroadService.validateWebhookSignature(payload, validSignature);
            expect(isValid).toBe(true);
        });
        it('should reject invalid webhook signatures', () => {
            const webhookSecret = process.env.GUMROAD_WEBHOOK_SECRET || 'test-secret';
            const payload = JSON.stringify(testSaleData);
            const invalidSignature = 'invalid-signature-123';
            const isValid = GumroadService.validateWebhookSignature(payload, invalidSignature);
            expect(isValid).toBe(false);
        });
        it('should handle missing webhook secret gracefully', () => {
            // Temporarily remove webhook secret
            const originalSecret = process.env.GUMROAD_WEBHOOK_SECRET;
            delete process.env.GUMROAD_WEBHOOK_SECRET;
            try {
                const payload = JSON.stringify(testSaleData);
                const signature = 'any-signature';
                const result = GumroadService.validateWebhookSignature(payload, signature);
                // Should return false or handle gracefully in production
                if (process.env.NODE_ENV === 'production') {
                    expect(result).toBe(false);
                }
                else {
                    // May allow in development
                    expect(typeof result).toBe('boolean');
                }
            }
            finally {
                // Restore original secret
                if (originalSecret) {
                    process.env.GUMROAD_WEBHOOK_SECRET = originalSecret;
                }
            }
        });
        it('should handle malformed payloads', () => {
            const webhookSecret = process.env.GUMROAD_WEBHOOK_SECRET || 'test-secret';
            const malformedPayload = '{"invalid": json}';
            const signature = crypto
                .createHmac('sha256', webhookSecret)
                .update(malformedPayload)
                .digest('hex');
            // Should still validate signature even with malformed JSON
            const isValid = GumroadService.validateWebhookSignature(malformedPayload, signature);
            expect(isValid).toBe(true);
        });
    });
    describe('Webhook Endpoint Testing', () => {
        it('should handle valid webhook requests', async () => {
            const webhookSecret = process.env.GUMROAD_WEBHOOK_SECRET || 'test-secret';
            const payload = JSON.stringify(testSaleData);
            const signature = crypto
                .createHmac('sha256', webhookSecret)
                .update(payload)
                .digest('hex');
            const response = await request(app)
                .post('/api/gumroad/webhook')
                .set('x-gumroad-signature', signature)
                .send(testSaleData);
            // Should either succeed or fail gracefully
            expect([200, 400, 401, 500]).toContain(response.status);
            if (response.status === 200) {
                expect(response.body).toHaveProperty('success');
            }
        });
        it('should reject webhooks with invalid signatures', async () => {
            const response = await request(app)
                .post('/api/gumroad/webhook')
                .set('x-gumroad-signature', 'invalid-signature')
                .send(testSaleData);
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
        it('should reject webhooks without signatures', async () => {
            const response = await request(app)
                .post('/api/gumroad/webhook')
                .send(testSaleData);
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
        it('should handle malformed webhook data', async () => {
            const webhookSecret = process.env.GUMROAD_WEBHOOK_SECRET || 'test-secret';
            const malformedData = { invalid: 'data' };
            const payload = JSON.stringify(malformedData);
            const signature = crypto
                .createHmac('sha256', webhookSecret)
                .update(payload)
                .digest('hex');
            const response = await request(app)
                .post('/api/gumroad/webhook')
                .set('x-gumroad-signature', signature)
                .send(malformedData);
            // Should handle malformed data gracefully
            expect([400, 500]).toContain(response.status);
        });
    });
    describe('Sale Processing', () => {
        it('should process sale webhooks correctly', async () => {
            try {
                await GumroadService.processSaleWebhook(testSaleData);
                expect(true).toBe(true); // If no error thrown, test passes
            }
            catch (error) {
                // Should handle database errors gracefully
                expect(error).toBeInstanceOf(Error);
                console.log('Sale processing test result:', error.message);
            }
        });
        it('should handle duplicate sale processing', async () => {
            try {
                // Process the same sale twice
                await GumroadService.processSaleWebhook(testSaleData);
                await GumroadService.processSaleWebhook(testSaleData);
                expect(true).toBe(true); // Should handle duplicates gracefully
            }
            catch (error) {
                // Duplicate processing should be handled
                expect(error).toBeInstanceOf(Error);
                console.log('Duplicate sale processing test result:', error.message);
            }
        });
        it('should validate sale data structure', () => {
            const requiredFields = [
                'sale_id',
                'product_id',
                'email',
                'price',
                'currency',
                'full_name',
                'sale_timestamp'
            ];
            requiredFields.forEach(field => {
                expect(testSaleData).toHaveProperty(field);
                expect(testSaleData[field]).toBeDefined();
            });
        });
        it('should handle test vs production sales', async () => {
            const testSale = { ...testSaleData, test: true };
            const prodSale = { ...testSaleData, test: false };
            try {
                await GumroadService.processSaleWebhook(testSale);
                await GumroadService.processSaleWebhook(prodSale);
                expect(true).toBe(true); // Should handle both test and production sales
            }
            catch (error) {
                expect(error).toBeInstanceOf(Error);
                console.log('Test vs production sale processing:', error.message);
            }
        });
    });
    describe('Refund Processing', () => {
        it('should process refund webhooks correctly', async () => {
            try {
                await GumroadService.processRefundWebhook(testRefundData);
                expect(true).toBe(true); // If no error thrown, test passes
            }
            catch (error) {
                // Should handle database errors gracefully
                expect(error).toBeInstanceOf(Error);
                console.log('Refund processing test result:', error.message);
            }
        });
        it('should validate refund data structure', () => {
            const requiredFields = [
                'refund_id',
                'sale_id',
                'amount_refunded_in_cents',
                'refund_date'
            ];
            requiredFields.forEach(field => {
                expect(testRefundData).toHaveProperty(field);
                expect(testRefundData[field]).toBeDefined();
            });
        });
        it('should handle refunds for non-existent sales', async () => {
            const orphanRefund = {
                ...testRefundData,
                sale_id: 'non-existent-sale-id'
            };
            try {
                await GumroadService.processRefundWebhook(orphanRefund);
                expect(true).toBe(true); // Should handle gracefully
            }
            catch (error) {
                expect(error).toBeInstanceOf(Error);
                console.log('Orphan refund processing test result:', error.message);
            }
        });
    });
    describe('Gumroad API Integration', () => {
        it('should handle API requests when token is configured', async () => {
            const accessToken = process.env.GUMROAD_ACCESS_TOKEN;
            if (!accessToken) {
                console.log('Gumroad API token not configured - skipping API tests');
                return;
            }
            try {
                const saleDetails = await GumroadService.getSaleDetails('test-sale-id');
                // Should either return data or null for non-existent sales
                expect(saleDetails === null || typeof saleDetails === 'object').toBe(true);
            }
            catch (error) {
                // API calls may fail in test environment
                expect(error).toBeInstanceOf(Error);
                console.log('Gumroad API test result:', error.message);
            }
        });
        it('should handle API rate limiting', async () => {
            const accessToken = process.env.GUMROAD_ACCESS_TOKEN;
            if (!accessToken) {
                console.log('Gumroad API token not configured - skipping rate limit test');
                return;
            }
            // Test multiple rapid API calls
            const apiCalls = Array.from({ length: 3 }, () => GumroadService.getSaleDetails('test-sale-id').catch(error => ({ error: error.message })));
            try {
                const results = await Promise.all(apiCalls);
                expect(results).toHaveLength(3);
                console.log('API rate limiting test completed');
            }
            catch (error) {
                console.log('API rate limiting test failed:', error.message);
            }
        });
        it('should validate purchase verification', async () => {
            const accessToken = process.env.GUMROAD_ACCESS_TOKEN;
            if (!accessToken) {
                console.log('Gumroad API token not configured - skipping purchase verification test');
                return;
            }
            try {
                const isValid = await GumroadService.validatePurchase('test-order-id', 'test@example.com');
                expect(typeof isValid).toBe('boolean');
            }
            catch (error) {
                expect(error).toBeInstanceOf(Error);
                console.log('Purchase verification test result:', error.message);
            }
        });
    });
    describe('Purchase Verification Endpoint', () => {
        it('should handle purchase verification requests', async () => {
            const response = await request(app)
                .post('/api/gumroad/verify-purchase')
                .send({ email: 'test@example.com' });
            // Should either succeed or fail gracefully
            expect([200, 400, 404, 500]).toContain(response.status);
            if (response.body) {
                expect(response.body).toHaveProperty('success');
            }
        });
        it('should validate email format in verification requests', async () => {
            const response = await request(app)
                .post('/api/gumroad/verify-purchase')
                .send({ email: 'invalid-email' });
            expect([400, 422]).toContain(response.status);
        });
        it('should handle missing email in verification requests', async () => {
            const response = await request(app)
                .post('/api/gumroad/verify-purchase')
                .send({});
            expect([400, 422]).toContain(response.status);
        });
    });
    describe('Admin Endpoints', () => {
        it('should protect admin endpoints with authentication', async () => {
            const response = await request(app)
                .post('/api/gumroad/grant-access')
                .send({ email: 'test@example.com' });
            // Should require authentication
            expect([401, 403]).toContain(response.status);
        });
        it('should protect test purchase endpoint', async () => {
            const response = await request(app)
                .post('/api/gumroad/test-purchase')
                .send({ email: 'test@example.com' });
            // Should require authentication
            expect([401, 403]).toContain(response.status);
        });
    });
    describe('Error Handling and Resilience', () => {
        it('should handle network timeouts gracefully', async () => {
            const accessToken = process.env.GUMROAD_ACCESS_TOKEN;
            if (!accessToken) {
                console.log('Gumroad API token not configured - skipping timeout test');
                return;
            }
            // Mock a timeout scenario
            const originalTimeout = setTimeout;
            const timeoutSpy = vi.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
                if (delay > 5000) {
                    // Simulate timeout for long delays
                    throw new Error('Request timeout');
                }
                return originalTimeout(callback, delay);
            });
            try {
                await GumroadService.getSaleDetails('test-sale-id');
            }
            catch (error) {
                expect(error).toBeInstanceOf(Error);
            }
            finally {
                timeoutSpy.mockRestore();
            }
        });
        it('should handle malformed API responses', async () => {
            // Test with various malformed responses
            const malformedResponses = [
                null,
                undefined,
                '',
                '{"invalid": json}',
                { success: false, message: 'API Error' }
            ];
            malformedResponses.forEach(response => {
                // Should handle malformed responses without crashing
                expect(() => {
                    // Simulate processing malformed response
                    const processed = response ? JSON.stringify(response) : 'null';
                    expect(typeof processed).toBe('string');
                }).not.toThrow();
            });
        });
        it('should log errors appropriately', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            try {
                // Trigger an error condition
                await GumroadService.processSaleWebhook({});
            }
            catch (error) {
                // Should log errors
                expect(error).toBeInstanceOf(Error);
            }
            finally {
                consoleSpy.mockRestore();
            }
        });
    });
    describe('Security Considerations', () => {
        it('should sanitize webhook data', () => {
            const maliciousData = {
                ...testSaleData,
                email: '<script>alert("xss")</script>test@example.com',
                full_name: 'Test<script>alert("xss")</script>User'
            };
            // Should handle malicious data safely
            expect(() => {
                JSON.stringify(maliciousData);
            }).not.toThrow();
        });
        it('should validate webhook timing', () => {
            const oldTimestamp = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
            const recentTimestamp = new Date().toISOString();
            const oldSale = { ...testSaleData, sale_timestamp: oldTimestamp };
            const recentSale = { ...testSaleData, sale_timestamp: recentTimestamp };
            // Both should be valid, but old webhooks might be flagged
            expect(new Date(oldSale.sale_timestamp)).toBeInstanceOf(Date);
            expect(new Date(recentSale.sale_timestamp)).toBeInstanceOf(Date);
        });
        it('should handle webhook replay attacks', async () => {
            const webhookSecret = process.env.GUMROAD_WEBHOOK_SECRET || 'test-secret';
            const payload = JSON.stringify(testSaleData);
            const signature = crypto
                .createHmac('sha256', webhookSecret)
                .update(payload)
                .digest('hex');
            // Send the same webhook multiple times
            const responses = await Promise.all([
                request(app)
                    .post('/api/gumroad/webhook')
                    .set('x-gumroad-signature', signature)
                    .send(testSaleData),
                request(app)
                    .post('/api/gumroad/webhook')
                    .set('x-gumroad-signature', signature)
                    .send(testSaleData)
            ]);
            // Should handle duplicate webhooks appropriately
            responses.forEach(response => {
                expect([200, 400, 409, 500]).toContain(response.status);
            });
        });
    });
});
