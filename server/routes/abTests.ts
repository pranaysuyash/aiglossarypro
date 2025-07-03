import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { validateRequest } from '../middleware/validateRequest';
import { authenticateToken } from '../middleware/adminAuth';
import { calculateStatisticalSignificance, determineWinner } from '../utils/statistics';
import {
  abTests,
  abTestMetrics,
  abTestEvents,
  type ABTest,
  type ABTestMetrics as ABTestMetricsType
} from '../../shared/enhancedSchema';

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
    newsletterSignups: z.number()
  }),
  sessionDuration: z.number(),
  deviceType: z.string(),
  browser: z.string(),
  timestamp: z.string()
});

// Schema for creating A/B test
const createABTestSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  variants: z.array(z.string()).min(2),
  trafficSplit: z.record(z.string(), z.number()).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  successMetric: z.string()
});

// Sync A/B test data from client
router.post('/sync', validateRequest(abTestSyncSchema), async (req, res) => {
  try {
    const { testId, variant, metrics, sessionDuration, deviceType, browser, timestamp } = req.body;

    // Store raw event data
    await prisma.aBTestEvent.create({
      data: {
        testId,
        variant,
        eventType: 'session_metrics',
        properties: {
          ...metrics,
          sessionDuration,
          deviceType,
          browser
        },
        timestamp: new Date(timestamp)
      }
    });

    // Update aggregated metrics
    const existingMetrics = await prisma.aBTestMetrics.findUnique({
      where: {
        testId_variant: {
          testId,
          variant
        }
      }
    });

    if (existingMetrics) {
      // Update existing metrics
      await prisma.aBTestMetrics.update({
        where: {
          testId_variant: {
            testId,
            variant
          }
        },
        data: {
          pageViews: existingMetrics.pageViews + metrics.pageViews,
          seeWhatsInsideClicks: existingMetrics.seeWhatsInsideClicks + metrics.seeWhatsInsideClicks,
          ctaClicks: existingMetrics.ctaClicks + metrics.ctaClicks,
          trialSignups: existingMetrics.trialSignups + metrics.trialSignups,
          newsletterSignups: existingMetrics.newsletterSignups + metrics.newsletterSignups,
          totalSessions: existingMetrics.totalSessions + 1,
          avgSessionDuration: ((existingMetrics.avgSessionDuration * existingMetrics.totalSessions) + sessionDuration) / (existingMetrics.totalSessions + 1),
          deviceBreakdown: {
            ...existingMetrics.deviceBreakdown as any,
            [deviceType]: ((existingMetrics.deviceBreakdown as any)[deviceType] || 0) + 1
          },
          browserBreakdown: {
            ...existingMetrics.browserBreakdown as any,
            [browser]: ((existingMetrics.browserBreakdown as any)[browser] || 0) + 1
          },
          updatedAt: new Date()
        }
      });
    } else {
      // Create new metrics record
      await prisma.aBTestMetrics.create({
        data: {
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
            [deviceType]: 1
          },
          browserBreakdown: {
            [browser]: 1
          }
        }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing A/B test data:', error);
    res.status(500).json({ error: 'Failed to sync A/B test data' });
  }
});

// Get A/B test results
router.get('/results/:testId', async (req, res) => {
  try {
    const { testId } = req.params;

    // Get all metrics for this test
    const metrics = await prisma.aBTestMetrics.findMany({
      where: { testId }
    });

    if (!metrics.length) {
      return res.status(404).json({ error: 'Test not found' });
    }

    // Calculate conversion rates and statistical significance
    const results = metrics.map(m => ({
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
        browserBreakdown: m.browserBreakdown
      },
      conversionRates: {
        seeWhatsInside: m.pageViews > 0 ? (m.seeWhatsInsideClicks / m.pageViews) * 100 : 0,
        cta: m.pageViews > 0 ? (m.ctaClicks / m.pageViews) * 100 : 0,
        trial: m.pageViews > 0 ? (m.trialSignups / m.pageViews) * 100 : 0,
        newsletter: m.pageViews > 0 ? (m.newsletterSignups / m.pageViews) * 100 : 0
      }
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
        )
      };

      const winner = determineWinner(results, 'trial');

      res.json({
        testId,
        results,
        significance,
        winner,
        status: 'active'
      });
    } else {
      res.json({
        testId,
        results,
        status: 'active'
      });
    }
  } catch (error) {
    console.error('Error fetching A/B test results:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

// Get all active A/B tests
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const tests = await db.select().from(abTests).where(eq(abTests.status, 'running'));
    res.json({
      success: true,
      data: tests
    });
  } catch (error) {
    console.error('Error fetching active tests:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch active tests' 
    });
  }
});

// Create new A/B test (admin only)
router.post('/create', authenticateToken, validateRequest(createABTestSchema), async (req, res) => {
  try {
    const { name, description, variants, trafficSplit, startDate, endDate, successMetric } = req.body;

    // Create the test
    const test = await prisma.aBTest.create({
      data: {
        name,
        description,
        variants,
        trafficSplit: trafficSplit || {},
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined,
        successMetric,
        status: 'active',
        createdBy: req.user!.id
      }
    });

    res.json(test);
  } catch (error) {
    console.error('Error creating A/B test:', error);
    res.status(500).json({ error: 'Failed to create A/B test' });
  }
});

// End an A/B test (admin only)
router.post('/end/:testId', authenticateToken, async (req, res) => {
  try {
    const { testId } = req.params;

    // Get final results
    const metrics = await prisma.aBTestMetrics.findMany({
      where: { testId }
    });

    // Determine winner
    const results = metrics.map(m => ({
      variant: m.variant,
      conversionRate: m.pageViews > 0 ? (m.trialSignups / m.pageViews) * 100 : 0
    }));

    const winner = determineWinner(results, 'trial');

    // Update test status
    const test = await prisma.aBTest.update({
      where: { id: testId },
      data: {
        status: 'completed',
        endDate: new Date(),
        winner: winner?.variant,
        finalResults: results
      }
    });

    res.json(test);
  } catch (error) {
    console.error('Error ending A/B test:', error);
    res.status(500).json({ error: 'Failed to end A/B test' });
  }
});

// Get historical test results
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const tests = await prisma.aBTest.findMany({
      where: {
        status: 'completed'
      },
      orderBy: {
        endDate: 'desc'
      },
      take: 50
    });

    res.json(tests);
  } catch (error) {
    console.error('Error fetching test history:', error);
    res.status(500).json({ error: 'Failed to fetch test history' });
  }
});

export default router;