import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Simple A/B test configuration (in-memory for now)
const AB_TEST_CONFIG = {
  landing_bg_test: {
    id: 'landing_bg_test_2025',
    name: 'Landing Page Background Test',
    variants: ['neural', 'code', 'geometric', 'default', 'fallback'],
    trafficSplit: {
      neural: 0.2,
      code: 0.2,
      geometric: 0.2,
      default: 0.2,
      fallback: 0.2,
    },
    status: 'running',
  },
};

// Schema for tracking events
const eventTrackingSchema = z.object({
  testId: z.string(),
  sessionId: z.string(),
  variant: z.string(),
  eventType: z.string(),
  eventData: z.record(z.any()).optional(),
  userAgent: z.string().optional(),
  deviceType: z.string().optional(),
});

// Get active A/B test configuration
router.get('/config/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const config = AB_TEST_CONFIG[testId as keyof typeof AB_TEST_CONFIG];

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Test not found',
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error fetching test config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test configuration',
    });
  }
});

// Track A/B test event (simplified logging for now)
router.post('/track', async (req, res) => {
  try {
    const validatedData = eventTrackingSchema.parse(req.body);

    // For now, just log the event
    console.log('A/B Test Event:', {
      timestamp: new Date().toISOString(),
      ...validatedData,
    });

    res.json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event data',
        errors: error.errors,
      });
    }

    console.error('Error tracking event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event',
    });
  }
});

// Get test results (simplified)
router.get('/results/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const config = AB_TEST_CONFIG[testId as keyof typeof AB_TEST_CONFIG];

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Test not found',
      });
    }

    // Return mock results for now
    const mockResults = {
      testId,
      status: config.status,
      variants: config.variants.map(variant => ({
        variant,
        sessions: Math.floor(Math.random() * 1000) + 100,
        conversions: Math.floor(Math.random() * 50) + 10,
        conversionRate: (Math.random() * 0.1 + 0.02).toFixed(3),
      })),
    };

    res.json({
      success: true,
      data: mockResults,
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch test results',
    });
  }
});

export default router;
