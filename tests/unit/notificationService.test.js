import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { notificationService } from '../../server/services/notificationService';
import nodemailer from 'nodemailer';
// Mock dependencies
vi.mock('nodemailer');
vi.mock('../../server/utils/logger', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }
}));
describe('NotificationService', () => {
    let mockTransporter;
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock nodemailer transporter
        mockTransporter = {
            sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' }),
            verify: vi.fn().mockResolvedValue(true)
        };
        nodemailer.createTransport.mockReturnValue(mockTransporter);
        // Set up environment variables
        process.env.SMTP_HOST = 'smtp.test.com';
        process.env.SMTP_PORT = '587';
        process.env.SMTP_USER = 'test@example.com';
        process.env.SMTP_PASS = 'test-password';
        process.env.SMTP_FROM = 'noreply@example.com';
        process.env.ADMIN_EMAIL = 'admin@example.com';
        process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test';
    });
    afterEach(() => {
        vi.resetModules();
    });
    describe('sendNotification', () => {
        it('should send email notification successfully', async () => {
            const notification = {
                type: 'error',
                priority: 'high',
                subject: 'Test Error',
                message: 'This is a test error',
                context: {
                    errorCode: 'TEST001',
                    timestamp: new Date().toISOString()
                }
            };
            const result = await notificationService.sendNotification(notification);
            expect(result.success).toBe(true);
            expect(result.messageId).toBe('test-message-id');
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'admin@example.com',
                subject: expect.stringContaining('Test Error'),
                html: expect.stringContaining('This is a test error')
            }));
        });
        it('should handle email sending failure', async () => {
            mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));
            const notification = {
                type: 'error',
                priority: 'low',
                subject: 'Test',
                message: 'Test message'
            };
            const result = await notificationService.sendNotification(notification);
            expect(result.success).toBe(false);
            expect(result.error).toContain('SMTP error');
        });
        it('should send Slack notification for critical priority', async () => {
            // Mock fetch for Slack webhook
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                text: () => Promise.resolve('ok')
            });
            const notification = {
                type: 'system',
                priority: 'critical',
                subject: 'Critical System Alert',
                message: 'System is down!',
                slackChannel: '#alerts'
            };
            const result = await notificationService.sendNotification(notification);
            expect(result.success).toBe(true);
            expect(global.fetch).toHaveBeenCalledWith('https://hooks.slack.com/test', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('Critical System Alert')
            }));
        });
    });
    describe('sendBatchNotifications', () => {
        it('should send multiple notifications', async () => {
            const notifications = [
                {
                    type: 'info',
                    priority: 'low',
                    subject: 'Info 1',
                    message: 'Message 1'
                },
                {
                    type: 'warning',
                    priority: 'medium',
                    subject: 'Warning 1',
                    message: 'Message 2'
                }
            ];
            const results = await notificationService.sendBatchNotifications(notifications);
            expect(results).toHaveLength(2);
            expect(results.every(r => r.success)).toBe(true);
            expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
        });
        it('should continue sending after individual failures', async () => {
            mockTransporter.sendMail
                .mockRejectedValueOnce(new Error('First failed'))
                .mockResolvedValueOnce({ messageId: 'second-success' });
            const notifications = [
                {
                    type: 'error',
                    priority: 'high',
                    subject: 'Error 1',
                    message: 'Will fail'
                },
                {
                    type: 'info',
                    priority: 'low',
                    subject: 'Info 1',
                    message: 'Will succeed'
                }
            ];
            const results = await notificationService.sendBatchNotifications(notifications);
            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(false);
            expect(results[1].success).toBe(true);
        });
    });
    describe('getNotificationStats', () => {
        it('should return notification statistics', () => {
            const stats = notificationService.getNotificationStats();
            expect(stats).toHaveProperty('totalSent');
            expect(stats).toHaveProperty('totalFailed');
            expect(stats).toHaveProperty('byType');
            expect(stats).toHaveProperty('byPriority');
            expect(stats.totalSent).toBeGreaterThanOrEqual(0);
            expect(stats.totalFailed).toBeGreaterThanOrEqual(0);
        });
    });
    describe('clearNotificationQueue', () => {
        it('should clear pending notifications', () => {
            const cleared = notificationService.clearNotificationQueue();
            expect(cleared).toBeGreaterThanOrEqual(0);
        });
    });
    describe('internal methods', () => {
        it('should validate notification data', () => {
            const invalidNotification = {
                type: 'invalid',
                priority: 'high',
                subject: '',
                message: ''
            };
            expect(async () => {
                await notificationService.sendNotification(invalidNotification);
            }).rejects.toThrow();
        });
        it('should format email content correctly', async () => {
            const notification = {
                type: 'error',
                priority: 'high',
                subject: 'Test Error',
                message: 'Error details',
                context: {
                    userId: 'user123',
                    action: 'login'
                },
                metadata: {
                    timestamp: new Date().toISOString(),
                    source: 'auth-service'
                }
            };
            await notificationService.sendNotification(notification);
            expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                html: expect.stringContaining('Error details'),
                html: expect.stringContaining('userId'),
                html: expect.stringContaining('user123')
            }));
        });
    });
});
