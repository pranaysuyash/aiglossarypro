import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'node:crypto';
import request from 'supertest';
import express from 'express';
import { registerGumroadRoutes } from '../../server/routes/gumroad';
import { UserService } from '../../server/services/userService';

// Mock dependencies
vi.mock('../../server/services/userService');
vi.mock('../../server/utils/logger');
vi.mock('../../server/utils/sentry');
vi.mock('../../server/utils/email');
vi.mock('../../server/middleware/firebaseAuth');

describe('Gumroad Webhook Integration Tests', () => {
  let app: express.Application;
  const mockSecret = 'test_webhook_secret_key';
  
  beforeEach(() => {
    // Setup test app
    app = express();
    app.use(express.json());
    app.use(express.raw({ type: 'application/json' }));
    
    // Set environment variables
    process.env.GUMROAD_WEBHOOK_SECRET = mockSecret;
    process.env.NODE_ENV = 'test';
    
    // Register Gumroad routes
    registerGumroadRoutes(app);
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.GUMROAD_WEBHOOK_SECRET;
  });

  describe('Webhook Security', () => {
    test('should reject webhook with invalid signature', async () => {
      const payload = { sale: { email: 'test@example.com' } };
      const invalidSignature = 'invalid_signature';

      const response = await request(app)
        .post('/api/gumroad/webhook')
        .set('x-gumroad-signature', invalidSignature)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid signature');
    });

    test('should accept webhook with valid HMAC signature', async () => {
      const payload = { sale: { 
        email: 'test@example.com',
        order_id: 'TEST-123',
        amount_cents: 24900,
        currency: 'USD',
        purchaser_id: 'buyer-123',
        product_name: 'AI Glossary Pro'
      }};
      
      const payloadString = JSON.stringify(payload);
      const validSignature = crypto
        .createHmac('sha256', mockSecret)
        .update(payloadString)
        .digest('hex');

      // Mock UserService methods
      vi.mocked(UserService.grantLifetimeAccess).mockResolvedValue({
        userId: 'user-123',
        email: 'test@example.com',
        wasExistingUser: false,
        lifetimeAccess: true,
        userName: 'Test User'
      });

      const response = await request(app)
        .post('/api/gumroad/webhook')
        .set('x-gumroad-signature', validSignature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(UserService.grantLifetimeAccess).toHaveBeenCalledWith({
        email: 'test@example.com',
        orderId: 'TEST-123',
        amount: 24900,
        currency: 'USD',
        purchaseData: expect.objectContaining({
          email: 'test@example.com',
          order_id: 'TEST-123',
          webhook_processed_at: expect.any(String),
          source: 'gumroad_webhook'
        })
      });
    });

    test('should allow webhook in development mode without secret', async () => {
      delete process.env.GUMROAD_WEBHOOK_SECRET;
      process.env.NODE_ENV = 'development';

      const payload = { sale: { 
        email: 'dev@example.com',
        order_id: 'DEV-123'
      }};

      vi.mocked(UserService.grantLifetimeAccess).mockResolvedValue({
        userId: 'dev-user-123',
        email: 'dev@example.com',
        wasExistingUser: false,
        lifetimeAccess: true,
        userName: 'Dev User'
      });

      const response = await request(app)
        .post('/api/gumroad/webhook')
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Purchase Processing', () => {
    test('should process new user purchase correctly', async () => {
      const payload = { sale: { 
        email: 'newuser@example.com',
        order_id: 'ORDER-456',
        amount_cents: 24900,
        currency: 'USD',
        purchaser_id: 'buyer-456',
        product_name: 'AI Glossary Pro'
      }};
      
      const signature = createValidSignature(payload);

      vi.mocked(UserService.grantLifetimeAccess).mockResolvedValue({
        userId: 'new-user-456',
        email: 'newuser@example.com',
        wasExistingUser: false,
        lifetimeAccess: true,
        userName: 'New User'
      });

      const response = await request(app)
        .post('/api/gumroad/webhook')
        .set('x-gumroad-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.data.userId).toBe('new-user-456');
      expect(response.body.data.wasExistingUser).toBe(false);
      expect(response.body.data.orderId).toBe('ORDER-456');
    });

    test('should process existing user upgrade correctly', async () => {
      const payload = { sale: { 
        email: 'existing@example.com',
        order_id: 'ORDER-789',
        amount_cents: 24900,
        currency: 'USD'
      }};
      
      const signature = createValidSignature(payload);

      vi.mocked(UserService.grantLifetimeAccess).mockResolvedValue({
        userId: 'existing-user-789',
        email: 'existing@example.com',
        wasExistingUser: true,
        lifetimeAccess: true,
        userName: 'Existing User'
      });

      const response = await request(app)
        .post('/api/gumroad/webhook')
        .set('x-gumroad-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.data.wasExistingUser).toBe(true);
    });

    test('should handle webhook without sale data gracefully', async () => {
      const payload = { notification: 'ping' };
      const signature = createValidSignature(payload);

      const response = await request(app)
        .post('/api/gumroad/webhook')
        .set('x-gumroad-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('no sale data processed');
      expect(UserService.grantLifetimeAccess).not.toHaveBeenCalled();
    });

    test('should handle malformed sale data', async () => {
      const payload = { sale: { /* missing email */ order_id: 'TEST-999' } };
      const signature = createValidSignature(payload);

      const response = await request(app)
        .post('/api/gumroad/webhook')
        .set('x-gumroad-signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('no sale data processed');
    });
  });

  describe('Error Handling', () => {
    test('should handle UserService errors gracefully', async () => {
      const payload = { sale: { 
        email: 'error@example.com',
        order_id: 'ERROR-123'
      }};
      
      const signature = createValidSignature(payload);

      vi.mocked(UserService.grantLifetimeAccess).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/gumroad/webhook')
        .set('x-gumroad-signature', signature)
        .send(payload);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Webhook processing failed');
      expect(response.body.timestamp).toBeDefined();
    });

    test('should continue processing even if email sending fails', async () => {
      const payload = { sale: { 
        email: 'emailfail@example.com',
        order_id: 'EMAIL-FAIL-123',
        amount_cents: 24900,
        currency: 'USD'
      }};
      
      const signature = createValidSignature(payload);

      vi.mocked(UserService.grantLifetimeAccess).mockResolvedValue({
        userId: 'user-email-fail',
        email: 'emailfail@example.com',
        wasExistingUser: false,
        lifetimeAccess: true,
        userName: 'Email Fail User'
      });

      // Mock email import to fail
      vi.doMock('../../server/utils/email', () => ({
        sendPremiumWelcomeEmail: vi.fn().mockRejectedValue(new Error('Email service down'))
      }));

      const response = await request(app)
        .post('/api/gumroad/webhook')
        .set('x-gumroad-signature', signature)
        .send(payload);

      // Should still succeed despite email failure
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Purchase Verification Endpoint', () => {
    test('should verify existing purchase', async () => {
      vi.mocked(UserService.getUserAccessStatus).mockResolvedValue({
        hasAccess: true,
        user: {
          email: 'verified@example.com',
          subscriptionTier: 'lifetime',
          lifetimeAccess: true,
          purchaseDate: new Date()
        }
      });

      const response = await request(app)
        .post('/api/gumroad/verify-purchase')
        .send({ email: 'verified@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.lifetimeAccess).toBe(true);
    });

    test('should return 404 for non-existent purchase', async () => {
      vi.mocked(UserService.getUserAccessStatus).mockResolvedValue({
        hasAccess: false
      });

      const response = await request(app)
        .post('/api/gumroad/verify-purchase')
        .send({ email: 'notfound@example.com' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('No purchase found for this email');
    });

    test('should require email parameter', async () => {
      const response = await request(app)
        .post('/api/gumroad/verify-purchase')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email required');
    });
  });

  // Helper function to create valid HMAC signatures
  function createValidSignature(payload: any): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', mockSecret)
      .update(payloadString)
      .digest('hex');
  }
});

describe('Performance and Load Testing', () => {
  test('should handle multiple concurrent webhooks', async () => {
    const app = express();
    app.use(express.json());
    registerGumroadRoutes(app);
    
    process.env.GUMROAD_WEBHOOK_SECRET = 'test_secret';

    vi.mocked(UserService.grantLifetimeAccess).mockResolvedValue({
      userId: 'concurrent-user',
      email: 'concurrent@example.com',
      wasExistingUser: false,
      lifetimeAccess: true,
      userName: 'Concurrent User'
    });

    const promises = Array.from({ length: 10 }, (_, i) => {
      const payload = { sale: { 
        email: `user${i}@example.com`,
        order_id: `CONCURRENT-${i}`,
        amount_cents: 24900,
        currency: 'USD'
      }};
      
      const signature = crypto
        .createHmac('sha256', 'test_secret')
        .update(JSON.stringify(payload))
        .digest('hex');

      return request(app)
        .post('/api/gumroad/webhook')
        .set('x-gumroad-signature', signature)
        .send(payload);
    });

    const responses = await Promise.all(promises);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    expect(UserService.grantLifetimeAccess).toHaveBeenCalledTimes(10);
  });

  test('should handle large payload efficiently', async () => {
    const app = express();
    app.use(express.json({ limit: '1mb' }));
    registerGumroadRoutes(app);
    
    process.env.GUMROAD_WEBHOOK_SECRET = 'test_secret';

    // Create large payload with additional metadata
    const largePayload = { 
      sale: { 
        email: 'large@example.com',
        order_id: 'LARGE-PAYLOAD-123',
        amount_cents: 24900,
        currency: 'USD',
        metadata: {
          large_data: 'x'.repeat(10000), // 10KB of data
          purchase_context: 'website',
          user_agent: 'Mozilla/5.0...',
          referrer: 'https://example.com',
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'ai-glossary-pro'
        }
      }
    };
    
    const signature = crypto
      .createHmac('sha256', 'test_secret')
      .update(JSON.stringify(largePayload))
      .digest('hex');

    vi.mocked(UserService.grantLifetimeAccess).mockResolvedValue({
      userId: 'large-user',
      email: 'large@example.com',
      wasExistingUser: false,
      lifetimeAccess: true,
      userName: 'Large User'
    });

    const start = performance.now();
    const response = await request(app)
      .post('/api/gumroad/webhook')
      .set('x-gumroad-signature', signature)
      .send(largePayload);
    const end = performance.now();

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(end - start).toBeLessThan(1000); // Should process in under 1 second
  });
});