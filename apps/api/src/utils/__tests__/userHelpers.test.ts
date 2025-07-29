import { describe, it, expect, beforeEach } from 'vitest';
import {
  transformUserForPublic,
  transformUserForAdmin,
  extractUserFromRequest,
  hasUserAccess,
  sanitizeUser,
  getUserDisplayName,
} from '../userHelpers';
import type { Request } from 'express';

describe('userHelpers', () => {
  describe('transformUserForPublic', () => {
    it('should transform user with camelCase properties', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profileImageUrl: 'https://example.com/image.jpg',
        createdAt: new Date('2024-01-01'),
      };

      const result = transformUserForPublic(user);

      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        profileImageUrl: 'https://example.com/image.jpg',
        createdAt: new Date('2024-01-01'),
      });
    });

    it('should transform user with snake_case properties', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        profile_image_url: 'https://example.com/image2.jpg',
        created_at: new Date('2024-01-01'),
      };

      const result = transformUserForPublic(user);

      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        profileImageUrl: 'https://example.com/image2.jpg',
        createdAt: new Date('2024-01-01'),
      });
    });

    it('should handle missing optional fields', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
      };

      const result = transformUserForPublic(user);

      expect(result).toEqual({
        id: '123',
        email: 'test@example.com',
        firstName: undefined,
        lastName: undefined,
        profileImageUrl: undefined,
        createdAt: undefined,
      });
    });
  });

  describe('transformUserForAdmin', () => {
    it('should include all admin fields', () => {
      const user = {
        id: '123',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true,
        lifetimeAccess: true,
        subscriptionTier: 'premium',
        purchaseDate: new Date('2023-01-01'),
        termsViewed: 150,
        favoriteTerms: 25,
      };

      const result = transformUserForAdmin(user);

      expect(result).toMatchObject({
        id: '123',
        email: 'admin@example.com',
        isAdmin: true,
        lifetimeAccess: true,
        subscriptionTier: 'premium',
        termsViewed: 150,
        favoriteTerms: 25,
      });
    });

    it('should handle snake_case fields', () => {
      const user = {
        id: '123',
        email: 'user@example.com',
        lifetime_access: true,
        subscription_tier: 'basic',
        terms_viewed: 50,
        favorite_terms: 10,
      };

      const result = transformUserForAdmin(user);

      expect(result).toMatchObject({
        lifetimeAccess: true,
        subscriptionTier: 'basic',
        termsViewed: 50,
        favoriteTerms: 10,
      });
    });

    it('should set defaults for missing fields', () => {
      const user = {
        id: '123',
        email: 'user@example.com',
      };

      const result = transformUserForAdmin(user);

      expect(result).toMatchObject({
        role: 'user',
        isActive: true,
        isAdmin: false,
        lifetimeAccess: false,
        termsViewed: 0,
        favoriteTerms: 0,
      });
    });
  });

  describe('extractUserFromRequest', () => {
    it('should extract user from JWT claims', () => {
      const req = {
        user: {
          claims: {
            sub: 'user-123',
            email: 'jwt@example.com',
            first_name: 'JWT',
            last_name: 'User',
          },
        },
      } as unknown;

      const result = extractUserFromRequest(req);

      expect(result).toEqual({
        id: 'user-123',
        email: 'jwt@example.com',
        firstName: 'JWT',
        lastName: 'User',
      });
    });

    it('should extract user from session', () => {
      const req = {
        user: {
          id: 'session-123',
          email: 'session@example.com',
          firstName: 'Session',
          lastName: 'User',
        },
      } as unknown;

      const result = extractUserFromRequest(req);

      expect(result).toMatchObject({
        id: 'session-123',
        email: 'session@example.com',
        firstName: 'Session',
        lastName: 'User',
      });
    });

    it('should extract user from OAuth provider', () => {
      const req = {
        user: {
          id: 'oauth-123',
          provider: 'google',
          emails: [{ value: 'oauth@example.com' }],
          name: {
            givenName: 'OAuth',
            familyName: 'User',
          },
          photos: [{ value: 'https://example.com/photo.jpg' }],
        },
      } as unknown;

      const result = extractUserFromRequest(req);

      // OAuth extraction returns a transformed user through transformUserForPublic
      expect(result).toMatchObject({
        id: 'oauth-123',
      });
    });

    it('should return null when no user present', () => {
      const req = {} as Request;
      const result = extractUserFromRequest(req);
      expect(result).toBeNull();
    });
  });

  describe('hasUserAccess', () => {
    it('should grant access to admin users', () => {
      const adminUser = { isAdmin: true };
      expect(hasUserAccess(adminUser)).toBe(true);

      const roleAdmin = { role: 'admin' };
      expect(hasUserAccess(roleAdmin)).toBe(true);
    });

    it('should grant access to lifetime access users', () => {
      const lifetimeUser = { lifetimeAccess: true };
      expect(hasUserAccess(lifetimeUser)).toBe(true);

      const snakeCaseLifetime = { lifetime_access: true };
      expect(hasUserAccess(snakeCaseLifetime)).toBe(true);
    });

    it('should grant access to paid subscription users', () => {
      const premiumUser = { subscriptionTier: 'premium' };
      expect(hasUserAccess(premiumUser)).toBe(true);

      const basicUser = { subscriptionTier: 'basic' };
      expect(hasUserAccess(basicUser)).toBe(true);
    });

    it('should deny access to free tier users', () => {
      const freeUser = { subscriptionTier: 'free' };
      expect(hasUserAccess(freeUser)).toBe(false);
    });

    it('should grant access during trial period', () => {
      const recentPurchase = new Date();
      recentPurchase.setDate(recentPurchase.getDate() - 3); // 3 days ago

      const trialUser = { purchaseDate: recentPurchase };
      expect(hasUserAccess(trialUser)).toBe(true);
    });

    it('should deny access after trial period', () => {
      const oldPurchase = new Date();
      oldPurchase.setDate(oldPurchase.getDate() - 10); // 10 days ago

      const expiredTrial = { purchaseDate: oldPurchase };
      expect(hasUserAccess(expiredTrial)).toBe(false);
    });

    it('should return false for null or undefined user', () => {
      expect(hasUserAccess(null as unknown)).toBe(false);
      expect(hasUserAccess(undefined as unknown)).toBe(false);
    });
  });

  describe('sanitizeUser', () => {
    it('should remove sensitive fields', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        password: 'secret123',
        passwordHash: 'hash123',
        password_hash: 'hash456',
        resetToken: 'token123',
        reset_token: 'token456',
        verificationToken: 'verify123',
        verification_token: 'verify456',
        stripeCustomerId: 'cus_123',
        stripe_customer_id: 'cus_456',
        gumroadUserId: 'gum_123',
        gumroad_user_id: 'gum_456',
      };

      const sanitized = sanitizeUser(user);

      expect(sanitized).toEqual({
        id: '123',
        email: 'test@example.com',
      });
      expect(sanitized).not.toHaveProperty('password');
      expect(sanitized).not.toHaveProperty('passwordHash');
      expect(sanitized).not.toHaveProperty('stripeCustomerId');
    });

    it('should preserve non-sensitive fields', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date(),
      };

      const sanitized = sanitizeUser(user);

      expect(sanitized).toEqual(user);
    });
  });

  describe('getUserDisplayName', () => {
    it('should return full name when available', () => {
      const user = { firstName: 'John', lastName: 'Doe' };
      expect(getUserDisplayName(user)).toBe('John Doe');
    });

    it('should handle snake_case names', () => {
      const user = { first_name: 'Jane', last_name: 'Smith' };
      expect(getUserDisplayName(user)).toBe('Jane Smith');
    });

    it('should return first name only when last name missing', () => {
      const user = { firstName: 'John' };
      expect(getUserDisplayName(user)).toBe('John');
    });

    it('should use email username as fallback', () => {
      const user = { email: 'testuser@example.com' };
      expect(getUserDisplayName(user)).toBe('testuser');
    });

    it('should return "User" as final fallback', () => {
      const user = {};
      expect(getUserDisplayName(user)).toBe('User');
    });

    it('should prioritize camelCase over snake_case', () => {
      const user = {
        firstName: 'John',
        lastName: 'Doe',
        first_name: 'Jane',
        last_name: 'Smith',
      };
      expect(getUserDisplayName(user)).toBe('John Doe');
    });
  });
});