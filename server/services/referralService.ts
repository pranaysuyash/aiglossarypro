import { db } from '../db';
import {
  users,
  referralPayouts,
  referralLinks,
  referralClicks,
  type InsertReferralPayout,
  type InsertReferralLink,
  type InsertReferralClick,
} from '../../shared/schema';
import { eq, and, desc, count, sum, sql } from 'drizzle-orm';
import { log as logger } from '../utils/logger';
import crypto from 'crypto';

export interface GumroadSaleData {
  sale_id: string;
  product_id: string;
  product_name: string;
  permalink: string;
  product_permalink: string;
  short_product_id: string;
  email: string;
  price: number;
  gumroad_fee: number;
  currency: string;
  quantity: number;
  discover_fee_charged: boolean;
  can_contact: boolean;
  referrer: string;
  order_number: number;
  sale_timestamp: string;
  purchaser_id: string;
  subscription_id?: string;
  variants?: Record<string, any>;
  license_key?: string;
  ip_country: string;
  recurrence?: string;
  is_gift_receiver_purchase: boolean;
  refunded: boolean;
  dispute?: string;
  cancelled: boolean;
  affiliate?: string;
  test?: boolean;
}

export interface ReferralStats {
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  conversionRate: number;
  clickCount: number;
  activeLinks: number;
}

export class ReferralService {
  private static readonly REFERRAL_PERCENTAGE = 30; // 30% commission
  private static readonly MIN_PAYOUT_AMOUNT = 1000; // $10.00 minimum payout

