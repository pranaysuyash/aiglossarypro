import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isUserAdmin, isEmailAdmin } from '../authUtils';
import { db } from '../../db';
import logger from '../logger';

// Mock dependencies
vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('../logger', () => ({
  default: {
    error: vi.fn(),
  },
}));

describe('authUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isUserAdmin', () => {
    it('should return true for admin users', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ isAdmin: true }]),
      };
      (db.select as unknown).mockReturnValue(mockSelect);

      const result = await isUserAdmin('user-123');

      expect(result).toBe(true);
      expect(db.select).toHaveBeenCalledWith({ isAdmin: expect.any(Object) });
    });

    it('should return false for non-admin users', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ isAdmin: false }]),
      };
      (db.select as unknown).mockReturnValue(mockSelect);

      const result = await isUserAdmin('user-456');

      expect(result).toBe(false);
    });

    it('should return false when user not found', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      (db.select as unknown).mockReturnValue(mockSelect);

      const result = await isUserAdmin('non-existent');

      expect(result).toBe(false);
    });

    it('should return false and log error on database error', async () => {
      const error = new Error('Database error');
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockRejectedValue(error),
      };
      (db.select as unknown).mockReturnValue(mockSelect);

      const result = await isUserAdmin('user-123');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Error checking admin status:', error);
    });

    it('should handle null or undefined isAdmin values', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ isAdmin: null }]),
      };
      (db.select as unknown).mockReturnValue(mockSelect);

      const result = await isUserAdmin('user-123');

      expect(result).toBe(false);
    });
  });

  describe('isEmailAdmin', () => {
    it('should return true for admin emails', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ isAdmin: true }]),
      };
      (db.select as unknown).mockReturnValue(mockSelect);

      const result = await isEmailAdmin('admin@example.com');

      expect(result).toBe(true);
      expect(db.select).toHaveBeenCalledWith({ isAdmin: expect.any(Object) });
    });

    it('should return false for non-admin emails', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ isAdmin: false }]),
      };
      (db.select as unknown).mockReturnValue(mockSelect);

      const result = await isEmailAdmin('user@example.com');

      expect(result).toBe(false);
    });

    it('should return false when email not found', async () => {
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      (db.select as unknown).mockReturnValue(mockSelect);

      const result = await isEmailAdmin('unknown@example.com');

      expect(result).toBe(false);
    });

    it('should return false and log error on database error', async () => {
      const error = new Error('Database error');
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockRejectedValue(error),
      };
      (db.select as unknown).mockReturnValue(mockSelect);

      const result = await isEmailAdmin('admin@example.com');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalledWith('Error checking admin status by email:', error);
    });

    it('should not fall back to hardcoded admin emails', async () => {
      const error = new Error('Database error');
      const mockSelect = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockRejectedValue(error),
      };
      (db.select as unknown).mockReturnValue(mockSelect);

      // Test with what might have been a hardcoded admin email
      const result = await isEmailAdmin('superadmin@example.com');

      expect(result).toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });
  });
});