import { and, desc, eq } from 'drizzle-orm';
import { Router } from 'express';
import { z } from 'zod';
import {
  type ABTestMetrics as ABTestMetricsType,
  abTestEvents,
  abTestMetrics,
  abTests,
} from '../../shared/abTestingSchema';
import { db } from '../db';
import { authenticateToken } from '../middleware/adminAuth';
import { validateRequest } from '../middleware/validateRequest';
import { calculateStatisticalSignificance, determineWinner } from '../utils/statistics';

import logger from '../utils/logger';
const router = Router();

// Schema for A/B test data sync
const abTestSyncSchema = z.object({
  testId: z.string(),
  variant: z.string(),
  metrics: z.object({
    pageViews: z.number(),
    seeWhatsInsideClicks: z.number(),
    ctaClicks: z.number(),
    trialSignups: z.number(),
    newsletterSignups: z.number(),
  }),
  sessionDuration: z.number(),
  deviceType: z.string(),
  browser: z.string(),
  timestamp: z.string(),
});

// Schema for creating A/B test
const createABTestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  variants: z.array(z.string()).min(2),
  trafficSplit: z.record(z.string(), z.number()).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  successMetric: z.string(),
});

// Sync A/B test data from client
router.post('/sync', validateRequest(abTestSyncSchema), async (req, res) => {
  try {
    const { testId, variant, metrics, sessionDuration, deviceType, browser, timestamp } = req.body;

    // Store raw event data
    await db.insert(abTestEvents).values({
      testId,
      variant,
      eventType: 'session_metrics',
      properties: {
        ...metrics,
        sessionDuration,
        deviceType,
        browser,
      },
      timestamp: new Date(timestamp),
    });

    // Update aggregated metrics
    const existingMetrics = await db
      .select()
      .from(abTestMetrics)
      .where(and(eq(abTestMetrics.testId, testId), eq(abTestMetrics.variant, variant)))
      .limit(1);

    const existingMetric = existingMetrics[0];
    if (existingMetric) {
      // Update existing metrics
      await db
        .update(abTestMetrics)
        .set({
          pageViews: existingMetric.pageViews + metrics.pageViews,
          seeWhatsInsideClicks: existingMetric.seeWhatsInsideClicks + metrics.seeWhatsInsideClicks,
          ctaClicks: existingMetric.ctaClicks + metrics.ctaClicks,
          trialSignups: existingMetric.trialSignups + metrics.trialSignups,
          newsletterSignups: existingMetric.newsletterSignups + metrics.newsletterSignups,
          totalSessions: existingMetric.totalSessions + 1,
          avgSessionDuration:
            ((existingMetric.avgSessionDuration || 0) * existingMetric.totalSessions +
              sessionDuration) /
            (existingMetric.totalSessions + 1),
          deviceBreakdown: {
            ...(existingMetric.deviceBreakdown as any),
            [deviceType]: ((existingMetric.deviceBreakdown as any)?.[deviceType] || 0) + 1,
          },
          browserBreakdown: {
            ...(existingMetric.browserBreakdown as any),
            [browser]: ((existingMetric.browserBreakdown as any)?.[browser] || 0) + 1,
          },
          updatedAt: new Date(),
        })
        .where(and(eq(abTestMetrics.testId, testId), eq(abTestMetrics.variant, variant)));
    } else {
      // Create new metrics record
      await db.insert(abTestMetrics).values({
        testId,
        variant,
        pageViews: metrics.pageViews,
        seeWhatsInsideClicks: metrics.seeWhatsInsideClicks,
        ctaClicks: metrics.ctaClicks,
        trialSignups: metrics.trialSignups,
        newsletterSignups: metrics.newsletterSignups,
        totalSessions: 1,
        avgSessionDuration: sessionDuration,
        deviceBreakdown: {
          [deviceType]: 1,
        },
        browserBreakdown: {
          [browser]: 1,
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error syncing A/B test data:', error);
    res.status(500).json({ error: 'Failed to sync A/B test data' });
  }
});

// Get A/B test results
router.get('/results/:testId', async (req, res) => {
  try {
    const { testId } = req.params;

    // Get all metrics for this test
    const metrics = await db.select().from(abTestMetrics).where(eq(abTestMetrics.testId, testId));

    if (!metrics.length) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Calculate conversion rates and statistical significance
    const results = metrics.map((m: ABTestMetricsType) => ({
      variant: m.variant,
      metrics: {
        pageViews: m.pageViews,
        seeWhatsInsideClicks: m.seeWhatsInsideClicks,
        ctaClicks: m.ctaClicks,
        trialSignups: m.trialSignups,
        newsletterSignups: m.newsletterSignups,
        totalSessions: m.totalSessions,
        avgSessionDuration: m.avgSessionDuration,
        deviceBreakdown: m.deviceBreakdown,
        browserBreakdown: m.browserBreakdown,
      },
      conversionRates: {
        seeWhatsInside: m.pageViews > 0 ? (m.seeWhatsInsideClicks / m.pageViews) * 100 : 0,
        cta: m.pageViews > 0 ? (m.ctaClicks / m.pageViews) * 100 : 0,
        trial: m.pageViews > 0 ? (m.trialSignups / m.pageViews) * 100 : 0,
        newsletter: m.pageViews > 0 ? (m.newsletterSignups / m.pageViews) * 100 : 0,
      },
      conversionRate: m.pageViews > 0 ? (m.trialSignups / m.pageViews) * 100 : 0,
    }));

    // Calculate statistical significance if we have 2 variants
    if (results.length === 2) {
      const control = results[0];
      const variant = results[1];

      const significance = {
        cta: calculateStatisticalSignificance(
          control.metrics.ctaClicks,
          control.metrics.pageViews,
          variant.metrics.ctaClicks,
          variant.metrics.pageViews
        ),
        trial: calculateStatisticalSignificance(
          control.metrics.trialSignups,
          control.metrics.pageViews,
          variant.metrics.trialSignups,
          variant.metrics.pageViews
        ),
      };

      const winner = determineWinner(results, 'trial');

      res.json({
        testId,
        results,
        significance,
        winner,
        status: 'active',
      });
    } else {
      res.json({
        testId,
        results,
        status: 'active',
      });
    }
  } catch (error) {
    logger.error('Error fetching A/B test results:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

// Get all active A/B tests
router.get('/active', authenticateToken, async (_req, res) => {
  try {
    const tests = await db.select().from(abTests).where(eq(abTests.status, 'running'));
    res.json({
      success: true,
      data: tests,
    });
  } catch (error) {
    logger.error('Error fetching active tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active tests',
    });
  }
});

// Create new A/B test (admin only)
router.post('/create', authenticateToken, validateRequest(createABTestSchema), async (req, res) => {
  try {
    const { name, description, variants, trafficSplit, startDate, endDate, successMetric } =
      req.body;

    // Create the test
    const [test] = await db
      .insert(abTests)
      .values({
        name,
        description,
        variants,
        trafficSplit: trafficSplit || {},
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        successMetric,
        status: 'active',
        createdBy: req.user?.id,
      })
      .returning();

    res.json(test);
  } catch (error) {
    logger.error('Error creating A/B test:', error);
    res.status(500).json({ error: 'Failed to create A/B test' });
  }
});

// End an A/B test (admin only)
router.post('/end/:testId', authenticateToken, async (req, res) => {
  try {
    const { testId } = req.params;

    // Get final results
    const metrics = await db.select().from(abTestMetrics).where(eq(abTestMetrics.testId, testId));

    // Determine winner
    const results = metrics.map((m: ABTestMetricsType) => ({
      variant: m.variant,
      conversionRate: m.pageViews > 0 ? (m.trialSignups / m.pageViews) * 100 : 0,
    }));

    const winner = determineWinner(results, 'trial');

    // Update test status
    const [test] = await db
      .update(abTests)
      .set({
        status: 'completed',
        endDate: new Date(),
        winner: winner?.variant,
        finalResults: results,
      })
      .where(eq(abTests.id, testId))
      .returning();

    res.json(test);
  } catch (error) {
    logger.error('Error ending A/B test:', error);
    res.status(500).json({ error: 'Failed to end A/B test' });
  }
});

// Get historical test results
router.get('/history', authenticateToken, async (_req, res) => {
  try {
    const tests = await db
      .select()
      .from(abTests)
      .where(eq(abTests.status, 'completed'))
      .orderBy(desc(abTests.endDate))
      .limit(50);

    res.json(tests);
  } catch (error) {
    logger.error('Error fetching test history:', error);
    res.status(500).json({ error: 'Failed to fetch test history' });
  }
});

export default router;
