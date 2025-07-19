import { sql } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import { db } from '../db';

import logger from '../utils/logger';
interface RateLimitConfig {
  dailyLimit: number;
  gracePeriodDays: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  dailyLimit: 50, // terms per day for new accounts
  gracePeriodDays: 7, // grace period for new accounts
};

// Track daily term views for rate limiting
export async function trackTermView(userId: string, termId: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if user has premium access or is in grace period
    const userInfo = await db.execute(sql`
      SELECT created_at, lifetime_access FROM users WHERE id = ${userId}
    `);

    if (!userInfo.rows || userInfo.rows.length === 0) {
      return true; // Allow if user not found (shouldn't happen)
    }

    const user = userInfo.rows[0] as any;

    // Premium users have unlimited access
    if (user.lifetime_access) {
      logger.info(`User ${userId} has premium access - unlimited views`);
      return true;
    }

    const userCreatedAt = new Date(user.created_at);
    const daysSinceCreation = Math.floor(
      (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Apply rate limiting only to accounts older than grace period
    if (daysSinceCreation <= DEFAULT_CONFIG.gracePeriodDays) {
      logger.info(
        `User ${userId} is in grace period (${daysSinceCreation}/${DEFAULT_CONFIG.gracePeriodDays} days)`
      );
      return true; // Allow unlimited access during grace period
    }

    // Count today's views for this user
    const viewCount = await db.execute(sql`
      SELECT COUNT(*) as count 
      FROM user_term_views 
      WHERE user_id = ${userId} 
      AND DATE(viewed_at) = ${today}
    `);

    const todayViews = Number((viewCount.rows[0] as any)?.count || 0);

    // Check if over daily limit
    if (todayViews >= DEFAULT_CONFIG.dailyLimit) {
      logger.warn(`Rate limit exceeded for user ${userId}: ${todayViews} views today`);
      return false;
    }

    // Log the view
    await db.execute(sql`
      INSERT INTO user_term_views (user_id, term_id, viewed_at)
      VALUES (${userId}, ${termId}, NOW())
      ON CONFLICT (user_id, term_id, DATE(viewed_at)) 
      DO UPDATE SET viewed_at = NOW()
    `);

    return true;
  } catch (error) {
    logger.error('Rate limiting error:', error);
    return true; // Fail open to avoid blocking legitimate users
  }
}

// Middleware for term viewing endpoints
export function rateLimitMiddleware(req: Request, _res: Response, next: NextFunction) {
  // Only apply to authenticated users viewing terms
  if (!req.user?.claims?.sub || !req.params.id) {
    return next();
  }

  const userId = req.user.claims.sub;
  const termId = req.params.id;

  trackTermView(userId, termId)
    .then(allowed => {
      if (!allowed) {
        // Instead of blocking, set a flag to indicate preview mode
        (req as any).previewMode = true;
        (req as any).limitInfo = {
          dailyLimit: DEFAULT_CONFIG.dailyLimit,
          resetTime: 'tomorrow',
          reason: 'daily_limit_reached',
        };
        next();
      } else {
        next();
      }
    })
    .catch(error => {
      logger.error('Rate limit middleware error:', error);
      next(); // Fail open
    });
}

// Create the tracking table if it doesn't exist
export async function initializeRateLimiting() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_term_views (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        term_id UUID NOT NULL,
        viewed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_user_term_views_user_date 
      ON user_term_views(user_id, DATE(viewed_at))
    `);

    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_user_term_views_unique_daily
      ON user_term_views(user_id, term_id, DATE(viewed_at))
    `);

    logger.info('✅ Rate limiting table initialized');
  } catch (error) {
    logger.error('❌ Error initializing rate limiting:', error);
  }
}
