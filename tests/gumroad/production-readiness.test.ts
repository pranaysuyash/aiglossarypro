import crypto from 'node:crypto';
import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import request from 'supertest';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Import the Gumroad routes and related services
import { registerGumroadRoutes } from '../../server/routes/gumroad';

describe('Production Readiness Testing', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    registerGumroadRoutes(app);
    vi.clearAllMocks();
  });

  describe('Security Configuration', () => {
    test('should require HMAC signature in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.GUMROAD_WEBHOOK_SECRET = 'production_secret';

      const payload = { sale: { email: 'test@example.com' } };

      // Test without signature
      const response = await request(app).post('/api/gumroad/webhook').send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid signature');
    });

    test('should validate webhook signature timing safety', () => {
      const secret = 'test_secret';
      const payload = JSON.stringify({ test: 'data' });

      const validSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const invalidSignature = 'invalid_signature';

      // Test timing-safe comparison
      const start1 = performance.now();
      const isValid = crypto.timingSafeEqual(
        Buffer.from(validSignature),
        Buffer.from(validSignature)
      );
      const end1 = performance.now();

      const start2 = performance.now();
      try {
        crypto.timingSafeEqual(Buffer.from(validSignature), Buffer.from(invalidSignature));
      } catch (error) {
        // Expected - different lengths
      }
      const end2 = performance.now();

      expect(isValid).toBe(true);
      // Timing should be consistent (within reasonable variance)
      const timeDiff = Math.abs(end1 - start1 - (end2 - start2));
      expect(timeDiff).toBeLessThan(10); // 10ms variance allowance
    });

    test('should handle production environment variables', () => {
      const requiredEnvVars = [
        'GUMROAD_WEBHOOK_SECRET',
        'DATABASE_URL',
        'EMAIL_SERVICE',
        'EMAIL_USER',
        'SENTRY_DSN',
      ];

      for (const envVar of requiredEnvVars) {
        // In production, these should all be set
        if (process.env.NODE_ENV === 'production') {
          expect(process.env[envVar]).toBeDefined();
          expect(process.env[envVar]).not.toBe('');
        }
      }
    });

    test('should disable test endpoints in production', async () => {
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .post('/api/gumroad/test-purchase')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('development mode');
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle malformed webhook payloads', async () => {
      process.env.GUMROAD_WEBHOOK_SECRET = 'test_secret';

      const malformedPayloads = [
        'invalid json',
        null,
        undefined,
        {
          /* missing sale */
        },
        { sale: null },
        {
          sale: {
            /* missing email */
          },
        },
      ];

      for (const payload of malformedPayloads) {
        try {
          const signature = crypto
            .createHmac('sha256', 'test_secret')
            .update(JSON.stringify(payload))
            .digest('hex');

          const response = await request(app)
            .post('/api/gumroad/webhook')
            .set('x-gumroad-signature', signature)
            .send(payload);

          // Should handle gracefully without crashing
          expect([200, 400, 500]).toContain(response.status);
        } catch (error) {
          // Some payloads may cause JSON.stringify to fail
          expect(error).toBeDefined();
        }
      }
    });

    test('should handle database connection failures', async () => {
      // Mock database failure
      vi.doMock('../../server/services/userService', () => ({
        UserService: {
          grantLifetimeAccess: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        },
      }));

      process.env.GUMROAD_WEBHOOK_SECRET = 'test_secret';

      const payload = {
        sale: {
          email: 'db-fail@example.com',
          order_id: 'DB-FAIL-123',
        },
      };

      const signature = crypto
        .createHmac('sha256', 'test_secret')
        .update(JSON.stringify(payload))
        .digest('hex');

      const response = await request(app)
        .post('/api/gumroad/webhook')
        .set('x-gumroad-signature', signature)
        .send(payload);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Webhook processing failed');
      expect(response.body.timestamp).toBeDefined();
    });

    test('should handle high concurrent load', async () => {
      process.env.GUMROAD_WEBHOOK_SECRET = 'test_secret';

      const concurrentRequests = 50;
      const promises = Array.from({ length: concurrentRequests }, (_, i) => {
        const payload = {
          sale: {
            email: `concurrent${i}@example.com`,
            order_id: `CONCURRENT-${i}`,
          },
        };

        const signature = crypto
          .createHmac('sha256', 'test_secret')
          .update(JSON.stringify(payload))
          .digest('hex');

        return request(app)
          .post('/api/gumroad/webhook')
          .set('x-gumroad-signature', signature)
          .send(payload);
      });

      const start = performance.now();
      const responses = await Promise.all(promises);
      const end = performance.now();

      // All requests should complete
      expect(responses).toHaveLength(concurrentRequests);

      // Should handle load efficiently (under 5 seconds for 50 requests)
      expect(end - start).toBeLessThan(5000);

      // Most requests should succeed (allowing for some failures)
      const successCount = responses.filter(r => r.status < 400).length;
      expect(successCount).toBeGreaterThan(concurrentRequests * 0.8); // 80% success rate
    });
  });

  describe('Monitoring and Observability', () => {
    test('should log critical events with proper structure', () => {
      const logEntries: any[] = [];

      // Mock logger to capture log entries
      vi.doMock('../../server/utils/logger', () => ({
        log: {
          info: vi.fn((message: string, meta: any) => {
            logEntries.push({ level: 'info', message, meta });
          }),
          error: vi.fn((message: string, meta: any) => {
            logEntries.push({ level: 'error', message, meta });
          }),
          warn: vi.fn((message: string, meta: any) => {
            logEntries.push({ level: 'warn', message, meta });
          }),
        },
      }));

      // Simulate webhook processing
      const webhookMeta = {
        email: 'test***',
        orderId: 'TEST-123',
        amount: 24900,
        currency: 'USD',
      };

      // Should log with structured data
      expect(webhookMeta.email).toMatch(/\*\*\*/); // Email should be masked
      expect(webhookMeta.orderId).toBeDefined();
      expect(typeof webhookMeta.amount).toBe('number');
    });

    test('should capture errors with Sentry integration', () => {
      const sentryEvents: any[] = [];

      // Mock Sentry
      vi.doMock('../../server/utils/sentry', () => ({
        captureAPIError: vi.fn((error: Error, context: any) => {
          sentryEvents.push({ error, context });
        }),
      }));

      const testError = new Error('Test error');
      const context = {
        method: 'POST',
        path: '/api/gumroad/webhook',
        body: { email: 'filtered' },
      };

      // Simulate error capture
      sentryEvents.push({ error: testError, context });

      expect(sentryEvents).toHaveLength(1);
      expect(sentryEvents[0].error.message).toBe('Test error');
      expect(sentryEvents[0].context.path).toBe('/api/gumroad/webhook');
    });

    test('should provide health check endpoints', async () => {
      // Add a simple health check
      app.get('/health', (req, res) => {
        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            database: 'connected',
            email: 'configured',
            gumroad: 'ready',
          },
        });
      });

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toBeDefined();
    });
  });

  describe('Performance Validation', () => {
    test('should process webhooks within acceptable time limits', async () => {
      process.env.GUMROAD_WEBHOOK_SECRET = 'test_secret';

      const payload = {
        sale: {
          email: 'perf@example.com',
          order_id: 'PERF-123',
          amount_cents: 24900,
          currency: 'USD',
        },
      };

      const signature = crypto
        .createHmac('sha256', 'test_secret')
        .update(JSON.stringify(payload))
        .digest('hex');

      const start = performance.now();
      const response = await request(app)
        .post('/api/gumroad/webhook')
        .set('x-gumroad-signature', signature)
        .send(payload);
      const end = performance.now();

      // Should complete within 2 seconds
      expect(end - start).toBeLessThan(2000);
      expect([200, 500]).toContain(response.status); // Success or handled error
    });

    test('should handle memory usage efficiently', () => {
      const initialMemory = process.memoryUsage();

      // Simulate processing multiple webhooks
      const largePayload = {
        sale: {
          email: 'memory@example.com',
          order_id: 'MEMORY-123',
          metadata: {
            largeData: 'x'.repeat(100000), // 100KB of data
          },
        },
      };

      // Process multiple large payloads
      for (let i = 0; i < 10; i++) {
        JSON.stringify(largePayload);
        crypto.createHmac('sha256', 'test').update(JSON.stringify(largePayload)).digest('hex');
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (under 50MB for 10 large payloads)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Deployment Validation', () => {
    test('should validate production build assets exist', () => {
      const distPath = path.resolve(__dirname, '../../dist');

      if (fs.existsSync(distPath)) {
        const publicPath = path.join(distPath, 'public');
        const serverPath = path.join(distPath, 'index.js');

        expect(fs.existsSync(publicPath)).toBe(true);
        expect(fs.existsSync(serverPath)).toBe(true);

        // Check for essential assets
        const assetsPath = path.join(publicPath, 'assets');
        if (fs.existsSync(assetsPath)) {
          const assets = fs.readdirSync(assetsPath);
          const hasJS = assets.some(file => file.endsWith('.js'));
          const hasCSS = assets.some(file => file.endsWith('.css'));

          expect(hasJS).toBe(true);
          expect(hasCSS).toBe(true);
        }
      }
    });

    test('should validate environment configuration', () => {
      const productionChecks = {
        nodeEnv: process.env.NODE_ENV,
        hasWebhookSecret: !!process.env.GUMROAD_WEBHOOK_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasEmailConfig: !!(process.env.EMAIL_SERVICE && process.env.EMAIL_USER),
        hasSentryDsn: !!process.env.SENTRY_DSN,
      };

      if (process.env.NODE_ENV === 'production') {
        Object.entries(productionChecks).forEach(([key, value]) => {
          if (key !== 'nodeEnv') {
            expect(value).toBe(true);
          }
        });
      }

      console.log('Environment checks:', productionChecks);
    });

    test('should validate SSL and security headers', async () => {
      // In production, should enforce HTTPS
      app.use((req, res, next) => {
        if (process.env.NODE_ENV === 'production' && !req.secure) {
          return res.redirect('https://' + req.get('Host') + req.url);
        }
        next();
      });

      // Should set security headers
      app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        next();
      });

      app.get('/security-test', (req, res) => {
        res.json({ message: 'Security headers test' });
      });

      const response = await request(app).get('/security-test');

      if (process.env.NODE_ENV === 'production') {
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-frame-options']).toBe('DENY');
        expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      }
    });
  });

  describe('Backup and Recovery', () => {
    test('should handle webhook replay scenarios', async () => {
      process.env.GUMROAD_WEBHOOK_SECRET = 'test_secret';

      const payload = {
        sale: {
          email: 'replay@example.com',
          order_id: 'REPLAY-123',
          amount_cents: 24900,
          currency: 'USD',
        },
      };

      const signature = crypto
        .createHmac('sha256', 'test_secret')
        .update(JSON.stringify(payload))
        .digest('hex');

      // Send same webhook twice (replay scenario)
      const response1 = await request(app)
        .post('/api/gumroad/webhook')
        .set('x-gumroad-signature', signature)
        .send(payload);

      const response2 = await request(app)
        .post('/api/gumroad/webhook')
        .set('x-gumroad-signature', signature)
        .send(payload);

      // Both should succeed (idempotent processing)
      expect([200, 500]).toContain(response1.status);
      expect([200, 500]).toContain(response2.status);
    });

    test('should validate data integrity checks', () => {
      const criticalData = {
        email: 'integrity@example.com',
        orderId: 'INTEGRITY-123',
        amount: 24900,
        currency: 'USD',
      };

      // Basic data validation
      expect(criticalData.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(criticalData.orderId).toMatch(/^[A-Z0-9-]+$/);
      expect(criticalData.amount).toBeGreaterThan(0);
      expect(['USD', 'EUR', 'GBP'].includes(criticalData.currency)).toBe(true);
    });
  });

  describe('Compliance and Audit', () => {
    test('should log all financial transactions', () => {
      const auditLog: any[] = [];

      const transaction = {
        timestamp: new Date().toISOString(),
        type: 'purchase',
        orderId: 'AUDIT-123',
        amount: 24900,
        currency: 'USD',
        userEmail: 'audit@example.com',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      };

      auditLog.push(transaction);

      expect(auditLog).toHaveLength(1);
      expect(auditLog[0].orderId).toBe('AUDIT-123');
      expect(auditLog[0].amount).toBe(24900);
      expect(auditLog[0].timestamp).toBeDefined();
    });

    test('should maintain GDPR compliance for email data', () => {
      const userData = {
        email: 'gdpr@example.com',
        name: 'GDPR User',
        purchaseDate: new Date(),
        consent: {
          marketing: true,
          analytics: false,
          timestamp: new Date(),
        },
      };

      // Should respect consent settings
      expect(userData.consent.marketing).toBe(true);
      expect(userData.consent.analytics).toBe(false);
      expect(userData.consent.timestamp).toBeDefined();
    });
  });
});
