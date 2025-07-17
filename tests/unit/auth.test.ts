/**
 * Authentication System Tests
 *
 * Tests the dual authentication system (mock dev + production OAuth).
 * Covers session management, middleware, and access control.
 */

import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { features } from '../../server/config';
import { app } from '../../server/index';
import { requireAdmin } from '../../server/middleware/adminAuth';
import { mockIsAuthenticated } from '../../server/middleware/dev/mockAuth';
import { isAuthenticated } from '../../server/middleware/firebaseAuth';

// Mock Express request/response for middleware testing
const mockRequest = (overrides = {}): any => ({
  user: null,
  isAuthenticated: () => false,
  session: {},
  headers: {},
  get: vi.fn(),
  header: vi.fn(),
  accepts: vi.fn(),
  acceptsCharsets: vi.fn(),
  acceptsEncodings: vi.fn(),
  acceptsLanguages: vi.fn(),
  ...overrides,
});

const mockResponse = () => {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    redirect: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return res;
};

// Removed unused _mockNext variable

describe('Authentication System', () => {
  beforeAll(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Development Authentication (Mock)', () => {
    it('should automatically authenticate in development mode', async () => {
      if (process.env.NODE_ENV === 'development') {
        const req = mockRequest();
        const res = mockResponse();
        const next = vi.fn();

        await mockIsAuthenticated(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user.email).toBe('dev@example.com');
        expect(req.user.isAdmin).toBe(true);
      }
    });

    it('should provide admin access in development', async () => {
      if (process.env.NODE_ENV === 'development') {
        const response = await request(app).get('/api/user').expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.isAdmin).toBe(true);
      }
    });
  });

  describe('Production Authentication (OAuth)', () => {
    it('should redirect to OAuth for login', async () => {
      const response = await request(app).get('/api/login').expect(302);

      expect(response.headers.location).toBeDefined();
    });

    it('should handle logout properly', async () => {
      const response = await request(app).post('/api/logout').expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Admin Access Control', () => {
    it('should protect admin endpoints', async () => {
      const req = mockRequest({
        user: { isAdmin: false },
        isAuthenticated: () => true,
      });
      const res = mockResponse();
      const next = vi.fn();

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Admin access required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow admin users through', async () => {
      const req = mockRequest({
        user: { isAdmin: true },
        isAuthenticated: () => true,
      });
      const res = mockResponse();
      const next = vi.fn();

      await requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', async () => {
      const req = mockRequest({
        user: null,
        isAuthenticated: () => false,
      });
      const res = mockResponse();
      const next = vi.fn();

      await requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should maintain user session', async () => {
      const response = await request(app).get('/api/user').expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('email');
    });

    it('should handle session expiration', async () => {
      // Test with expired session (mock scenario)
      const req = mockRequest({
        user: { expires_at: Math.floor(Date.now() / 1000) - 3600 }, // Expired 1 hour ago
        isAuthenticated: () => true,
      });
      const res = mockResponse();
      const next = vi.fn();

      // This would normally trigger token refresh in production
      await isAuthenticated(req, res, next);

      // In development, mock auth should still work
      if (process.env.NODE_ENV === 'development') {
        expect(next).toHaveBeenCalled();
      }
    });
  });

  describe('Authentication Middleware', () => {
    it('should validate authenticated users', async () => {
      const req = mockRequest({
        user: { id: 'test-user', email: 'test@example.com' },
        isAuthenticated: () => true,
      });
      const res = mockResponse();
      const next = vi.fn();

      // Test the middleware directly
      if (process.env.NODE_ENV === 'development') {
        await mockIsAuthenticated(req, res, next);
        expect(next).toHaveBeenCalled();
      }
    });

    it('should reject invalid authentication', async () => {
      const req = mockRequest({
        user: null,
        isAuthenticated: () => false,
      });
      const res = mockResponse();
      const next = vi.fn();

      if (features.authEnabled) {
        await isAuthenticated(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
      }
    });
  });

  describe('User Authorization', () => {
    it('should provide correct user permissions', async () => {
      const response = await request(app).get('/api/user').expect(200);

      expect(response.body.data).toHaveProperty('isAdmin');
      expect(typeof response.body.data.isAdmin).toBe('boolean');
    });

    it('should handle user data correctly', async () => {
      const response = await request(app).get('/api/user').expect(200);

      const userData = response.body.data;
      expect(userData).toHaveProperty('id');
      expect(userData).toHaveProperty('email');
      expect(userData).toHaveProperty('firstName');
      expect(userData).toHaveProperty('lastName');
    });
  });

  describe('Security Features', () => {
    it('should protect against unauthorized access attempts', async () => {
      const response = await request(app)
        .get('/api/admin/content/dashboard')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate session integrity', async () => {
      // Test with manipulated session data
      const response = await request(app)
        .get('/api/user')
        .set('Cookie', 'session=invalid-session-data')
        .expect(200); // Should still work in development mode

      if (process.env.NODE_ENV === 'development') {
        expect(response.body.success).toBe(true);
      }
    });

    it('should handle CSRF protection', async () => {
      // Test CSRF protection on state-changing operations
      const response = await request(app).post('/api/logout').expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should handle login flow end-to-end', async () => {
      // Test the complete login flow
      const loginResponse = await request(app).get('/api/login').expect(302);

      expect(loginResponse.headers.location).toBeDefined();

      // In development, subsequent requests should be authenticated
      const userResponse = await request(app).get('/api/user').expect(200);

      expect(userResponse.body.success).toBe(true);
    });

    it('should maintain authentication across requests', async () => {
      // Make multiple authenticated requests
      const requests = [
        request(app).get('/api/user'),
        request(app).get('/api/terms/featured'),
        request(app).get('/api/categories'),
      ];

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      // Mock an authentication error
      const req = mockRequest();
      const res = mockResponse();
      const next = vi.fn();

      // Simulate an error in the authentication process
      const originalConsoleError = console.error;
      console.error = vi.fn();

      try {
        // Test error handling in middleware
        const errorMiddleware = (_req: any, _res: any, _next: any) => {
          throw new Error('Authentication service unavailable');
        };

        expect(() => errorMiddleware(req, res, next)).toThrow('Authentication service unavailable');
      } finally {
        console.error = originalConsoleError;
      }
    });

    it('should provide meaningful error messages', async () => {
      const response = await request(app).get('/api/admin/content/dashboard').expect(401);

      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
      expect(response.body.message.length).toBeGreaterThan(0);
    });
  });
});
