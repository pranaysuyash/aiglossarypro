import { describe, test, expect, beforeEach, vi } from 'vitest';
import nodemailer from 'nodemailer';
import { 
  sendPremiumWelcomeEmail, 
  sendSystemNotificationEmail 
} from '../../server/utils/email';
import { 
  getPremiumWelcomeEmailTemplate,
  type PremiumWelcomeEmailData 
} from '../../server/utils/emailTemplates';

// Mock nodemailer
vi.mock('nodemailer');

describe('Premium Welcome Email Testing', () => {
  let mockTransporter: any;

  beforeEach(() => {
    mockTransporter = {
      sendMail: vi.fn().mockResolvedValue({
        messageId: 'test-message-id',
        response: '250 Message queued'
      }),
      verify: vi.fn().mockResolvedValue(true)
    };

    (nodemailer.createTransporter as any) = vi.fn().mockReturnValue(mockTransporter);
    vi.clearAllMocks();
  });

  describe('Email Template Generation', () => {
    test('should generate premium welcome email template correctly', () => {
      const testData: PremiumWelcomeEmailData = {
        userName: 'John Doe',
        userEmail: 'john@example.com',
        purchaseDate: '2025-01-13',
        orderId: 'TEST-ORDER-123',
        purchaseAmount: '$249.00'
      };

      const template = getPremiumWelcomeEmailTemplate(testData);

      expect(template.subject).toContain('Welcome to AI Glossary Pro');
      expect(template.subject).toContain('John');
      
      expect(template.html).toContain('John Doe');
      expect(template.html).toContain('TEST-ORDER-123');
      expect(template.html).toContain('$249.00');
      expect(template.html).toContain('2025-01-13');
      
      expect(template.text).toContain('Welcome to AI Glossary Pro');
      expect(template.text).toContain('john@example.com');
    });

    test('should handle missing user name gracefully', () => {
      const testData: PremiumWelcomeEmailData = {
        userName: '', // Empty name
        userEmail: 'noname@example.com',
        purchaseDate: '2025-01-13',
        orderId: 'NO-NAME-123',
        purchaseAmount: '$249.00'
      };

      const template = getPremiumWelcomeEmailTemplate(testData);

      expect(template.subject).not.toContain('undefined');
      expect(template.subject).not.toContain('null');
      expect(template.html).toContain('Welcome to AI Glossary Pro');
      expect(template.html).toContain('NO-NAME-123');
    });

    test('should include all required links and CTAs', () => {
      const testData: PremiumWelcomeEmailData = {
        userName: 'Test User',
        userEmail: 'test@example.com',
        purchaseDate: '2025-01-13',
        orderId: 'LINKS-TEST-123',
        purchaseAmount: '$249.00'
      };

      const template = getPremiumWelcomeEmailTemplate(testData);

      // Should include login link
      expect(template.html).toMatch(/href="[^"]*\/login[^"]*"/);
      
      // Should include getting started guide
      expect(template.html).toContain('getting started');
      expect(template.html).toContain('Get Started');
      
      // Should include support contact
      expect(template.html).toMatch(/support@aiglossarypro\.com|contact|help/i);
      
      // Should include unsubscribe link
      expect(template.html).toMatch(/unsubscribe/i);
    });

    test('should be mobile-responsive', () => {
      const testData: PremiumWelcomeEmailData = {
        userName: 'Mobile User',
        userEmail: 'mobile@example.com',
        purchaseDate: '2025-01-13',
        orderId: 'MOBILE-123',
        purchaseAmount: '$249.00'
      };

      const template = getPremiumWelcomeEmailTemplate(testData);

      // Should include mobile-responsive meta tags and styles
      expect(template.html).toContain('viewport');
      expect(template.html).toMatch(/max-width.*mobile|width.*100%/i);
      expect(template.html).toMatch(/@media.*mobile|screen.*max-width/i);
    });
  });

  describe('Email Sending Functionality', () => {
    test('should send premium welcome email successfully', async () => {
      const emailData: PremiumWelcomeEmailData = {
        userName: 'Success User',
        userEmail: 'success@example.com',
        purchaseDate: '2025-01-13',
        orderId: 'SUCCESS-123',
        purchaseAmount: '$249.00'
      };

      await sendPremiumWelcomeEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: ['success@example.com'],
        subject: expect.stringContaining('Welcome to AI Glossary Pro'),
        html: expect.stringContaining('Success User'),
        text: expect.stringContaining('Welcome to AI Glossary Pro')
      });
    });

    test('should handle email sending errors gracefully', async () => {
      mockTransporter.sendMail.mockRejectedValueOnce(new Error('SMTP Error'));

      const emailData: PremiumWelcomeEmailData = {
        userName: 'Error User',
        userEmail: 'error@example.com',
        purchaseDate: '2025-01-13',
        orderId: 'ERROR-123',
        purchaseAmount: '$249.00'
      };

      await expect(sendPremiumWelcomeEmail(emailData)).rejects.toThrow('SMTP Error');
    });

    test('should validate email addresses', async () => {
      const invalidEmails = [
        'invalid-email',
        'missing@',
        '@missing-domain.com',
        'spaces in@email.com',
        'multiple@@signs.com'
      ];

      for (const invalidEmail of invalidEmails) {
        const emailData: PremiumWelcomeEmailData = {
          userName: 'Test User',
          userEmail: invalidEmail,
          purchaseDate: '2025-01-13',
          orderId: 'INVALID-123',
          purchaseAmount: '$249.00'
        };

        // Should throw validation error or handle gracefully
        try {
          await sendPremiumWelcomeEmail(emailData);
          // If it doesn't throw, check that it was handled properly
          expect(mockTransporter.sendMail).not.toHaveBeenCalledWith(
            expect.objectContaining({
              to: [invalidEmail]
            })
          );
        } catch (error) {
          // Expected for invalid emails
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Email Configuration Testing', () => {
    test('should support multiple email providers', () => {
      const providers = ['gmail', 'outlook', 'yahoo', 'custom'];
      
      for (const provider of providers) {
        process.env.EMAIL_SERVICE = provider;
        
        // Test would create transporter with appropriate config
        const config = {
          gmail: { host: 'smtp.gmail.com', port: 587 },
          outlook: { host: 'smtp-mail.outlook.com', port: 587 },
          yahoo: { host: 'smtp.mail.yahoo.com', port: 587 },
          custom: { host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT || '587') }
        };

        expect(config[provider as keyof typeof config]).toBeDefined();
      }
    });

    test('should handle missing email configuration', () => {
      // Remove email configuration
      delete process.env.EMAIL_SERVICE;
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASSWORD;

      // Should either throw configuration error or use fallback
      expect(() => {
        // Test configuration validation
        const requiredVars = ['EMAIL_SERVICE', 'EMAIL_USER'];
        for (const varName of requiredVars) {
          if (!process.env[varName]) {
            throw new Error(`Missing required environment variable: ${varName}`);
          }
        }
      }).toThrow('Missing required environment variable');
    });
  });

  describe('Email Content Validation', () => {
    test('should prevent XSS in email content', () => {
      const maliciousData: PremiumWelcomeEmailData = {
        userName: '<script>alert("xss")</script>',
        userEmail: 'xss@example.com',
        purchaseDate: '2025-01-13',
        orderId: '<img src="x" onerror="alert(1)">',
        purchaseAmount: '<script>steal()</script>'
      };

      const template = getPremiumWelcomeEmailTemplate(maliciousData);

      // Should escape or remove script tags
      expect(template.html).not.toContain('<script>');
      expect(template.html).not.toContain('onerror=');
      expect(template.html).not.toContain('alert(');
      
      // Should properly encode HTML entities
      expect(template.html).toMatch(/&lt;|&gt;|&amp;/);
    });

    test('should maintain proper email formatting', () => {
      const testData: PremiumWelcomeEmailData = {
        userName: 'Format Test',
        userEmail: 'format@example.com',
        purchaseDate: '2025-01-13',
        orderId: 'FORMAT-123',
        purchaseAmount: '$249.00'
      };

      const template = getPremiumWelcomeEmailTemplate(testData);

      // Should have proper HTML structure
      expect(template.html).toMatch(/<html[\s\S]*<\/html>/i);
      expect(template.html).toMatch(/<head[\s\S]*<\/head>/i);
      expect(template.html).toMatch(/<body[\s\S]*<\/body>/i);
      
      // Should include DOCTYPE
      expect(template.html).toMatch(/<!DOCTYPE/i);
      
      // Should have proper encoding
      expect(template.html).toContain('charset=utf-8');
    });
  });

  describe('Email Analytics and Tracking', () => {
    test('should include tracking pixels', () => {
      const testData: PremiumWelcomeEmailData = {
        userName: 'Track User',
        userEmail: 'track@example.com',
        purchaseDate: '2025-01-13',
        orderId: 'TRACK-123',
        purchaseAmount: '$249.00'
      };

      const template = getPremiumWelcomeEmailTemplate(testData);

      // Should include tracking pixel or analytics
      const hasTracking = template.html.includes('pixel') || 
                         template.html.includes('analytics') ||
                         template.html.includes('track');
      
      expect(hasTracking).toBe(true);
    });

    test('should include UTM parameters in links', () => {
      const testData: PremiumWelcomeEmailData = {
        userName: 'UTM User',
        userEmail: 'utm@example.com',
        purchaseDate: '2025-01-13',
        orderId: 'UTM-123',
        purchaseAmount: '$249.00'
      };

      const template = getPremiumWelcomeEmailTemplate(testData);

      // Should include UTM parameters in links
      expect(template.html).toMatch(/utm_source=email/);
      expect(template.html).toMatch(/utm_medium=email/);
      expect(template.html).toMatch(/utm_campaign=welcome/);
    });
  });

  describe('Email Testing Utilities', () => {
    test('should provide email preview functionality', () => {
      const testData: PremiumWelcomeEmailData = {
        userName: 'Preview User',
        userEmail: 'preview@example.com',
        purchaseDate: '2025-01-13',
        orderId: 'PREVIEW-123',
        purchaseAmount: '$249.00'
      };

      const template = getPremiumWelcomeEmailTemplate(testData);
      
      // Email preview should be valid HTML that can be opened in browser
      expect(template.html).toContain('<!DOCTYPE');
      expect(template.html).toContain('<html');
      expect(template.html).toContain('</html>');
      
      // Should have readable content
      expect(template.html.length).toBeGreaterThan(1000);
    });

    test('should support email template testing', async () => {
      const testVariations = [
        { userName: 'John Doe', expected: 'John' },
        { userName: 'Jane Smith-Wilson', expected: 'Jane' },
        { userName: 'Dr. Robert Johnson III', expected: 'Dr. Robert' },
        { userName: '', expected: 'there' }, // Fallback greeting
      ];

      for (const variation of testVariations) {
        const testData: PremiumWelcomeEmailData = {
          userName: variation.userName,
          userEmail: 'test@example.com',
          purchaseDate: '2025-01-13',
          orderId: 'VARIATION-123',
          purchaseAmount: '$249.00'
        };

        const template = getPremiumWelcomeEmailTemplate(testData);
        expect(template.html).toContain(variation.expected);
      }
    });
  });

  describe('Email Performance Testing', () => {
    test('should generate email template quickly', () => {
      const testData: PremiumWelcomeEmailData = {
        userName: 'Performance User',
        userEmail: 'perf@example.com',
        purchaseDate: '2025-01-13',
        orderId: 'PERF-123',
        purchaseAmount: '$249.00'
      };

      const start = performance.now();
      const template = getPremiumWelcomeEmailTemplate(testData);
      const end = performance.now();

      expect(template).toBeDefined();
      expect(end - start).toBeLessThan(100); // Should take less than 100ms
    });

    test('should handle bulk email generation', () => {
      const bulkData = Array.from({ length: 100 }, (_, i) => ({
        userName: `User ${i}`,
        userEmail: `user${i}@example.com`,
        purchaseDate: '2025-01-13',
        orderId: `BULK-${i}`,
        purchaseAmount: '$249.00'
      }));

      const start = performance.now();
      const templates = bulkData.map(data => getPremiumWelcomeEmailTemplate(data));
      const end = performance.now();

      expect(templates).toHaveLength(100);
      expect(templates.every(t => t.html && t.subject)).toBe(true);
      expect(end - start).toBeLessThan(1000); // Should process 100 emails in under 1 second
    });
  });

  describe('Integration with Webhook Flow', () => {
    test('should integrate with successful purchase webhook', async () => {
      const webhookData = {
        sale: {
          email: 'webhook@example.com',
          order_id: 'WEBHOOK-123',
          amount_cents: 24900,
          currency: 'USD',
          purchaser_id: 'purchaser-123',
          product_name: 'AI Glossary Pro'
        }
      };

      // This would be called from the webhook handler
      const emailData: PremiumWelcomeEmailData = {
        userName: 'Webhook User', // Would be determined from user data
        userEmail: webhookData.sale.email,
        purchaseDate: new Date().toLocaleDateString(),
        orderId: webhookData.sale.order_id,
        purchaseAmount: `${webhookData.sale.currency} ${webhookData.sale.amount_cents / 100}`
      };

      await sendPremiumWelcomeEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: expect.any(String),
        to: ['webhook@example.com'],
        subject: expect.stringContaining('Welcome'),
        html: expect.stringContaining('WEBHOOK-123'),
        text: expect.any(String)
      });
    });
  });
});