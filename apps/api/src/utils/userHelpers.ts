import type { Request } from 'express';
import type { IUser } from '@aiglossarypro/shared';
import { TIME_CONSTANTS } from './constants';

type UserForTransformation = Partial<IUser> & {
  [key: string]: unknown;
};

interface IAdminUser extends Omit<IUser, 'purchaseDate'> {
  role: string;
  isActive: boolean;
  isAdmin: boolean;
  lifetimeAccess: boolean;
  subscriptionTier?: string;
  purchaseDate?: Date | string;
  lastLoginAt?: Date | string;
  termsViewed: number;
  favoriteTerms: number;
}

/**
 * Transform raw user data to public user object
 */
export function transformUserForPublic(user: UserForTransformation): Partial<IUser> {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName || (user.first_name as string | undefined),
    lastName: user.lastName || (user.last_name as string | undefined),
    profileImageUrl: user.profileImageUrl || (user.profile_image_url as string | undefined),
    createdAt: user.createdAt || (user.created_at as Date | undefined),
  };
}

/**
 * Transform user for admin view (includes additional fields)
 */
export function transformUserForAdmin(user: UserForTransformation): Partial<IAdminUser> {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName || (user.first_name as string | undefined),
    lastName: user.lastName || (user.last_name as string | undefined),
    profileImageUrl: user.profileImageUrl || (user.profile_image_url as string | undefined),
    role: (user.role as string) || 'user',
    isActive: user.isActive !== false,
    isAdmin: user.isAdmin || false,
    lifetimeAccess: user.lifetimeAccess || Boolean(user.lifetime_access) || false,
    subscriptionTier:
      user.subscriptionTier ||
      (typeof user.subscription_tier === 'string' ? user.subscription_tier : undefined),
    purchaseDate:
      user.purchaseDate ||
      (user.purchase_date && typeof user.purchase_date !== 'object'
        ? (user.purchase_date as Date | string)
        : undefined) ||
      undefined,
    createdAt:
      user.createdAt ||
      (user.created_at && typeof user.created_at !== 'object'
        ? (user.created_at as Date)
        : undefined),
    lastLoginAt:
      user.lastLoginAt ||
      (user.last_login_at &&
      (typeof user.last_login_at === 'string' || user.last_login_at instanceof Date)
        ? user.last_login_at
        : undefined),
    termsViewed:
      (user.termsViewed as number | undefined) || (user.terms_viewed as number | undefined) || 0,
    favoriteTerms:
      (user.favoriteTerms as number | undefined) ||
      (user.favorite_terms as number | undefined) ||
      0,
  };
}

/**
 * Extract user from request (supports multiple auth types)
 */
export function extractUserFromRequest(req: Request): Partial<IUser> | null {
  const user = (req as any).user;
  // JWT auth
  if (user?.claims) {
    return {
      id: user.claims.sub,
      email: user.claims.email,
      firstName: user.claims.first_name,
      lastName: user.claims.last_name,
    };
  }

  // Session auth
  if (user?.id) {
    return transformUserForPublic(user);
  }

  // OAuth
  if (user?.provider) {
    return {
      id: user.id,
      email: user.emails?.[0]?.value || user.email,
      firstName: user.name?.givenName,
      lastName: user.name?.familyName,
      profileImageUrl: user.photos?.[0]?.value,
    };
  }

  return null;
}

/**
 * Check if user has access to premium features
 */
export function hasUserAccess(user: UserForTransformation): boolean {
  if (!user) {return false;}

  // Admin always has access
  if (user.isAdmin || user.role === 'admin') {return true;}

  // Check lifetime access
  if (user.lifetimeAccess || user.lifetime_access) {return true;}

  // Check active subscription
  if (user.subscriptionTier && user.subscriptionTier !== 'free') {return true;}

  // Check purchase date (if within trial period)
  if (user.purchaseDate || user.purchase_date) {
    const purchaseDate = new Date(
      (user.purchaseDate || user.purchase_date) as string | number | Date
    );
    // Use time constants for trial period calculation (7 days)
    const trialEndDate = new Date(purchaseDate.getTime() + 7 * TIME_CONSTANTS.MILLISECONDS_IN_DAY);

    if (new Date() <= trialEndDate) {return true;}
  }

  return false;
}

/**
 * Sanitize user object for public display
 */
export function sanitizeUser(user: UserForTransformation): Partial<UserForTransformation> {
  const sanitized = { ...user };

  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.passwordHash;
  delete sanitized.password_hash;
  delete sanitized.resetToken;
  delete sanitized.reset_token;
  delete sanitized.verificationToken;
  delete sanitized.verification_token;
  delete sanitized.stripeCustomerId;
  delete sanitized.stripe_customer_id;
  delete sanitized.gumroadUserId;
  delete sanitized.gumroad_user_id;

  return sanitized;
}

/**
 * Build user display name
 */
export function getUserDisplayName(user: UserForTransformation): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }

  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }

  if (user.firstName || user.first_name) {
    return (user.firstName || user.first_name) as string;
  }

  if (user.email) {
    return user.email.split('@')[0];
  }

  return 'User';
}
