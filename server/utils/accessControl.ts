import type { User } from "../../shared/schema";

/**
 * Access control utilities for feature gating and permissions
 */

export interface AccessControlConfig {
  dailyLimitFree: number;
  trialDays: number;
  adminBypassLimits: boolean;
}

export const defaultAccessConfig: AccessControlConfig = {
  dailyLimitFree: 50,
  trialDays: 7,
  adminBypassLimits: true
};

/**
 * Check if user has premium access (lifetime or subscription)
 */
export function hasPremiumAccess(user: any): boolean {
  if (!user) return false;
  
  // Admin always has access
  if (user.isAdmin || user.role === 'admin') return true;
  
  // Check lifetime access
  if (user.lifetimeAccess || user.lifetime_access) return true;
  
  // Check active subscription
  if (user.subscriptionTier && user.subscriptionTier !== 'free') return true;
  
  return false;
}

/**
 * Check if user is in trial period
 */
export function isInTrialPeriod(user: any, config: AccessControlConfig = defaultAccessConfig): boolean {
  if (!user) return false;
  
  // Check purchase date (if within trial period)
  if (user.purchaseDate || user.purchase_date) {
    const purchaseDate = new Date(user.purchaseDate || user.purchase_date);
    const trialEndDate = new Date(purchaseDate);
    trialEndDate.setDate(trialEndDate.getDate() + config.trialDays);
    
    if (new Date() <= trialEndDate) return true;
  }
  
  return false;
}

/**
 * Check if user has any access (premium, trial, or free tier)
 */
export function hasUserAccess(user: any, config: AccessControlConfig = defaultAccessConfig): boolean {
  if (!user) return false;
  
  // Premium access
  if (hasPremiumAccess(user)) return true;
  
  // Trial period access
  if (isInTrialPeriod(user, config)) return true;
  
  // Free tier has limited access
  return true; // Free users can still access with daily limits
}

/**
 * Calculate daily usage limits for user
 */
export function getDailyLimits(user: any, config: AccessControlConfig = defaultAccessConfig): { limit: number; isUnlimited: boolean } {
  if (!user) {
    return { limit: config.dailyLimitFree, isUnlimited: false };
  }
  
  // Premium users have unlimited access
  if (hasPremiumAccess(user)) {
    return { limit: Number.MAX_SAFE_INTEGER, isUnlimited: true };
  }
  
  // Trial users have unlimited access during trial
  if (isInTrialPeriod(user, config)) {
    return { limit: Number.MAX_SAFE_INTEGER, isUnlimited: true };
  }
  
  // Free tier users have daily limits
  return { limit: config.dailyLimitFree, isUnlimited: false };
}

/**
 * Calculate remaining daily views for user
 */
export function getRemainingDailyViews(user: any, config: AccessControlConfig = defaultAccessConfig): { remaining: number; dailyViews: number; limit: number } {
  const { limit, isUnlimited } = getDailyLimits(user, config);
  
  if (isUnlimited) {
    return { remaining: Number.MAX_SAFE_INTEGER, dailyViews: 0, limit };
  }
  
  // Calculate remaining views for today
  const now = new Date();
  const lastReset = user?.lastViewReset ? new Date(user.lastViewReset) : new Date(user?.createdAt || new Date());
  const isSameDay = now.toDateString() === lastReset.toDateString();
  
  let dailyViews = 0;
  if (isSameDay) {
    dailyViews = user?.dailyViews || 0;
  }
  
  const remaining = Math.max(0, limit - dailyViews);
  
  return { remaining, dailyViews, limit };
}

/**
 * Check if user can view a specific term
 */
export function canViewTerm(user: any, termId?: string, config: AccessControlConfig = defaultAccessConfig): { canView: boolean; reason: string; metadata?: any } {
  if (!user) {
    return { canView: false, reason: 'not_authenticated' };
  }
  
  // Premium access
  if (hasPremiumAccess(user)) {
    return { canView: true, reason: 'premium_access' };
  }
  
  // Trial period access
  if (isInTrialPeriod(user, config)) {
    return { canView: true, reason: 'trial_period' };
  }
  
  // Free tier - check daily limits
  const { remaining, dailyViews, limit } = getRemainingDailyViews(user, config);
  
  if (remaining <= 0) {
    return { 
      canView: false, 
      reason: 'daily_limit_reached',
      metadata: { dailyViews, limit, remaining: 0 }
    };
  }
  
  return { 
    canView: true, 
    reason: 'within_daily_limit',
    metadata: { dailyViews, limit, remaining }
  };
}

/**
 * Check if user can perform admin actions
 */
export function canPerformAdminAction(user: any, action: string): boolean {
  if (!user) return false;
  
  // Check if user is admin
  if (user.isAdmin || user.role === 'admin') return true;
  
  // Could add more granular permissions here based on action type
  return false;
}

/**
 * Check if user can access premium features
 */
export function canAccessPremiumFeature(user: any, feature: string): boolean {
  if (!user) return false;
  
  // Admin can access all features
  if (canPerformAdminAction(user, 'access_premium_features')) return true;
  
  // Premium users can access premium features
  if (hasPremiumAccess(user)) return true;
  
  // Trial users can access premium features during trial
  if (isInTrialPeriod(user)) return true;
  
  return false;
}

/**
 * Get user access status summary
 */
export function getUserAccessStatus(user: any, config: AccessControlConfig = defaultAccessConfig): {
  hasAccess: boolean;
  accessType: 'premium' | 'trial' | 'free' | 'none';
  dailyLimits: ReturnType<typeof getRemainingDailyViews>;
  canAccessPremiumFeatures: boolean;
  isAdmin: boolean;
} {
  if (!user) {
    return {
      hasAccess: false,
      accessType: 'none',
      dailyLimits: { remaining: 0, dailyViews: 0, limit: 0 },
      canAccessPremiumFeatures: false,
      isAdmin: false
    };
  }
  
  const isAdmin = canPerformAdminAction(user, 'admin_access');
  const isPremium = hasPremiumAccess(user);
  const isTrial = isInTrialPeriod(user, config);
  const dailyLimits = getRemainingDailyViews(user, config);
  
  let accessType: 'premium' | 'trial' | 'free' | 'none' = 'none';
  if (isPremium) accessType = 'premium';
  else if (isTrial) accessType = 'trial';
  else accessType = 'free';
  
  return {
    hasAccess: hasUserAccess(user, config),
    accessType,
    dailyLimits,
    canAccessPremiumFeatures: canAccessPremiumFeature(user, 'premium'),
    isAdmin
  };
}