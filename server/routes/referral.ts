import { Router } from 'express';
import { z } from 'zod';
import { authenticateFirebaseToken } from '../middleware/firebaseAuth';
import { ReferralService } from '../services/referralService';
import { log as logger } from '../utils/logger';

const router = Router();

// Validation schemas
const generateLinkSchema = z.object({
  campaignName: z.string().optional(),
});

const trackClickSchema = z.object({
  referralCode: z.string().min(1),
  utm: z.record(z.string()).optional(),
});

const setReferrerSchema = z.object({
  referralCode: z.string().min(1),
});

/**
 * GET /api/referral/stats
 * Get referral statistics for authenticated user
 */
router.get('/stats', authenticateFirebaseToken, async (req, res) => {
  try {
    const userId = req.firebaseUser?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const stats = await ReferralService.getReferralStats(userId);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting referral stats', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.firebaseUser?.uid,
    });
    
    res.status(500).json({
      error: 'Failed to get referral statistics',
    });
  }
});

/**
 * GET /api/referral/links
 * Get user's referral links
 */
router.get('/links', authenticateFirebaseToken, async (req, res) => {
  try {
    const userId = req.firebaseUser?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const links = await ReferralService.getUserReferralLinks(userId);
    
    res.json({
      success: true,
      data: links,
    });
  } catch (error) {
    logger.error('Error getting referral links', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.firebaseUser?.uid,
    });
    
    res.status(500).json({
      error: 'Failed to get referral links',
    });
  }
});

/**
 * POST /api/referral/links/generate
 * Generate a new referral link for authenticated user
 */
router.post('/links/generate', authenticateFirebaseToken, async (req, res) => {
  try {
    const userId = req.firebaseUser?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validation = generateLinkSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { campaignName } = validation.data;
    const referralCode = await ReferralService.generateReferralCode(userId, campaignName);
    
    // Generate the full referral URL
    const baseUrl = process.env.FRONTEND_URL || 'https://aiglossarypro.com';
    const referralUrl = `${baseUrl}?ref=${referralCode}`;
    
    res.json({
      success: true,
      data: {
        referralCode,
        referralUrl,
        campaignName,
      },
    });
  } catch (error) {
    logger.error('Error generating referral link', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.firebaseUser?.uid,
    });
    
    res.status(500).json({
      error: 'Failed to generate referral link',
    });
  }
});

/**
 * GET /api/referral/payouts
 * Get user's referral payouts history
 */
router.get('/payouts', authenticateFirebaseToken, async (req, res) => {
  try {
    const userId = req.firebaseUser?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const payouts = await ReferralService.getUserReferralPayouts(userId, limit);
    
    res.json({
      success: true,
      data: payouts,
    });
  } catch (error) {
    logger.error('Error getting referral payouts', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.firebaseUser?.uid,
    });
    
    res.status(500).json({
      error: 'Failed to get referral payouts',
    });
  }
});

/**
 * POST /api/referral/track-click
 * Track a referral click (public endpoint)
 */
router.post('/track-click', async (req, res) => {
  try {
    const validation = trackClickSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { referralCode, utm } = validation.data;
    
    // Extract context from request
    const context = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
      utm,
      sessionId: req.sessionID,
    };

    await ReferralService.trackReferralClick(referralCode, context);
    
    res.json({
      success: true,
      message: 'Referral click tracked',
    });
  } catch (error) {
    logger.error('Error tracking referral click', {
      error: error instanceof Error ? error.message : String(error),
      body: req.body,
    });
    
    res.status(500).json({
      error: 'Failed to track referral click',
    });
  }
});

/**
 * POST /api/referral/set-referrer
 * Set referrer for authenticated user (when they sign up via referral)
 */
router.post('/set-referrer', authenticateFirebaseToken, async (req, res) => {
  try {
    const userId = req.firebaseUser?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const validation = setReferrerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: validation.error.errors,
      });
    }

    const { referralCode } = validation.data;
    const success = await ReferralService.setUserReferrer(userId, referralCode);
    
    if (!success) {
      return res.status(400).json({
        error: 'Invalid referral code or self-referral attempt',
      });
    }
    
    res.json({
      success: true,
      message: 'Referrer set successfully',
    });
  } catch (error) {
    logger.error('Error setting user referrer', {
      error: error instanceof Error ? error.message : String(error),
      userId: req.firebaseUser?.uid,
      body: req.body,
    });
    
    res.status(500).json({
      error: 'Failed to set referrer',
    });
  }
});

/**
 * GET /api/referral/validate/:code
 * Validate a referral code (public endpoint)
 */
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code || code.length < 4) {
      return res.status(400).json({
        error: 'Invalid referral code format',
      });
    }

    // Track the click for validation
    const context = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
      sessionId: req.sessionID,
    };

    await ReferralService.trackReferralClick(code, context);
    
    res.json({
      success: true,
      valid: true,
      message: 'Referral code is valid',
    });
  } catch (error) {
    logger.error('Error validating referral code', {
      error: error instanceof Error ? error.message : String(error),
      code: req.params.code,
    });
    
    res.json({
      success: true,
      valid: false,
      message: 'Referral code not found',
    });
  }
});

export { router as referralRoutes };