import crypto from 'crypto';
import { optimizedStorage as storage } from "../optimizedStorage";
import { log } from '../utils/logger';
import { PRICING_CONSTANTS, ORDER_CONSTANTS, ENVIRONMENT_CONSTANTS } from '../utils/constants';

export interface GrantLifetimeAccessOptions {
  email: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  purchaseData?: any;
  grantedBy?: string;
  isTestPurchase?: boolean;
}

export interface LifetimeAccessResult {
  userId: string;
  email: string;
  wasExistingUser: boolean;
  lifetimeAccess: boolean;
}

/**
 * Service for managing user lifecycle and access rights
 * Centralizes logic for granting lifetime access across webhook, manual grant, and test endpoints
 */
export class UserService {
  
  /**
   * Grants lifetime access to a user, creating them if they don't exist
   * Used by Gumroad webhook, manual grant, and test purchase endpoints
   */
  static async grantLifetimeAccess(options: GrantLifetimeAccessOptions): Promise<LifetimeAccessResult> {
    const { email, orderId, amount = PRICING_CONSTANTS.LIFETIME_PRICE_CENTS, currency = PRICING_CONSTANTS.CURRENCY_USD, purchaseData, grantedBy, isTestPurchase = false } = options;
    
    log.info('Granting lifetime access', {
      email: email.substring(0, 3) + '***',
      orderId,
      amount,
      isTest: isTestPurchase,
      grantedBy
    });
    
    // Find existing user
    let existingUser;
    try {
      existingUser = await storage.getUserByEmail(email);
    } catch (error) {
      log.warn('Error finding user by email', {
        email: email.substring(0, 3) + '***',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      existingUser = null;
    }
    
    let userId: string;
    const wasExistingUser = !!existingUser;
    
    if (!existingUser) {
      // Create new user with lifetime access
      userId = crypto.randomUUID();
      await storage.upsertUser({
        id: userId,
        email: email,
        subscriptionTier: 'lifetime',
        lifetimeAccess: true,
        purchaseDate: new Date(),
        dailyViews: 0,
        lastViewReset: new Date(),
      });
      
      log.info('Created new user with lifetime access', {
        userId,
        email: email.substring(0, 3) + '***',
        isTest: isTestPurchase
      });
    } else {
      // Update existing user to lifetime access
      await storage.updateUser(existingUser.id, {
        subscriptionTier: 'lifetime',
        lifetimeAccess: true,
        purchaseDate: new Date(),
      });
      userId = existingUser.id;
      
      log.info('Updated existing user to lifetime access', {
        userId,
        email: email.substring(0, 3) + '***',
        isTest: isTestPurchase
      });
    }
    
    // Record purchase if orderId provided
    if (orderId) {
      await this.recordPurchase({
        userId,
        orderId,
        amount,
        currency,
        purchaseData,
        grantedBy,
        isTestPurchase
      });
    }
    
    return {
      userId,
      email,
      wasExistingUser,
      lifetimeAccess: true
    };
  }
  
  /**
   * Records a purchase in the database
   * Handles both real purchases and test/manual grants
   */
  private static async recordPurchase(options: {
    userId: string;
    orderId: string;
    amount: number;
    currency: string;
    purchaseData?: any;
    grantedBy?: string;
    isTestPurchase?: boolean;
  }): Promise<void> {
    const { userId, orderId, amount, currency, purchaseData, grantedBy, isTestPurchase } = options;
    
    try {
      const finalPurchaseData = isTestPurchase 
        ? {
            test_purchase: true,
            environment: 'development',
            amount_cents: amount,
            currency,
            order_id: orderId,
            created_at: new Date().toISOString(),
            ...purchaseData
          }
        : grantedBy 
          ? {
              manual_grant: true,
              granted_by: grantedBy,
              granted_at: new Date().toISOString(),
              ...purchaseData
            }
          : purchaseData;
      
      await storage.createPurchase({
        userId,
        gumroadOrderId: orderId,
        amount,
        currency,
        status: 'completed',
        purchaseData: finalPurchaseData,
      });
      
      log.info('Purchase recorded successfully', {
        userId,
        orderId,
        amount,
        isTest: isTestPurchase,
        isManual: !!grantedBy
      });
    } catch (error) {
      log.error('Failed to record purchase', {
        userId,
        orderId,
        amount,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Don't throw here - purchase recording failure shouldn't block user access grant
      // The main operation (granting access) has already succeeded
    }
  }
  
  /**
   * Generates a test order ID for development purchases
   */
  static generateTestOrderId(): string {
    return `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Validates that an email is provided and properly formatted
   */
  static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Gets a user's access status by email
   */
  static async getUserAccessStatus(email: string): Promise<{
    hasAccess: boolean;
    user?: any;
    subscriptionTier?: string;
    purchaseDate?: Date;
  }> {
    try {
      const user = await storage.getUserByEmail(email);
      
      if (!user || !user.lifetimeAccess) {
        return { hasAccess: false };
      }
      
      return {
        hasAccess: true,
        user: {
          email: user.email,
          subscriptionTier: user.subscriptionTier,
          lifetimeAccess: user.lifetimeAccess,
          purchaseDate: user.purchaseDate,
        },
        subscriptionTier: user.subscriptionTier,
        purchaseDate: user.purchaseDate
      };
    } catch (error) {
      log.error('Error checking user access status', {
        email: email.substring(0, 3) + '***',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return { hasAccess: false };
    }
  }
}