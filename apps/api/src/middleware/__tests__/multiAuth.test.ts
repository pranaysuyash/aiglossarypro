import type { Request, Response, NextFunction } from 'express';

// Mock all dependencies before importing the module
jest.mock('../../firebaseUtils', () => ({
  verifyFirebaseToken: jest.fn(),
}));

jest.mock('../../jwtUtils', () => ({
  verifyToken: jest.fn(),
  isTokenBlacklisted: jest.fn().mockReturnValue(false),
}));

jest.mock('../../storage', () => ({
  default: {
    getUserByEmail: jest.fn(),
    getUser: jest.fn(),
    upsertUser: jest.fn(),
    updateUser: jest.fn(),
  },
}));

// Import after mocks are set up
const { multiAuthMiddleware, getUserInfo } = await import('../multiAuth');
const { verifyFirebaseToken } = await import('../../firebaseUtils');
const { verifyToken, isTokenBlacklisted } = await import('../../jwtUtils');
const storage = (await import('../../storage')).default;

describe('multiAuthMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: {},
      cookies: {},
      isAuthenticated: jest.fn().mockReturnValue(false),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('JWT Token Authentication', () => {
    it('should authenticate valid JWT token from Authorization header', async () => {
      const token = 'valid-jwt-token';
      const decodedToken = {
        sub: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isAdmin: false,
      };

      req.headers = { authorization: `Bearer ${token}` };
      (verifyToken as unknown).mockReturnValue(decodedToken);

      await multiAuthMiddleware(req as Request, res as Response, next);

      expect(verifyToken).toHaveBeenCalledWith(token);
      expect((req as unknown).user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        profileImageUrl: null,
        provider: 'jwt',
        claims: {
          sub: 'user-123',
          email: 'test@example.com',
          name: undefined,
        },
        isAdmin: false,
      });
      expect(next).toHaveBeenCalled();
    });

    it('should authenticate valid JWT token from cookies', async () => {
      const token = 'cookie-jwt-token';
      const decodedToken = {
        sub: 'user-456',
        email: 'cookie@example.com',
        isAdmin: true,
      };

      req.cookies = { auth_token: token };
      (verifyToken as unknown).mockReturnValue(decodedToken);

      await multiAuthMiddleware(req as Request, res as Response, next);

      expect(verifyToken).toHaveBeenCalledWith(token);
      expect((req as unknown).user.id).toBe('user-456');
      expect((req as unknown).user.isAdmin).toBe(true);
      expect(next).toHaveBeenCalled();
    });

    it('should reject blacklisted tokens', async () => {
      const token = 'blacklisted-token';
      req.headers = { authorization: `Bearer ${token}` };
      
      const { isTokenBlacklisted } = await import('../../jwtUtils');
      (isTokenBlacklisted as unknown).mockReturnValue(true);

      await multiAuthMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token has been invalidated',
        availableProviders: expect.any(Object),
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Firebase Token Authentication', () => {
    it('should authenticate valid Firebase token', async () => {
      const token = 'firebase-token-with-kid';
      const firebaseUser = {
        uid: 'firebase-123',
        email: 'firebase@example.com',
        name: 'Firebase User',
      };

      // Mock token header detection
      req.headers = { authorization: `Bearer ${token}` };
      jest.spyOn(JSON, 'parse').mockReturnValueOnce({ kid: 'firebase-key-id' });
      
      (verifyFirebaseToken as unknown).mockResolvedValue(firebaseUser);
      (storage.getUserByEmail as unknown).mockResolvedValue(null);
      (storage.upsertUser as unknown).mockResolvedValue({
        id: 'firebase-123',
        email: 'firebase@example.com',
        firstName: 'Firebase',
        lastName: 'User',
      });

      await multiAuthMiddleware(req as Request, res as Response, next);

      expect(verifyFirebaseToken).toHaveBeenCalledWith(token);
      expect(storage.upsertUser).toHaveBeenCalled();
      expect((req as unknown).user.provider).toBe('firebase');
      expect((req as unknown).firebaseUser).toEqual(firebaseUser);
      expect(next).toHaveBeenCalled();
    });

    it('should update existing user with Firebase UID', async () => {
      const token = 'firebase-token';
      const firebaseUser = {
        uid: 'firebase-456',
        email: 'existing@example.com',
      };

      req.headers = { authorization: `Bearer ${token}` };
      jest.spyOn(JSON, 'parse').mockReturnValueOnce({ kid: 'firebase-key-id' });
      
      (verifyFirebaseToken as unknown).mockResolvedValue(firebaseUser);
      (storage.getUserByEmail as unknown).mockResolvedValue({
        id: 'existing-user-123',
        email: 'existing@example.com',
      });

      await multiAuthMiddleware(req as Request, res as Response, next);

      expect(storage.updateUser).toHaveBeenCalledWith('existing-user-123', {
        firebaseUid: 'firebase-456',
      });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Session Authentication', () => {
    it('should authenticate with session when authenticated', async () => {
      const sessionUser = {
        id: 'session-123',
        email: 'session@example.com',
        provider: 'google',
      };

      (req.isAuthenticated as unknown).mockReturnValue(true);
      req.user = sessionUser;
      (storage.getUser as unknown).mockResolvedValue(sessionUser);

      await multiAuthMiddleware(req as Request, res as Response, next);

      expect(storage.getUser).toHaveBeenCalledWith('session-123');
      expect(next).toHaveBeenCalled();
    });

    it('should reject when session user not found in database', async () => {
      const sessionUser = {
        id: 'deleted-user',
        provider: 'github',
      };

      (req.isAuthenticated as unknown).mockReturnValue(true);
      req.user = sessionUser;
      (storage.getUser as unknown).mockResolvedValue(null);

      await multiAuthMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User account not found',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('No Authentication', () => {
    it('should return 401 when no authentication present', async () => {
      await multiAuthMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
        availableProviders: expect.any(Object),
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Firebase token verification errors gracefully', async () => {
      const token = 'invalid-firebase-token';
      req.headers = { authorization: `Bearer ${token}` };
      
      jest.spyOn(JSON, 'parse').mockReturnValueOnce({ kid: 'firebase-key-id' });
      (verifyFirebaseToken as unknown).mockRejectedValue(new Error('Invalid token'));
      (verifyToken as unknown).mockReturnValue(null);

      await multiAuthMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle database errors when checking session user', async () => {
      const sessionUser = {
        id: 'error-user',
        provider: 'google',
      };

      (req.isAuthenticated as unknown).mockReturnValue(true);
      req.user = sessionUser;
      (storage.getUser as unknown).mockRejectedValue(new Error('Database error'));

      await multiAuthMiddleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication verification failed',
      });
    });
  });
});

describe('getUserInfo', () => {
  it('should extract user info from authenticated request', () => {
    const req = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        provider: 'jwt',
      },
    } as unknown;

    const userInfo = getUserInfo(req);

    expect(userInfo).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'jwt',
    });
  });

  it('should handle missing name fields', () => {
    const req = {
      user: {
        id: 'user-456',
        email: 'noname@example.com',
        provider: 'firebase',
      },
    } as unknown;

    const userInfo = getUserInfo(req);

    expect(userInfo).toEqual({
      id: 'user-456',
      email: 'noname@example.com',
      name: 'noname@example.com',
      provider: 'firebase',
    });
  });

  it('should return null when no user present', () => {
    const req = {} as Request;
    const userInfo = getUserInfo(req);
    expect(userInfo).toBeNull();
  });
});