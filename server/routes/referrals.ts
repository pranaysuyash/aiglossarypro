import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { pool } from '../db';
import { nanoid } from 'nanoid';

const router = Router();

// Validation schemas
const generateCodeSchema = z.object({
  customCode: z.string().optional(),
});

const trackReferralSchema = z.object({
  referralCode: z.string(),
  action: z.enum(['signup', 'purchase', 'activation']),
  metadata: z.record(z.any()).optional(),
});

// Referral configuration
const REFERRAL_CONFIG = {
  REWARD_AMOUNT: 5, // Base reward amount in USD
  REFERRER_BONUS: 5, // Bonus for referrer
  REFEREE_BONUS: 5, // Bonus for new user
  EXPIRY_DAYS: 30, // Days until referral expires
  TIERS: [
    { name: 'Starter', minReferrals: 0, rewardMultiplier: 1.0, bonusPercentage: 0 },
    { name: 'Advocate', minReferrals: 5, rewardMultiplier: 1.6, bonusPercentage: 10 },
    { name: 'Champion', minReferrals: 15, rewardMultiplier: 2.4, bonusPercentage: 20 },
    { name: 'Legend', minReferrals: 50, rewardMultiplier: 4.0, bonusPercentage: 30 }
  ]
};

/**
 * Generate referral code for user
 */
