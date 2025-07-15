import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authRouter } from '../auth';
import { verifyIdToken } from '../../config/firebase-admin';
import { db } from '../../config/database';
import jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('../../config/firebase-admin', () => ({
  verifyIdToken: vi.fn(),
}));

vi.mock('../../config/database', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-jwt-token'),
  },
}));

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    vi.clearAllMocks();
  });

  describe('POST /auth/firebase/login', () => {
    it('should authenticate user with valid Firebase token', async () => {
      const mockFirebaseUser = {
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const mockDbUser = {
        id: 'user-123',
        uid: 'firebase-uid-123',
        email: 'test@example.com',
        name: 'Test User',
        lifetimeAccess: false,
        createdAt: new Date(),
      };

      (verifyIdToken as any).mockResolvedValueOnce(mockFirebaseUser);
      (db.where as any).mockResolvedValueOnce([mockDbUser]);

      const response = await request(app)
        .post('/auth/firebase/login')
        .send({ idToken: 'valid-firebase-token' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe('mock-jwt-token');
      expect(response.body.data.user).toEqual(mockDbUser);
      expect(verifyIdToken).toHaveBeenCalledWith('valid-firebase-token');
    });

    it('should create new user if not exists', async () => {
      const mockFirebaseUser = {
        uid: 'new-firebase-uid',
        email: 'newuser@example.com',
        name: 'New User',
      };

      const mockNewUser = {
        id: 'new-user-id',
        uid: 'new-firebase-uid',
        email: 'newuser@example.com',
        name: 'New User',
        lifetimeAccess: false,
        createdAt: new Date(),
      };

      (verifyIdToken as any).mockResolvedValueOnce(mockFirebaseUser);
      (db.where as any).mockResolvedValueOnce([]); // No existing user
      (db.returning as any).mockResolvedValueOnce([mockNewUser]);

      const response = await request(app)
        .post('/auth/firebase/login')
        .send({ idToken: 'valid-firebase-token' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(mockNewUser);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle invalid Firebase token', async () => {
      (verifyIdToken as any).mockRejectedValueOnce(new Error('Invalid token'));

      const response = await request(app)
        .post('/auth/firebase/login')
        .send({ idToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid authentication token');
    });

    it('should handle missing token', async () => {
      const response = await request(app)
        .post('/auth/firebase/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('ID token is required');
    });
  });

  describe('GET /auth/user', () => {
    it('should return user data for authenticated request', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        lifetimeAccess: true,
        createdAt: new Date(),
      };

      // Mock auth middleware
      app.use((req: any, res, next) => {
        req.user = mockUser;
        next();
      });

      const response = await request(app)
        .get('/auth/user')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockUser);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .get('/auth/user');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear auth cookie on logout', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
      // Check that cookie is cleared
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });

  describe('POST /auth/purchase/test', () => {
    it('should create test purchase for development', async () => {
      process.env.NODE_ENV = 'development';

      const mockTestUser = {
        id: 'test-user-id',
        email: 'testuser@aiglosspro.com',
        name: 'Test User',
        lifetimeAccess: true,
        purchaseDate: new Date(),
        createdAt: new Date(),
      };

      (db.returning as any).mockResolvedValueOnce([mockTestUser]);

      const response = await request(app)
        .post('/auth/purchase/test');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.lifetimeAccess).toBe(true);
      expect(response.body.data.paymentInfo.environment).toBe('test');
    });

    it('should reject test purchase in production', async () => {
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .post('/auth/purchase/test');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('only available in development');
    });
  });
});