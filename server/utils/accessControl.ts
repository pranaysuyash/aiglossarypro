/**
 * Access control utilities for feature gating and permissions
 */
import type { IUser } from '../../shared/types';

type UserWithAccessControl = Partial<IUser> & {
  role?: string;
  lifetimeAccess?: boolean;
  lifetime_access?: boolean;
  subscriptionTier?: string;
  purchaseDate?: Date | string;
  purchase_date?: Date | string;
  lastViewReset?: Date | string;
  dailyViews?: number;
  created_at?: Date | string;
};

export interface AccessControlConfig {
  dailyLimitFree: number;
  trialDays: number;
  adminBypassLimits: boolean;
}

export const defaultAccessConfig: AccessControlConfig = {
  dailyLimitFree: 50,
  trialDays: 7,
  adminBypassLimits: true,
};

/**
 * Check if user has premium access (lifetime or subscription)
 */
export function hasPremiumAccess(user: UserWithAccessControl): boolean {
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
 * Check if user is in trial period (7 days unlimited access for new accounts)
 */
export function isInTrialPeriod(
  user: UserWithAccessControl,
  config: AccessControlConfig = defaultAccessConfig
): boolean {
  if (!user) return false;

  // Premium users don't need trial
  if (hasPremiumAccess(user)) return false;

  // Check account creation date for trial
  const creationDateValue = user.createdAt || user.created_at;
  if (creationDateValue) {
    const createdDate = new Date(creationDateValue);
    const trialEndDate = new Date(createdDate);
    trialEndDate.setDate(trialEndDate.getDate() + config.trialDays);

    return new Date() <= trialEndDate;
  }

  return false;
}

/**
 * Check if user has any access (premium, trial, or free tier)
 */
export function hasUserAccess(
  user: UserWithAccessControl,
  config: AccessControlConfig = defaultAccessConfig
): boolean {
  if (!user) return false;

  // Premium access
  if (hasPremiumAccess(user)) return true;

  // No trial period - removed

  // Free tier has limited access
  return true; // Free users can still access with daily limits
}

/**
 * Calculate daily usage limits for user
 */
export function getDailyLimits(
  user: UserWithAccessControl,
  config: AccessControlConfig = defaultAccessConfig
): { limit: number; isUnlimited: boolean } {
  if (!user) {
    return { limit: config.dailyLimitFree, isUnlimited: false };
  }

  // Premium users have unlimited access
  if (hasPremiumAccess(user)) {
    return { limit: Number.MAX_SAFE_INTEGER, isUnlimited: true };
  }

  // No trial period - free users get daily limits immediately

  // Free tier users have daily limits
  return { limit: config.dailyLimitFree, isUnlimited: false };
}

/**
 * Calculate remaining daily views for user
 */
export function getRemainingDailyViews(
  user: UserWithAccessControl,
  config: AccessControlConfig = defaultAccessConfig
): { remaining: number; dailyViews: number; limit: number } {
  const { limit, isUnlimited } = getDailyLimits(user, config);

  if (isUnlimited) {
    return { remaining: Number.MAX_SAFE_INTEGER, dailyViews: 0, limit };
  }

  // Calculate remaining views for today
  const now = new Date();
  const lastReset = user?.lastViewReset
    ? new Date(user.lastViewReset)
    : new Date(user?.createdAt || new Date());
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
 * @param {any} user The user object
 * @param {string} [termId] The ID of the term being viewed (optional)
 * @param {AccessControlConfig} [config] The access control configuration
 * @returns {{canView: boolean, reason: string, metadata?: any}}
 */
export function canViewTerm(
  user: UserWithAccessControl,
  config: AccessControlConfig = defaultAccessConfig
): { canView: boolean; reason: string; metadata?: any } {
  if (!user) {
    return { canView: false, reason: 'not_authenticated' };
  }

  // Premium access
  if (hasPremiumAccess(user)) {
    return { canView: true, reason: 'premium_access' };
  }

  // No trial period - removed

  // Free tier - check daily limits
  const { remaining, dailyViews, limit } = getRemainingDailyViews(user, config);

  if (remaining <= 0) {
    return {
      canView: false,
      reason: 'daily_limit_reached',
      metadata: { dailyViews, limit, remaining: 0 },
    };
  }

  return {
    canView: true,
    reason: 'within_daily_limit',
    metadata: { dailyViews, limit, remaining },
  };
}

/**
 * Check if user can perform admin actions
 * @param {any} user The user object
 * @returns {boolean}
 */
export function canPerformAdminAction(user: UserWithAccessControl): boolean {
  if (!user) return false;

  // Check if user is admin
  if (user.isAdmin || user.role === 'admin') return true;

  // Could add more granular permissions here based on action type
  return false;
}

/**
 * Check if user can access premium features
 * @param {any} user The user object
 * @returns {boolean}
 */
export function canAccessPremiumFeature(user: UserWithAccessControl): boolean {
  if (!user) return false;

  // Admin can access all features
  if (canPerformAdminAction(user)) return true;

  // Premium users can access premium features
  if (hasPremiumAccess(user)) return true;

  // No trial period - removed

  return false;
}

/**
 * Get user access status summary
 */
export function getUserAccessStatus(
  user: UserWithAccessControl,
  config: AccessControlConfig = defaultAccessConfig
): {
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
      isAdmin: false,
    };
  }

  const isAdmin = canPerformAdminAction(user);
  const isPremium = hasPremiumAccess(user);
  const dailyLimits = getRemainingDailyViews(user, config);

  let accessType: 'premium' | 'free' | 'none' = 'none';
  if (isPremium) accessType = 'premium';
  else accessType = 'free';

  return {
    hasAccess: hasUserAccess(user, config),
    accessType,
    dailyLimits,
    canAccessPremiumFeatures: canAccessPremiumFeature(user),
    isAdmin,
  };
}
