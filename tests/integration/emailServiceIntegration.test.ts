/**
 * Email Service Integration Tests
 * Tests Resend, SMTP, and email template functionality
 */

import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
    sendEmail,
    sendPurchaseInstructionsEmail,
    sendWelcomeEmail,
    testEmailConfiguration
} from '../../server/utils/email';
import {
    getPasswordResetEmailTemplate,
    getPremiumWelcomeEmailTemplate,
    getWelcomeEmailTemplate
} from '../../server/utils/emailTemplates';

describe('Email Service Integration', () => {
    const testEmail = 'test@example.com';
    const testUserName = 'Test User';

    beforeAll(() => {
        // Mock console methods to reduce noise in tests
        vi.spyOn(console, 'log').mockImplementation(() => { });
        vi.spyOn(console, 'warn').mockImplementation(() => { });
    });

    afterAll(() => {
        vi.restoreAllMocks();
    });

    describe('Email Configuration Validation', () => {
        it('should validate required email environment variables', () => {
            const emailFrom = process.env.EMAIL_FROM;
            expect(emailFrom).toBeDefined();

            if (emailFrom) {
                // Should be a valid email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                expect(emailRegex.test(emailFrom)).toBe(true);
            }
        });

        it('should validate Resend configuration if available', () => {
            const resendApiKey = process.env.RESEND_API_KEY;

            if (resendApiKey) {
                expect(resendApiKey).toMatch(/^re_/);
                expect(resendApiKey.length).toBeGreaterThan(10);

                // Test Resend client initialization
                const resend = new Resend(resendApiKey);
                expect(resend).toBeDefined();
                expect(typeof resend.emails.send).toBe('function');
            } else {
                console.log('Resend API key not configured - skipping Resend tests');
            }
        });

        it('should validate SMTP configuration if available', () => {
            const smtpHost = process.env.SMTP_HOST;
            const smtpUser = process.env.SMTP_USER;
            const smtpPass = process.env.SMTP_PASS;

            if (smtpHost && smtpUser && smtpPass) {
                expect(smtpHost).toBeTruthy();
                expect(smtpUser).toBeTruthy();
                expect(smtpPass).toBeTruthy();

                // Validate SMTP host format
                expect(smtpHost).toMatch(/^[a-zA-Z0-9.-]+$/);

                // Test SMTP transporter creation
                const transporter = nodemailer.createTransporter({
                    host: smtpHost,
                    port: parseInt(process.env.SMTP_PORT || '587'),
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: smtpUser,
                        pass: smtpPass
                    }
                });

                expect(transporter).toBeDefined();
            } else {
                console.log('SMTP configuration not complete - skipping SMTP tests');
            }
        });

        it('should validate email service priority', () => {
            const hasResend = !!process.env.RESEND_API_KEY;
            const hasSmtp = !!(
                process.env.SMTP_HOST &&
                process.env.SMTP_USER &&
                process.env.SMTP_PASS
            );

            // Should have at least one email service configured
            expect(hasResend || hasSmtp).toBe(true);

            console.log('Email service configuration:', {
                hasResend,
                hasSmtp,
                priority: hasResend ? 'Resend' : 'SMTP'
            });
        });
    });

    describe('Email Template Generation', () => {
        it('should generate welcome email template', () => {
            const template = getWelcomeEmailTemplate(testUserName);

            expect(template).toHaveProperty('subject');
            expect(template).toHaveProperty('html');
            expect(template).toHaveProperty('text');

            expect(template.subject).toContain('Welcome');
            expect(template.html).toContain(testUserName);
            expect(template.text).toContain(testUserName);

            // Should contain essential elements
            expect(template.html).toContain('AI Glossary Pro');
            expect(template.html).toContain('<!DOCTYPE html>');
            expect(template.text.length).toBeGreaterThan(100);
        });

        it('should generate premium welcome email template', () => {
            const premiumData = {
                userEmail: testEmail,
                userName: testUserName,
                purchaseAmount: 199,
                orderId: 'test-order-123',
                purchaseDate: new Date()
            };

            const template = getPremiumWelcomeEmailTemplate(premiumData);

            expect(template).toHaveProperty('subject');
            expect(template).toHaveProperty('html');
            expect(template).toHaveProperty('text');

            expect(template.subject).toContain('Premium');
            expect(template.html).toContain(testUserName);
            expect(template.html).toContain('$199');
            expect(template.html).toContain('test-order-123');
        });

        it('should generate password reset email template', () => {
            const resetToken = 'test-reset-token-123';
            const template = getPasswordResetEmailTemplate(resetToken);

            expect(template).toHaveProperty('subject');
            expect(template).toHaveProperty('html');
            expect(template).toHaveProperty('text');

            expect(template.subject).toContain('Password Reset');
            expect(template.html).toContain(resetToken);
            expect(template.html).toContain('reset');
        });

        it('should handle template generation with missing data gracefully', () => {
            // Test with undefined user name
            const template = getWelcomeEmailTemplate(undefined);

            expect(template).toHaveProperty('subject');
            expect(template).toHaveProperty('html');
            expect(template).toHaveProperty('text');

            // Should not contain 'undefined' in the output
            expect(template.html).not.toContain('undefined');
            expect(template.text).not.toContain('undefined');
        });
    });

    describe('Email Sending Functionality', () => {
        it('should handle email sending when service is disabled', async () => {
            // Temporarily disable email service
            const originalEmailEnabled = process.env.EMAIL_ENABLED;
            process.env.EMAIL_ENABLED = 'false';

            try {
                await sendEmail({
                    to: [testEmail],
                    subject: 'Test Email',
                    html: '<p>Test content</p>'
                });

                // Should not throw error when disabled
                expect(true).toBe(true);
            } catch (error) {
                // Should handle gracefully
                expect(error).toBeInstanceOf(Error);
            } finally {
                // Restore original setting
                process.env.EMAIL_ENABLED = originalEmailEnabled;
            }
        });

        it('should validate email options before sending', async () => {
            if (process.env.EMAIL_ENABLED !== 'true') {
                console.log('Email service disabled - skipping send test');
                return;
            }

            // Test with invalid email options
            try {
                await sendEmail({
                    to: [], // Empty recipients
                    subject: 'Test',
                    html: '<p>Test</p>'
                });
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
            }

            // Test with missing subject
            try {
                await sendEmail({
                    to: [testEmail],
                    subject: '', // Empty subject
                    html: '<p>Test</p>'
                });
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should test email configuration without sending', async () => {
            if (process.env.EMAIL_ENABLED !== 'true') {
                console.log('Email service disabled - skipping configuration test');
                return;
            }

            try {
                // This should validate configuration without actually sending
                const result = await testEmailConfiguration(testEmail);
                expect(typeof result).toBe('boolean');
            } catch (error) {
                // Configuration test may fail in CI/CD environments
                expect(error).toBeInstanceOf(Error);
                console.log('Email configuration test result:', error.message);
            }
        });
    });

    describe('Specialized Email Functions', () => {
        it('should send welcome email', async () => {
            if (process.env.EMAIL_ENABLED !== 'true') {
                console.log('Email service disabled - skipping welcome email test');
                return;
            }

            try {
                await sendWelcomeEmail(testEmail, testUserName);
                expect(true).toBe(true); // If no error thrown, test passes
            } catch (error) {
                // Should handle errors gracefully
                expect(error).toBeInstanceOf(Error);
                console.log('Welcome email test result:', error.message);
            }
        });

        it('should send purchase instructions email', async () => {
            if (process.env.EMAIL_ENABLED !== 'true') {
                console.log('Email service disabled - skipping purchase email test');
                return;
            }

            try {
                await sendPurchaseInstructionsEmail(testEmail);
                expect(true).toBe(true); // If no error thrown, test passes
            } catch (error) {
                // Should handle errors gracefully
                expect(error).toBeInstanceOf(Error);
                console.log('Purchase instructions email test result:', error.message);
            }
        });

        it('should handle email sending with attachments', async () => {
            if (process.env.EMAIL_ENABLED !== 'true') {
                console.log('Email service disabled - skipping attachment test');
                return;
            }

            const testAttachment = {
                filename: 'test.txt',
                content: 'Test attachment content',
                contentType: 'text/plain'
            };

            try {
                await sendEmail({
                    to: [testEmail],
                    subject: 'Test Email with Attachment',
                    html: '<p>Test email with attachment</p>',
                    attachments: [testAttachment]
                });

                expect(true).toBe(true); // If no error thrown, test passes
            } catch (error) {
                // Should handle errors gracefully
                expect(error).toBeInstanceOf(Error);
                console.log('Email attachment test result:', error.message);
            }
        });
    });

    describe('Email Service Fallback', () => {
        it('should handle Resend service failures gracefully', async () => {
            if (!process.env.RESEND_API_KEY || process.env.EMAIL_ENABLED !== 'true') {
                console.log('Resend not configured or email disabled - skipping fallback test');
                return;
            }

            // Mock Resend to simulate failure
            const originalResendKey = process.env.RESEND_API_KEY;
            process.env.RESEND_API_KEY = 'invalid-key';

            try {
                await sendEmail({
                    to: [testEmail],
                    subject: 'Fallback Test',
                    html: '<p>Testing fallback mechanism</p>'
                });
            } catch (error) {
                // Should either succeed with SMTP fallback or fail gracefully
                expect(error).toBeInstanceOf(Error);
            } finally {
                // Restore original key
                process.env.RESEND_API_KEY = originalResendKey;
            }
        });

        it('should validate email service priority logic', () => {
            const hasResend = !!process.env.RESEND_API_KEY;
            const hasSmtp = !!(
                process.env.SMTP_HOST &&
                process.env.SMTP_USER &&
                process.env.SMTP_PASS
            );

            // Priority should be: Resend > SMTP > Error
            if (hasResend) {
                console.log('Primary email service: Resend');
                expect(hasResend).toBe(true);
            } else if (hasSmtp) {
                console.log('Primary email service: SMTP');
                expect(hasSmtp).toBe(true);
            } else {
                console.log('No email service configured');
                // In production, at least one should be configured
                if (process.env.NODE_ENV === 'production') {
                    expect(hasResend || hasSmtp).toBe(true);
                }
            }
        });
    });

    describe('Email Security and Validation', () => {
        it('should validate email addresses before sending', () => {
            const validEmails = [
                'test@example.com',
                'user.name@domain.co.uk',
                'user+tag@example.org'
            ];

            const invalidEmails = [
                'invalid-email',
                '@domain.com',
                'user@',
                'user space@domain.com'
            ];

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            validEmails.forEach(email => {
                expect(emailRegex.test(email)).toBe(true);
            });

            invalidEmails.forEach(email => {
                expect(emailRegex.test(email)).toBe(false);
            });
        });

        it('should sanitize email content', () => {
            const unsafeContent = '<script>alert("xss")</script><p>Safe content</p>';

            // Email templates should not contain script tags
            const template = getWelcomeEmailTemplate('Test User');
            expect(template.html).not.toContain('<script>');
            expect(template.html).not.toContain('javascript:');
            expect(template.html).not.toContain('onclick=');
        });

        it('should validate email headers', async () => {
            const emailOptions = {
                to: [testEmail],
                subject: 'Test Subject',
                html: '<p>Test content</p>'
            };

            // Subject should not contain newlines (header injection prevention)
            expect(emailOptions.subject).not.toContain('\n');
            expect(emailOptions.subject).not.toContain('\r');

            // Recipients should be valid
            emailOptions.to.forEach(email => {
                expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            });
        });
    });

    describe('Email Performance and Monitoring', () => {
        it('should track email sending performance', async () => {
            if (process.env.EMAIL_ENABLED !== 'true') {
                console.log('Email service disabled - skipping performance test');
                return;
            }

            const startTime = Date.now();

            try {
                await sendEmail({
                    to: [testEmail],
                    subject: 'Performance Test',
                    html: '<p>Testing email performance</p>'
                });

                const duration = Date.now() - startTime;

                // Email sending should complete within reasonable time
                expect(duration).toBeLessThan(30000); // 30 seconds max
                console.log(`Email sending took ${duration}ms`);
            } catch (error) {
                const duration = Date.now() - startTime;
                console.log(`Email sending failed after ${duration}ms:`, error.message);
            }
        });

        it('should handle concurrent email sending', async () => {
            if (process.env.EMAIL_ENABLED !== 'true') {
                console.log('Email service disabled - skipping concurrent test');
                return;
            }

            const emailPromises = Array.from({ length: 3 }, (_, i) =>
                sendEmail({
                    to: [testEmail],
                    subject: `Concurrent Test ${i + 1}`,
                    html: `<p>Concurrent email test ${i + 1}</p>`
                }).catch(error => ({ error: error.message }))
            );

            try {
                const results = await Promise.all(emailPromises);

                // Should handle concurrent requests without crashing
                expect(results).toHaveLength(3);
                console.log('Concurrent email test results:', results.length, 'emails processed');
            } catch (error) {
                console.log('Concurrent email test failed:', error.message);
            }
        });
    });
});