router.post('/generate-code', requireAuth, async (req, res) => {
  try {
    const { customCode } = generateCodeSchema.parse(req.body);
    const userId = req.user!.uid;

    // Check if user already has a referral code
    const existingCode = await pool.query(
      'SELECT referral_code FROM user_referrals WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (existingCode.rows.length > 0) {
      return res.json({
        success: true,
        referralCode: existingCode.rows[0].referral_code,
        message: 'Using existing referral code'
      });
    }

    // Generate unique referral code
    let referralCode = customCode || `AI${nanoid(8).toUpperCase()}`;
    
    // Ensure code is unique
    while (true) {
      const existing = await pool.query(
        'SELECT id FROM user_referrals WHERE referral_code = $1',
        [referralCode]
      );
      
      if (existing.rows.length === 0) break;
      referralCode = `AI${nanoid(8).toUpperCase()}`;
    }

    // Create referral code record
    await pool.query(`
      INSERT INTO user_referrals (user_id, referral_code, is_active, created_at)
      VALUES ($1, $2, true, NOW())
    `, [userId, referralCode]);

    res.json({
      success: true,
      referralCode,
      referralLink: `${process.env.FRONTEND_URL}/?ref=${referralCode}`,
      message: 'Referral code generated successfully'
    });

  } catch (error) {
    console.error('Generate referral code error:', error);
    res.status(500).json({
      error: 'Failed to generate referral code',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get user referral statistics
 */
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.uid;

    // Get user's referral code
    const referralCodeResult = await pool.query(
      'SELECT referral_code FROM user_referrals WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (referralCodeResult.rows.length === 0) {
      return res.json({
        totalReferrals: 0,
        successfulReferrals: 0,
        pendingReferrals: 0,
        totalRewards: 0,
        availableRewards: 0,
        referralCode: null,
        referralLink: null,
        recentReferrals: []
      });
    }

    const referralCode = referralCodeResult.rows[0].referral_code;

    // Get referral statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_referrals,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_referrals,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN reward_amount ELSE 0 END), 0) as total_rewards,
        COALESCE(SUM(CASE WHEN status = 'completed' AND claimed = false THEN reward_amount ELSE 0 END), 0) as available_rewards
      FROM referral_tracking 
      WHERE referrer_code = $1
    `;

    const statsResult = await pool.query(statsQuery, [referralCode]);
    const stats = statsResult.rows[0];

    // Get recent referral activity
    const recentReferralsQuery = `
      SELECT 
        id,
        referred_email,
        status,
        reward_amount,
        created_at,
        completed_at
      FROM referral_tracking 
      WHERE referrer_code = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    const recentReferralsResult = await pool.query(recentReferralsQuery, [referralCode]);

    res.json({
      totalReferrals: parseInt(stats.total_referrals),
      successfulReferrals: parseInt(stats.successful_referrals),
      pendingReferrals: parseInt(stats.pending_referrals),
      totalRewards: parseFloat(stats.total_rewards),
      availableRewards: parseFloat(stats.available_rewards),
      referralCode,
      referralLink: `${process.env.FRONTEND_URL}/?ref=${referralCode}`,
      recentReferrals: recentReferralsResult.rows.map(row => ({
        id: row.id,
        email: row.referred_email,
        status: row.status,
        reward: parseFloat(row.reward_amount),
        createdAt: row.created_at,
        completedAt: row.completed_at
      }))
    });

  } catch (error) {
    console.error('Get referral stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch referral statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Track referral action (signup, purchase, etc.)
 */
router.post('/track', async (req, res) => {
  try {
    const { referralCode, action, metadata } = trackReferralSchema.parse(req.body);

    // Get referrer information
    const referrerResult = await pool.query(
      'SELECT user_id FROM user_referrals WHERE referral_code = $1 AND is_active = true',
      [referralCode]
    );

    if (referrerResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Invalid referral code'
      });
    }

    const referrerId = referrerResult.rows[0].user_id;

    // Calculate current tier and rewards
    const tierResult = await pool.query(`
      SELECT COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_referrals
      FROM referral_tracking 
      WHERE referrer_code = $1
    `, [referralCode]);

    const successfulReferrals = parseInt(tierResult.rows[0].successful_referrals);
    const currentTier = REFERRAL_CONFIG.TIERS
      .slice()
      .reverse()
      .find(tier => successfulReferrals >= tier.minReferrals) || REFERRAL_CONFIG.TIERS[0];

    const baseReward = REFERRAL_CONFIG.REWARD_AMOUNT;
    const tierMultiplier = currentTier.rewardMultiplier;
    const rewardAmount = baseReward * tierMultiplier;

    // Track the referral action
    const trackingResult = await pool.query(`
      INSERT INTO referral_tracking (
        referrer_user_id,
        referrer_code,
        referred_email,
        action_type,
        status,
        reward_amount,
        tier_at_completion,
        metadata,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id
    `, [
      referrerId,
      referralCode,
      metadata?.email || 'unknown@example.com',
      action,
      action === 'purchase' ? 'completed' : 'pending',
      rewardAmount,
      currentTier.name,
      JSON.stringify(metadata || {})
    ]);

    // If this is a completed purchase, update user rewards
    if (action === 'purchase') {
      await pool.query(`
        UPDATE users 
        SET referral_credits = COALESCE(referral_credits, 0) + $1,
            updated_at = NOW()
        WHERE uid = $2
      `, [rewardAmount, referrerId]);

      // Send notification to referrer (you can implement email/push notifications here)
      console.log(`Referral reward processed: User ${referrerId} earned $${rewardAmount}`);
    }

    res.json({
      success: true,
      trackingId: trackingResult.rows[0].id,
      rewardAmount: action === 'purchase' ? rewardAmount : 0,
      status: action === 'purchase' ? 'completed' : 'pending',
      message: action === 'purchase' 
        ? `Referral completed! Reward of $${rewardAmount} added to account.`
        : 'Referral tracked successfully'
    });

  } catch (error) {
    console.error('Track referral error:', error);
    res.status(500).json({
      error: 'Failed to track referral',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Validate referral code (for signup flow)
 */
router.get('/validate/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await pool.query(`
      SELECT 
        ur.user_id,
        ur.referral_code,
        u.email as referrer_email,
        u.first_name as referrer_name
      FROM user_referrals ur
      JOIN users u ON ur.user_id = u.uid
      WHERE ur.referral_code = $1 AND ur.is_active = true
    `, [code]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        valid: false,
        error: 'Invalid or expired referral code'
      });
    }

    const referrer = result.rows[0];

    res.json({
      valid: true,
      referralCode: referrer.referral_code,
      referrerName: referrer.referrer_name,
      referrerEmail: referrer.referrer_email,
      bonus: REFERRAL_CONFIG.REFEREE_BONUS
    });

  } catch (error) {
    console.error('Validate referral code error:', error);
    res.status(500).json({
      valid: false,
      error: 'Failed to validate referral code'
    });
  }
});

/**
 * Get referral leaderboard (optional feature)
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const leaderboardQuery = `
      SELECT 
        u.first_name,
        u.last_name,
        COUNT(rt.id) as total_referrals,
        COUNT(CASE WHEN rt.status = 'completed' THEN 1 END) as successful_referrals,
        COALESCE(SUM(CASE WHEN rt.status = 'completed' THEN rt.reward_amount ELSE 0 END), 0) as total_rewards
      FROM users u
      JOIN user_referrals ur ON u.uid = ur.user_id
      LEFT JOIN referral_tracking rt ON ur.referral_code = rt.referrer_code
      WHERE ur.is_active = true
      GROUP BY u.uid, u.first_name, u.last_name
      HAVING COUNT(CASE WHEN rt.status = 'completed' THEN 1 END) > 0
      ORDER BY successful_referrals DESC, total_rewards DESC
      LIMIT $1
    `;

    const result = await pool.query(leaderboardQuery, [limit]);

    res.json({
      leaderboard: result.rows.map((row, index) => ({
        rank: index + 1,
        name: `${row.first_name} ${row.last_name}`,
        totalReferrals: parseInt(row.total_referrals),
        successfulReferrals: parseInt(row.successful_referrals),
        totalRewards: parseFloat(row.total_rewards)
      }))
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Claim referral rewards
 */
router.post('/claim', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.uid;

    // Get user's available rewards
    const rewardsQuery = `
      SELECT 
        rt.id,
        rt.reward_amount
      FROM referral_tracking rt
      JOIN user_referrals ur ON rt.referrer_code = ur.referral_code
      WHERE ur.user_id = $1 
        AND rt.status = 'completed' 
        AND rt.claimed = false
    `;

    const rewardsResult = await pool.query(rewardsQuery, [userId]);

    if (rewardsResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'No rewards available to claim'
      });
    }

    const totalRewards = rewardsResult.rows.reduce(
      (sum, row) => sum + parseFloat(row.reward_amount), 
      0
    );

    // Mark rewards as claimed
    const rewardIds = rewardsResult.rows.map(row => row.id);
    await pool.query(`
      UPDATE referral_tracking 
      SET claimed = true, claimed_at = NOW()
      WHERE id = ANY($1)
    `, [rewardIds]);

    // Add credits to user account
    await pool.query(`
      UPDATE users 
      SET referral_credits = COALESCE(referral_credits, 0) + $1,
          updated_at = NOW()
      WHERE uid = $2
    `, [totalRewards, userId]);

    res.json({
      success: true,
      claimedAmount: totalRewards,
      rewardsClaimed: rewardsResult.rows.length,
      message: `Successfully claimed $${totalRewards} in referral rewards!`
    });

  } catch (error) {
    console.error('Claim rewards error:', error);
    res.status(500).json({
      error: 'Failed to claim rewards',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;