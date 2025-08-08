import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { batchAnalyticsService } from '../../server/services/batchAnalyticsService';
import * as db from '../../server/db';
import * as logger from '../../server/utils/logger';
// Mock dependencies
vi.mock('../../server/db');
vi.mock('../../server/utils/logger', () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    }
}));
describe('BatchAnalyticsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        // Mock database
        db.db = {
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            groupBy: vi.fn().mockReturnThis(),
            innerJoin: vi.fn().mockReturnThis(),
            leftJoin: vi.fn().mockReturnThis(),
            execute: vi.fn(),
            insert: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            transaction: vi.fn().mockImplementation(async (cb) => {
                const tx = {
                    select: vi.fn().mockReturnThis(),
                    from: vi.fn().mockReturnThis(),
                    where: vi.fn().mockReturnThis(),
                    insert: vi.fn().mockReturnThis(),
                    values: vi.fn().mockReturnThis(),
                    update: vi.fn().mockReturnThis(),
                    set: vi.fn().mockReturnThis(),
                    execute: vi.fn(),
                };
                return cb(tx);
            })
        };
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.resetModules();
    });
    describe('trackEvent', () => {
        it('should batch analytics events', async () => {
            const event1 = {
                event: 'page_view',
                properties: { page: '/terms/ml' },
                userId: 'user1'
            };
            const event2 = {
                event: 'term_view',
                properties: { termId: 'ml-001' },
                userId: 'user1'
            };
            batchAnalyticsService.trackEvent(event1);
            batchAnalyticsService.trackEvent(event2);
            // Events should be batched, not sent immediately
            expect(db.db.insert).not.toHaveBeenCalled();
            // Force flush
            await batchAnalyticsService.flush();
            expect(db.db.insert).toHaveBeenCalled();
            expect(db.db.values).toHaveBeenCalledWith(expect.arrayContaining([
                expect.objectContaining({
                    event: 'page_view',
                    userId: 'user1'
                }),
                expect.objectContaining({
                    event: 'term_view',
                    userId: 'user1'
                })
            ]));
        });
        it('should auto-flush when batch size is reached', async () => {
            // Assuming batch size is 100
            for (let i = 0; i < 100; i++) {
                batchAnalyticsService.trackEvent({
                    event: 'test_event',
                    properties: { index: i },
                    userId: 'user1'
                });
            }
            // Should auto-flush
            await new Promise(resolve => setTimeout(resolve, 100));
            expect(db.db.insert).toHaveBeenCalled();
        });
        it('should auto-flush based on time interval', async () => {
            batchAnalyticsService.trackEvent({
                event: 'test_event',
                properties: {},
                userId: 'user1'
            });
            // Advance timers by flush interval (e.g., 5 seconds)
            vi.advanceTimersByTime(5000);
            expect(db.db.insert).toHaveBeenCalled();
        });
    });
    describe('generateUserReport', () => {
        it('should generate comprehensive user analytics report', async () => {
            const mockUserData = {
                totalEvents: 150,
                uniqueSessions: 10,
                totalDuration: 3600, // 1 hour
                favoriteTerms: ['ML', 'AI', 'Neural Networks'],
                learningPath: ['Basic ML', 'Deep Learning', 'Advanced AI']
            };
            db.db.execute.mockResolvedValue([mockUserData]);
            const report = await batchAnalyticsService.generateUserReport('user1', {
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            expect(report.userId).toBe('user1');
            expect(report.summary).toBeDefined();
            expect(report.summary.totalEvents).toBe(150);
            expect(report.engagement).toBeDefined();
            expect(report.learningProgress).toBeDefined();
            expect(report.recommendations).toBeInstanceOf(Array);
        });
        it('should handle users with no data', async () => {
            db.db.execute.mockResolvedValue([]);
            const report = await batchAnalyticsService.generateUserReport('new-user', {
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            expect(report.userId).toBe('new-user');
            expect(report.summary.totalEvents).toBe(0);
            expect(report.recommendations).toContain(expect.objectContaining({
                type: 'onboarding'
            }));
        });
    });
    describe('generateSystemReport', () => {
        it('should generate system-wide analytics report', async () => {
            const mockSystemData = {
                totalUsers: 1000,
                activeUsers: 750,
                totalEvents: 50000,
                popularTerms: [
                    { termId: 'ml-001', views: 500 },
                    { termId: 'ai-001', views: 450 }
                ],
                userGrowth: 0.15 // 15% growth
            };
            db.db.execute.mockResolvedValue([mockSystemData]);
            const report = await batchAnalyticsService.generateSystemReport({
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            expect(report.period).toBeDefined();
            expect(report.metrics.totalUsers).toBe(1000);
            expect(report.metrics.activeUsers).toBe(750);
            expect(report.metrics.engagementRate).toBeCloseTo(0.75, 2);
            expect(report.insights).toBeInstanceOf(Array);
        });
    });
    describe('trackUserJourney', () => {
        it('should track user journey through terms', async () => {
            const journey = [
                { termId: 'basic-ml', timestamp: new Date('2024-01-01T10:00:00') },
                { termId: 'supervised-learning', timestamp: new Date('2024-01-01T10:05:00') },
                { termId: 'neural-networks', timestamp: new Date('2024-01-01T10:15:00') }
            ];
            for (const step of journey) {
                await batchAnalyticsService.trackEvent({
                    event: 'term_view',
                    properties: { termId: step.termId },
                    userId: 'user1',
                    timestamp: step.timestamp
                });
            }
            await batchAnalyticsService.flush();
            const journeyAnalysis = await batchAnalyticsService.analyzeUserJourney('user1');
            expect(journeyAnalysis.pathways).toBeDefined();
            expect(journeyAnalysis.learningVelocity).toBeDefined();
            expect(journeyAnalysis.knowledgeProgression).toBeDefined();
        });
    });
    describe('getEngagementMetrics', () => {
        it('should calculate engagement metrics', async () => {
            const mockEngagementData = [
                { date: '2024-01-01', sessions: 100, avgDuration: 300 },
                { date: '2024-01-02', sessions: 120, avgDuration: 350 },
                { date: '2024-01-03', sessions: 90, avgDuration: 280 }
            ];
            db.db.execute.mockResolvedValue(mockEngagementData);
            const metrics = await batchAnalyticsService.getEngagementMetrics({
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-03')
            });
            expect(metrics.daily).toHaveLength(3);
            expect(metrics.summary.totalSessions).toBe(310);
            expect(metrics.summary.averageDuration).toBeCloseTo(310, 0);
            expect(metrics.trends).toBeDefined();
        });
    });
    describe('getConversionFunnel', () => {
        it('should analyze conversion funnel', async () => {
            const mockFunnelData = {
                visitors: 1000,
                registered: 300,
                engaged: 200,
                converted: 50
            };
            db.db.execute.mockResolvedValue([mockFunnelData]);
            const funnel = await batchAnalyticsService.getConversionFunnel({
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-31')
            });
            expect(funnel.stages).toBeDefined();
            expect(funnel.stages).toHaveLength(4);
            expect(funnel.overallConversion).toBeCloseTo(0.05, 2); // 5%
            expect(funnel.dropoffPoints).toBeDefined();
        });
    });
    describe('error handling', () => {
        it('should handle database errors gracefully', async () => {
            db.db.insert.mockImplementation(() => {
                throw new Error('Database connection failed');
            });
            batchAnalyticsService.trackEvent({
                event: 'test_event',
                properties: {},
                userId: 'user1'
            });
            await expect(batchAnalyticsService.flush()).resolves.not.toThrow();
            expect(logger.default.error).toHaveBeenCalled();
        });
        it('should retry failed batches', async () => {
            let attempts = 0;
            db.db.execute.mockImplementation(() => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Temporary failure');
                }
                return Promise.resolve([]);
            });
            await batchAnalyticsService.flush();
            expect(attempts).toBe(3);
            expect(db.db.execute).toHaveBeenCalledTimes(3);
        });
    });
});
