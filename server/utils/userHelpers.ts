import type { IUser } from '../../shared/types';

/**
 * Transform raw user data to public user object
 */
export function transformUserForPublic(user: any): Partial<IUser> {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName || user.first_name,
    lastName: user.lastName || user.last_name,
    profileImageUrl: user.profileImageUrl || user.profile_image_url,
    createdAt: user.createdAt || user.created_at,
    updatedAt: user.updatedAt || user.updated_at
  };
}

/**
 * Transform user for admin view (includes additional fields)
 */
export function transformUserForAdmin(user: any): any {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName || user.first_name,
    lastName: user.lastName || user.last_name,
    profileImageUrl: user.profileImageUrl || user.profile_image_url,
    role: user.role || 'user',
    isActive: user.isActive !== false,
    isAdmin: user.isAdmin || false,
    lifetimeAccess: user.lifetimeAccess || user.lifetime_access || false,
    subscriptionTier: user.subscriptionTier || user.subscription_tier,
    purchaseDate: user.purchaseDate || user.purchase_date,
    createdAt: user.createdAt || user.created_at,
    updatedAt: user.updatedAt || user.updated_at,
    lastLoginAt: user.lastLoginAt || user.last_login_at,
    termsViewed: user.termsViewed || user.terms_viewed || 0,
    favoriteTerms: user.favoriteTerms || user.favorite_terms || 0
  };
}

/**
 * Extract user from request (supports multiple auth types)
 */
export function extractUserFromRequest(req: any): Partial<IUser> | null {
  // JWT auth
  if (req.user?.claims) {
    return {
      id: req.user.claims.sub,
      email: req.user.claims.email,
      firstName: req.user.claims.first_name,
      lastName: req.user.claims.last_name
    };
  }
  
  // Session auth
  if (req.user?.id) {
    return transformUserForPublic(req.user);
  }
  
  // OAuth
  if (req.user?.provider) {
    return {
      id: req.user.id,
      email: req.user.emails?.[0]?.value || req.user.email,
      firstName: req.user.name?.givenName,
      lastName: req.user.name?.familyName,
      profileImageUrl: req.user.photos?.[0]?.value
    };
  }
  
  return null;
}

/**
 * Check if user has access to premium features
 */
export function hasUserAccess(user: any): boolean {
  if (!user) return false;
  
  // Admin always has access
  if (user.isAdmin || user.role === 'admin') return true;
  
  // Check lifetime access
  if (user.lifetimeAccess || user.lifetime_access) return true;
  
  // Check active subscription
  if (user.subscriptionTier && user.subscriptionTier !== 'free') return true;
  
  // Check purchase date (if within trial period)
  if (user.purchaseDate || user.purchase_date) {
    const purchaseDate = new Date(user.purchaseDate || user.purchase_date);
    const trialEndDate = new Date(purchaseDate);
    trialEndDate.setDate(trialEndDate.getDate() + 7); // 7-day trial
    
    if (new Date() <= trialEndDate) return true;
  }
  
  return false;
}

/**
 * Sanitize user object for public display
 */
export function sanitizeUser(user: any): any {
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
export function getUserDisplayName(user: any): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`;
  }
  
  if (user.firstName || user.first_name) {
    return user.firstName || user.first_name;
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'User';
}