import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { UserService, GrantLifetimeAccessOptions } from '../userService';
import { optimizedStorage as storage } from '../../optimizedStorage';
import { PRICING_CONSTANTS } from '../../utils/constants';

// Mock dependencies
vi.mock('../../optimizedStorage');
vi.mock('../../utils/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock crypto.randomUUID
vi.mock('node:crypto', () => ({
  default: {
    randomUUID: vi.fn(() => 'mock-uuid-123'),
  },
}));

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('grantLifetimeAccess', () => {
    const mockEmail = 'test@example.com';
    const mockOrderId = 'order-123';
    const mockUserId = 'existing-user-123';

    it('should create a new user with lifetime access when user does not exist', async () => {
      // Mock user not found
      vi.mocked(storage.getUserByEmail).mockResolvedValueOnce(null);
      vi.mocked(storage.upsertUser).mockResolvedValueOnce(undefined);
      vi.mocked(storage.recordPurchase).mockResolvedValueOnce(undefined);

      const options: GrantLifetimeAccessOptions = {
        email: mockEmail,
        orderId: mockOrderId,
        amount: 9900,
        currency: 'USD',
      };

      const result = await UserService.grantLifetimeAccess(options);

      // Verify user creation
      expect(storage.upsertUser).toHaveBeenCalledWith({
        id: 'mock-uuid-123',
        email: mockEmail,
        subscriptionTier: 'lifetime',
        lifetimeAccess: true,
        purchaseDate: expect.any(Date),
        dailyViews: 0,
        lastViewReset: expect.any(Date),
      });

      // Verify purchase recording
      expect(storage.recordPurchase).toHaveBeenCalledWith({
        userId: 'mock-uuid-123',
        orderId: mockOrderId,
        amount: 9900,
        currency: 'USD',
        purchaseDate: expect.any(Date),
        purchaseData: undefined,
        isTest: false,
      });

      // Verify result
      expect(result).toEqual({
        userId: 'mock-uuid-123',
        email: mockEmail,
        wasExistingUser: false,
        lifetimeAccess: true,
      });
    });

    it('should update an existing user to lifetime access', async () => {
      // Mock existing user
      const mockExistingUser = {
        id: mockUserId,
        email: mockEmail,
        subscriptionTier: 'free',
        lifetimeAccess: false,
      };

      vi.mocked(storage.getUserByEmail).mockResolvedValueOnce(mockExistingUser);
      vi.mocked(storage.updateUser).mockResolvedValueOnce(undefined);
      vi.mocked(storage.recordPurchase).mockResolvedValueOnce(undefined);

      const options: GrantLifetimeAccessOptions = {
        email: mockEmail,
        orderId: mockOrderId,
      };

      const result = await UserService.grantLifetimeAccess(options);

      // Verify user update
      expect(storage.updateUser).toHaveBeenCalledWith(mockUserId, {
        subscriptionTier: 'lifetime',
        lifetimeAccess: true,
        purchaseDate: expect.any(Date),
      });

      // Verify purchase recording
      expect(storage.recordPurchase).toHaveBeenCalledWith({
        userId: mockUserId,
        orderId: mockOrderId,
        amount: PRICING_CONSTANTS.LIFETIME_PRICE_CENTS,
        currency: PRICING_CONSTANTS.CURRENCY_USD,
        purchaseDate: expect.any(Date),
        purchaseData: undefined,
        isTest: false,
      });

      // Verify result
      expect(result).toEqual({
        userId: mockUserId,
        email: mockEmail,
        wasExistingUser: true,
        lifetimeAccess: true,
      });
    });

    it('should handle test purchases correctly', async () => {
      vi.mocked(storage.getUserByEmail).mockResolvedValueOnce(null);
      vi.mocked(storage.upsertUser).mockResolvedValueOnce(undefined);
      vi.mocked(storage.recordPurchase).mockResolvedValueOnce(undefined);

      const options: GrantLifetimeAccessOptions = {
        email: mockEmail,
        orderId: 'test-order-123',
        isTestPurchase: true,
        grantedBy: 'admin@example.com',
      };

      await UserService.grantLifetimeAccess(options);

      // Verify test flag is passed to purchase record
      expect(storage.recordPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          isTest: true,
        })
      );
    });

    it('should handle errors when finding user by email', async () => {
      // Mock error when finding user
      vi.mocked(storage.getUserByEmail).mockRejectedValueOnce(
        new Error('Database connection error')
      );
      vi.mocked(storage.upsertUser).mockResolvedValueOnce(undefined);
      vi.mocked(storage.recordPurchase).mockResolvedValueOnce(undefined);

      const options: GrantLifetimeAccessOptions = {
        email: mockEmail,
        orderId: mockOrderId,
      };

      const result = await UserService.grantLifetimeAccess(options);

      // Should create new user despite error
      expect(storage.upsertUser).toHaveBeenCalled();
      expect(result.wasExistingUser).toBe(false);
    });

    it('should handle missing orderId', async () => {
      vi.mocked(storage.getUserByEmail).mockResolvedValueOnce(null);
      vi.mocked(storage.upsertUser).mockResolvedValueOnce(undefined);
      // recordPurchase should not be called without orderId

      const options: GrantLifetimeAccessOptions = {
        email: mockEmail,
        // No orderId provided
      };

      const result = await UserService.grantLifetimeAccess(options);

      // Verify user is created but purchase is not recorded
      expect(storage.upsertUser).toHaveBeenCalled();
      expect(storage.recordPurchase).not.toHaveBeenCalled();
      expect(result.lifetimeAccess).toBe(true);
    });

    it('should handle custom purchase data', async () => {
      vi.mocked(storage.getUserByEmail).mockResolvedValueOnce(null);
      vi.mocked(storage.upsertUser).mockResolvedValueOnce(undefined);
      vi.mocked(storage.recordPurchase).mockResolvedValueOnce(undefined);

      const customPurchaseData = {
        referrer: 'partner-site',
        campaign: 'summer-sale',
        discount: 20,
      };

      const options: GrantLifetimeAccessOptions = {
        email: mockEmail,
        orderId: mockOrderId,
        purchaseData: customPurchaseData,
      };

      await UserService.grantLifetimeAccess(options);

      // Verify custom data is passed to purchase record
      expect(storage.recordPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          purchaseData: customPurchaseData,
        })
      );
    });

    it('should use default pricing constants when amount not provided', async () => {
      vi.mocked(storage.getUserByEmail).mockResolvedValueOnce(null);
      vi.mocked(storage.upsertUser).mockResolvedValueOnce(undefined);
      vi.mocked(storage.recordPurchase).mockResolvedValueOnce(undefined);

      const options: GrantLifetimeAccessOptions = {
        email: mockEmail,
        orderId: mockOrderId,
        // No amount or currency provided
      };

      await UserService.grantLifetimeAccess(options);

      expect(storage.recordPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: PRICING_CONSTANTS.LIFETIME_PRICE_CENTS,
          currency: PRICING_CONSTANTS.CURRENCY_USD,
        })
      );
    });

    it('should handle email privacy in logs', async () => {
      const { log } = await import('../../utils/logger');
      vi.mocked(storage.getUserByEmail).mockResolvedValueOnce(null);
      vi.mocked(storage.upsertUser).mockResolvedValueOnce(undefined);
      vi.mocked(storage.recordPurchase).mockResolvedValueOnce(undefined);

      const options: GrantLifetimeAccessOptions = {
        email: 'sensitive@example.com',
        orderId: mockOrderId,
      };

      await UserService.grantLifetimeAccess(options);

      // Verify email is partially redacted in logs
      expect(log.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          email: 'sen***',
        })
      );
    });

    it('should handle concurrent requests for the same email', async () => {
      // Simulate race condition where user is created between check and create
      vi.mocked(storage.getUserByEmail)
        .mockResolvedValueOnce(null) // First check: user doesn't exist
        .mockResolvedValueOnce({ // Second check: user now exists
          id: 'race-condition-user',
          email: mockEmail,
          subscriptionTier: 'lifetime',
          lifetimeAccess: true,
        });

      vi.mocked(storage.upsertUser).mockRejectedValueOnce(
        new Error('Unique constraint violation')
      );

      const options: GrantLifetimeAccessOptions = {
        email: mockEmail,
        orderId: mockOrderId,
      };

      // Should handle the error gracefully
      await expect(UserService.grantLifetimeAccess(options)).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    it('should propagate storage errors', async () => {
      const storageError = new Error('Database unavailable');
      vi.mocked(storage.getUserByEmail).mockResolvedValueOnce(null);
      vi.mocked(storage.upsertUser).mockRejectedValueOnce(storageError);

      const options: GrantLifetimeAccessOptions = {
        email: 'test@example.com',
      };

      await expect(UserService.grantLifetimeAccess(options)).rejects.toThrow(
        'Database unavailable'
      );
    });

    it('should handle invalid email formats', async () => {
      const options: GrantLifetimeAccessOptions = {
        email: 'invalid-email',
        orderId: 'order-123',
      };

      // The service should still attempt to process
      // Validation should happen at a higher level
      vi.mocked(storage.getUserByEmail).mockResolvedValueOnce(null);
      vi.mocked(storage.upsertUser).mockResolvedValueOnce(undefined);

      const result = await UserService.grantLifetimeAccess(options);
      expect(result.email).toBe('invalid-email');
    });
  });
});