  /**
   * Process referral payout for a Gumroad sale
   */
  static async processReferralPayout(saleData: GumroadSaleData): Promise<void> {
    try {
      // Skip test orders in production
      if (saleData.test && process.env.NODE_ENV === 'production') {
        logger.info('Skipping test order for referral processing', {
          saleId: saleData.sale_id,
        });
        return;
      }

      // Find the referred user by email
      const [referredUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, saleData.email))
        .limit(1);

      if (!referredUser) {
        logger.info('No user found for referral processing', {
          email: saleData.email,
          saleId: saleData.sale_id,
        });
        return;
      }

      if (!referredUser.referrerId) {
        logger.info('User has no referrer', {
          userId: referredUser.id,
          email: saleData.email,
          saleId: saleData.sale_id,
        });
        return;
      }

      // Check if payout already exists for this order
      const [existingPayout] = await db
        .select()
        .from(referralPayouts)
        .where(eq(referralPayouts.gumroadOrderId, saleData.sale_id))
        .limit(1);

      if (existingPayout) {
        logger.info('Referral payout already exists for this order', {
          payoutId: existingPayout.id,
          saleId: saleData.sale_id,
        });
        return;
      }

      // Calculate payout amount
      const purchaseAmountCents = Math.round(saleData.price * 100);
      const payoutAmountCents = Math.round(
        purchaseAmountCents * (this.REFERRAL_PERCENTAGE / 100)
      );

      // Create referral payout record
      const [newPayout] = await db
        .insert(referralPayouts)
        .values({
          referrerId: referredUser.referrerId,
          referredUserId: referredUser.id,
          gumroadOrderId: saleData.sale_id,
          purchaseAmountCents,
          referralPercentage: this.REFERRAL_PERCENTAGE,
          payoutAmountCents,
          status: 'pending',
        })
        .returning();

      // Update referral link conversion count if applicable
      await this.updateReferralLinkConversion(referredUser.id);

      // Process the actual payout if it meets minimum threshold
      if (payoutAmountCents >= this.MIN_PAYOUT_AMOUNT) {
        await this.processGumroadPayout(newPayout.id, {
          referrerId: referredUser.referrerId,
          payoutAmountCents,
          orderId: saleData.sale_id,
        });
      }

      logger.info('Referral payout created successfully', {
        payoutId: newPayout.id,
        referrerId: referredUser.referrerId,
        referredUserId: referredUser.id,
        payoutAmount: payoutAmountCents,
        saleId: saleData.sale_id,
      });
    } catch (error) {
      logger.error('Error processing referral payout', {
        error: error instanceof Error ? error.message : String(error),
        saleId: saleData.sale_id,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Generate a unique referral code for a user
   */
  static async generateReferralCode(userId: string, campaignName?: string): Promise<string> {
    const baseCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    let referralCode = baseCode;
    let attempts = 0;
    const maxAttempts = 10;

    // Ensure uniqueness
    while (attempts < maxAttempts) {
      const [existing] = await db
        .select()
        .from(referralLinks)
        .where(eq(referralLinks.referralCode, referralCode))
        .limit(1);

      if (!existing) {
        break;
      }

      attempts++;
      referralCode = `${baseCode}${attempts}`;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique referral code');
    }

    // Create the referral link
    const [newLink] = await db
      .insert(referralLinks)
      .values({
        userId,
        referralCode,
        campaignName,
        isActive: true,
        clickCount: 0,
        conversionCount: 0,
      })
      .returning();

    logger.info('Generated new referral code', {
      userId,
      referralCode,
      linkId: newLink.id,
      campaignName,
    });

    return referralCode;
  }

  /**
   * Track a referral click
   */
  static async trackReferralClick(
    referralCode: string,
    context: {
      ipAddress?: string;
      userAgent?: string;
      referer?: string;
      countryCode?: string;
      utm?: Record<string, string>;
      sessionId?: string;
    }
  ): Promise<void> {
    try {
      // Find the referral link
      const [referralLink] = await db
        .select()
        .from(referralLinks)
        .where(
          and(
            eq(referralLinks.referralCode, referralCode),
            eq(referralLinks.isActive, true)
          )
        )
        .limit(1);

      if (!referralLink) {
        logger.warn('Referral code not found or inactive', { referralCode });
        return;
      }

      // Hash IP address for privacy
      const hashedIp = context.ipAddress
        ? crypto.createHash('sha256').update(context.ipAddress).digest('hex').substring(0, 16)
        : null;

      // Record the click
      await db.insert(referralClicks).values({
        referralLinkId: referralLink.id,
        referralCode,
        ipAddress: hashedIp,
        userAgent: context.userAgent,
        referer: context.referer,
        countryCode: context.countryCode,
        utm: context.utm || {},
        sessionId: context.sessionId,
        converted: false,
      });

      // Increment click count
      await db
        .update(referralLinks)
        .set({
          clickCount: sql`${referralLinks.clickCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(referralLinks.id, referralLink.id));

      logger.info('Referral click tracked', {
        referralCode,
        linkId: referralLink.id,
        sessionId: context.sessionId,
      });
    } catch (error) {
      logger.error('Error tracking referral click', {
        error: error instanceof Error ? error.message : String(error),
        referralCode,
      });
    }
  }

  /**
   * Set referrer for a user (when they sign up via referral)
   */
  static async setUserReferrer(userId: string, referralCode: string): Promise<boolean> {
    try {
      // Find the referral link and referrer
      const [referralLink] = await db
        .select({
          id: referralLinks.id,
          referrerId: referralLinks.userId,
        })
        .from(referralLinks)
        .where(
          and(
            eq(referralLinks.referralCode, referralCode),
            eq(referralLinks.isActive, true)
          )
        )
        .limit(1);

      if (!referralLink) {
        logger.warn('Invalid referral code when setting referrer', {
          userId,
          referralCode,
        });
        return false;
      }

      // Prevent self-referral
      if (referralLink.referrerId === userId) {
        logger.warn('User attempted to refer themselves', {
          userId,
          referralCode,
        });
        return false;
      }

      // Update user's referrer
      await db
        .update(users)
        .set({
          referrerId: referralLink.referrerId,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      logger.info('User referrer set successfully', {
        userId,
        referrerId: referralLink.referrerId,
        referralCode,
      });

      return true;
    } catch (error) {
      logger.error('Error setting user referrer', {
        error: error instanceof Error ? error.message : String(error),
        userId,
        referralCode,
      });
      return false;
    }
  }

  /**
   * Get referral statistics for a user
   */
  static async getReferralStats(userId: string): Promise<ReferralStats> {
    try {
      // Get payout statistics
      const payoutStats = await db
        .select({
          totalReferrals: count(referralPayouts.id),
          totalEarnings: sum(
            sql`CASE WHEN ${referralPayouts.status} = 'processed' THEN ${referralPayouts.payoutAmountCents} ELSE 0 END`
          ),
          pendingEarnings: sum(
            sql`CASE WHEN ${referralPayouts.status} = 'pending' THEN ${referralPayouts.payoutAmountCents} ELSE 0 END`
          ),
        })
        .from(referralPayouts)
        .where(eq(referralPayouts.referrerId, userId));

      // Get link statistics
      const linkStats = await db
        .select({
          totalClicks: sum(referralLinks.clickCount),
          totalConversions: sum(referralLinks.conversionCount),
          activeLinks: count(
            sql`CASE WHEN ${referralLinks.isActive} = true THEN 1 END`
          ),
        })
        .from(referralLinks)
        .where(eq(referralLinks.userId, userId));

      const stats = payoutStats[0];
      const links = linkStats[0];

      const totalClicks = Number(links.totalClicks) || 0;
      const totalConversions = Number(links.totalConversions) || 0;

      return {
        totalReferrals: Number(stats.totalReferrals) || 0,
        totalEarnings: Number(stats.totalEarnings) || 0,
        pendingEarnings: Number(stats.pendingEarnings) || 0,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        clickCount: totalClicks,
        activeLinks: Number(links.activeLinks) || 0,
      };
    } catch (error) {
      logger.error('Error getting referral stats', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Get user's referral links
   */
  static async getUserReferralLinks(userId: string) {
    try {
      return await db
        .select()
        .from(referralLinks)
        .where(eq(referralLinks.userId, userId))
        .orderBy(desc(referralLinks.createdAt));
    } catch (error) {
      logger.error('Error getting user referral links', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Get recent referral payouts for a user
   */
  static async getUserReferralPayouts(userId: string, limit = 10) {
    try {
      return await db
        .select({
          id: referralPayouts.id,
          referredUserId: referralPayouts.referredUserId,
          gumroadOrderId: referralPayouts.gumroadOrderId,
          purchaseAmountCents: referralPayouts.purchaseAmountCents,
          payoutAmountCents: referralPayouts.payoutAmountCents,
          status: referralPayouts.status,
          processedAt: referralPayouts.processedAt,
          createdAt: referralPayouts.createdAt,
          referredUserEmail: users.email,
          referredUserName: sql<string>`COALESCE(${users.firstName} || ' ' || ${users.lastName}, ${users.email})`,
        })
        .from(referralPayouts)
        .leftJoin(users, eq(users.id, referralPayouts.referredUserId))
        .where(eq(referralPayouts.referrerId, userId))
        .orderBy(desc(referralPayouts.createdAt))
        .limit(limit);
    } catch (error) {
      logger.error('Error getting user referral payouts', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Update referral link conversion count
   */
  private static async updateReferralLinkConversion(referredUserId: string): Promise<void> {
    try {
      // Find recent referral clicks for this user's session
      const recentClicks = await db
        .select()
        .from(referralClicks)
        .where(
          and(
            eq(referralClicks.converted, false),
            sql`${referralClicks.createdAt} > NOW() - INTERVAL '30 days'`
          )
        )
        .orderBy(desc(referralClicks.createdAt))
        .limit(10);

      if (recentClicks.length === 0) return;

      // Mark the most recent click as converted
      const latestClick = recentClicks[0];
      
      await db
        .update(referralClicks)
        .set({
          converted: true,
          convertedAt: new Date(),
        })
        .where(eq(referralClicks.id, latestClick.id));

      // Increment conversion count on the referral link
      await db
        .update(referralLinks)
        .set({
          conversionCount: sql`${referralLinks.conversionCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(referralLinks.id, latestClick.referralLinkId));

      logger.info('Referral link conversion updated', {
        clickId: latestClick.id,
        referralCode: latestClick.referralCode,
        referredUserId,
      });
    } catch (error) {
      logger.error('Error updating referral link conversion', {
        error: error instanceof Error ? error.message : String(error),
        referredUserId,
      });
    }
  }

  /**
   * Process Gumroad payout (placeholder for actual API integration)
   */
  private static async processGumroadPayout(
    payoutId: string,
    options: {
      referrerId: string;
      payoutAmountCents: number;
      orderId: string;
    }
  ): Promise<void> {
    try {
      // TODO: Implement actual Gumroad API call for affiliate payout
      // This would use Gumroad's affiliate/partner API
      
      logger.info('Gumroad payout API call needed', {
        payoutId,
        ...options,
        payoutAmountDollars: options.payoutAmountCents / 100,
      });

      // For now, mark as processed (in production, this would be done after successful API call)
      if (process.env.NODE_ENV === 'development') {
        await db
          .update(referralPayouts)
          .set({
            status: 'processed',
            processedAt: new Date(),
            gumroadPayoutId: `dev_payout_${Date.now()}`,
            updatedAt: new Date(),
          })
          .where(eq(referralPayouts.id, payoutId));

        logger.info('Development: Marked referral payout as processed', {
          payoutId,
        });
      }
    } catch (error) {
      // Mark payout as failed
      await db
        .update(referralPayouts)
        .set({
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          updatedAt: new Date(),
        })
        .where(eq(referralPayouts.id, payoutId));

      logger.error('Error processing Gumroad payout', {
        error: error instanceof Error ? error.message : String(error),
        payoutId,
        ...options,
      });
      throw error;
    }
  }

  /**
   * Retry failed payouts
   */
  static async retryFailedPayouts(): Promise<void> {
    try {
      const failedPayouts = await db
        .select()
        .from(referralPayouts)
        .where(eq(referralPayouts.status, 'failed'))
        .limit(50);

      for (const payout of failedPayouts) {
        if (payout.payoutAmountCents >= this.MIN_PAYOUT_AMOUNT) {
          await this.processGumroadPayout(payout.id, {
            referrerId: payout.referrerId,
            payoutAmountCents: payout.payoutAmountCents,
            orderId: payout.gumroadOrderId,
          });
        }
      }

      logger.info('Processed failed payout retry batch', {
        failedCount: failedPayouts.length,
      });
    } catch (error) {
      logger.error('Error retrying failed payouts', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}