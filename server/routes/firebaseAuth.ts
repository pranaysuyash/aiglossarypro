/**
 * Firebase Authentication Routes
 * Handles login, logout, and token exchange
 */

import type { Express, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { ApiResponse, IUser } from '../../shared/types';
import { generateToken } from '../auth/simpleAuth';
import { createFirebaseUser, verifyFirebaseToken } from '../config/firebase';
import { optimizedStorage as storage } from '../optimizedStorage';
import { sendWelcomeEmail } from '../utils/email';
import logger from '../utils/logger';
import { blacklistToken, isTokenBlacklisted } from '../utils/tokenBlacklist';
export function registerFirebaseAuthRoutes(app: Express): void {
  /**
   * Exchange Firebase ID token for JWT
   * POST /api/auth/firebase/login
   */
  app.post('/api/auth/firebase/login', async (req: Request, res: Response) => {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({
          success: false,
          message: 'ID token is required',
        });
      }

      // Verify Firebase token
      const decodedToken = await verifyFirebaseToken(idToken);

      if (!decodedToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid ID token',
        });
      }

      // Get or create user in database
      let user = await storage.getUserByEmail(decodedToken.email!);

      if (!user) {
        // Create new user
        const nameParts = (decodedToken.name || '').split(' ');
        const userData: any = {
          id: decodedToken.uid, // Use Firebase UID as the primary key
          email: decodedToken.email!,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          profileImageUrl: decodedToken.picture || undefined,
          authProvider: decodedToken.firebase.sign_in_provider || 'firebase',
          firebaseUid: decodedToken.uid,
        };

        // Set special properties for test users in development
        if (process.env.NODE_ENV === 'development') {
          if (decodedToken.email === 'admin@aimlglossary.com') {
            userData.isAdmin = true;
            userData.subscriptionTier = 'lifetime';
            userData.lifetimeAccess = true;
            userData.purchaseDate = new Date();
          } else if (decodedToken.email === 'premium@aimlglossary.com') {
            userData.subscriptionTier = 'lifetime';
            userData.lifetimeAccess = true;
            userData.purchaseDate = new Date();
          } else if (decodedToken.email === 'test@aimlglossary.com') {
            // Regular user remains with default free tier for testing
          }
        }

        user = await storage.upsertUser(userData);

        // Send welcome email to new users
        try {
          await sendWelcomeEmail(userData.email, userData.firstName);
          logger.info('Welcome email sent to new user', { email: userData.email });
        } catch (emailError) {
          // Don't fail registration if email fails
          logger.error('Failed to send welcome email', {
            error: emailError instanceof Error ? emailError.message : String(emailError),
            email: userData.email,
          });
        }
      } else {
        // Update Firebase UID if not set
        if (!user.firebaseUid) {
          await storage.updateUser(user.id, { firebaseUid: decodedToken.uid });
        }

        // Update test user properties in development if they don't have them
        if (process.env.NODE_ENV === 'development') {
          let needsUpdate = false;
          const updateData: any = {};

          if (decodedToken.email === 'admin@aimlglossary.com' && !user.isAdmin) {
            updateData.isAdmin = true;
            updateData.subscriptionTier = 'lifetime';
            updateData.lifetimeAccess = true;
            updateData.purchaseDate = new Date();
            needsUpdate = true;
          } else if (decodedToken.email === 'premium@aimlglossary.com' && !user.lifetimeAccess) {
            updateData.subscriptionTier = 'lifetime';
            updateData.lifetimeAccess = true;
            updateData.purchaseDate = new Date();
            needsUpdate = true;
          }

          if (needsUpdate) {
            user = await storage.updateUser(user.id, updateData);
          }
        }
      }

      if (!user) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create or retrieve user',
        });
      }

      // Generate JWT token for session
      const jwtToken = generateToken(user);

      // Set cookie for session
      res.cookie('auth_token', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Transform to IUser format
      const userData: IUser = {
        id: user.id,
        email: user.email!,
        name: `${user.firstName} ${user.lastName}`.trim() || 'Unknown User',
        avatar: user.profileImageUrl || undefined,
        createdAt: user.createdAt || new Date(),
        isAdmin: user.isAdmin || false,
        lifetimeAccess: user.lifetimeAccess || false,
        subscriptionTier: user.subscriptionTier || 'free',
        purchaseDate: user.purchaseDate || undefined,
      };

      const response: ApiResponse<{ user: IUser; token: string }> = {
        success: true,
        data: {
          user: userData,
          token: jwtToken,
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Firebase login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
      });
    }
  });

  /**
   * Create account with email/password
   * POST /api/auth/firebase/register
   */
  app.post('/api/auth/firebase/register', async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists',
        });
      }

      // Create Firebase user
      const firebaseUser = await createFirebaseUser(
        email,
        password,
        `${firstName || ''} ${lastName || ''}`.trim()
      );

      if (!firebaseUser) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create Firebase user',
        });
      }

      // Create user in database
      const user = await storage.upsertUser({
        id: firebaseUser.uid, // Use Firebase UID as primary key
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        authProvider: 'email',
        firebaseUid: firebaseUser.uid,
      });

      if (!user) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create user record',
        });
      }

      res.json({
        success: true,
        message: 'Account created successfully. Please sign in.',
        data: {
          email: user.email,
        },
      });
    } catch (error: any) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Registration failed',
      });
    }
  });

  /**
   * Logout - clear session and invalidate token
   * POST /api/auth/logout
   */
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    // Get token from various sources
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.authToken || req.cookies?.auth_token;

    // Blacklist the token if it exists
    if (token) {
      blacklistToken(token);
      logger.info('Token blacklisted on logout', { userId: req.user?.id });
    }

    // Clear auth cookies with the EXACT same options they were set with
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 0, // Expire immediately
      path: '/',
    };

    // Clear all possible cookie names with proper options
    res.clearCookie('authToken', cookieOptions);
    res.clearCookie('auth_token', cookieOptions);
    res.clearCookie('firebaseToken', cookieOptions);
    res.clearCookie('session', cookieOptions);
    
    // Clear connect.sid cookie with its specific options (Passport session)
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
    });
    
    // Also set cookies to empty string with maxAge 0 to force expiration
    res.cookie('auth_token', '', { ...cookieOptions, maxAge: 0 });
    res.cookie('authToken', '', { ...cookieOptions, maxAge: 0 });
    
    // Clear session if exists
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          logger.error('Session destruction error:', err);
        }
      });
    }

    // Set mock logout state for development
    if (process.env.NODE_ENV === 'development') {
      try {
        import('../middleware/dev/mockAuth').then(({ setMockLogoutState }) => {
          setMockLogoutState(true);
        });
      } catch (error) {
        logger.warn('Could not set mock logout state:', error);
      }
    }

    // Set no-cache headers to prevent browser from caching logged-in state
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });

    // Send response with instructions for client-side cleanup
    res.json({
      success: true,
      message: 'Logged out successfully',
      clientActions: {
        clearLocalStorage: true,
        clearSessionStorage: true,
        clearIndexedDB: ['firebaseLocalStorageDb'],
        redirectTo: '/login'
      }
    });
  });

  /**
   * Get authentication providers status
   * GET /api/auth/providers
   */
  app.get('/api/auth/providers', (_req: Request, res: Response) => {
    const firebaseConfigured = !!(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY_BASE64)
    );

    res.json({
      success: true,
      data: {
        firebase: firebaseConfigured,
        google: firebaseConfigured, // Available through Firebase
        github: firebaseConfigured, // Available through Firebase
        email: firebaseConfigured, // Available through Firebase
      },
    });
  });

  /**
   * Standard login endpoint (redirects to Firebase login)
   * POST /api/auth/login
   */
  app.post('/api/auth/login', (req: Request, res: Response) => {
    // For compatibility, redirect to Firebase login
    res.status(200).json({
      success: false,
      message: 'Please use Firebase authentication',
      redirectTo: '/api/auth/firebase/login',
      endpoints: {
        firebase: '/api/auth/firebase/login',
        register: '/api/auth/firebase/register',
        providers: '/api/auth/providers',
      },
    });
  });

  /**
   * Standard register endpoint (redirects to Firebase register)
   * POST /api/auth/register
   */
  app.post('/api/auth/register', (req: Request, res: Response) => {
    // For compatibility, redirect to Firebase register
    res.status(200).json({
      success: false,
      message: 'Please use Firebase authentication',
      redirectTo: '/api/auth/firebase/register',
      endpoints: {
        firebase: '/api/auth/firebase/login',
        register: '/api/auth/firebase/register',
        providers: '/api/auth/providers',
      },
    });
  });

  /**
   * Get current user from Firebase token
   * GET /api/auth/me
   */
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : req.cookies?.authToken || req.cookies?.auth_token;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        });
      }

      // Check if token is blacklisted
      if (isTokenBlacklisted(token)) {
        return res.status(401).json({
          success: false,
          message: 'Token has been invalidated',
        });
      }

      // For now, we'll use the JWT token verification
      // In production, you might want to verify against Firebase too
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);

      const user = await storage.getUser(decoded.sub);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const userData: IUser = {
        id: user.id,
        email: user.email!,
        name: `${user.firstName} ${user.lastName}`.trim() || 'Unknown User',
        avatar: user.profileImageUrl || undefined,
        createdAt: user.createdAt || new Date(),
        isAdmin: user.isAdmin || false,
        lifetimeAccess: user.lifetimeAccess || false,
        subscriptionTier: user.subscriptionTier || 'free',
        purchaseDate: user.purchaseDate || undefined,
      };

      res.json({
        success: true,
        data: userData,
      });
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
  });

  /**
   * Check authentication status
   * GET /api/auth/check
   */
  app.get('/api/auth/check', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : req.cookies?.authToken || req.cookies?.auth_token;

      if (!token) {
        return res.status(200).json({
          success: true,
          data: {
            isAuthenticated: false,
            user: null,
          },
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);

      const user = await storage.getUser(decoded.sub);

      if (!user) {
        return res.status(200).json({
          success: true,
          data: {
            isAuthenticated: false,
            user: null,
          },
        });
      }

      const userData: IUser = {
        id: user.id,
        email: user.email!,
        name: `${user.firstName} ${user.lastName}`.trim() || 'Unknown User',
        avatar: user.profileImageUrl || undefined,
        createdAt: user.createdAt || new Date(),
        isAdmin: user.isAdmin || false,
        lifetimeAccess: user.lifetimeAccess || false,
        subscriptionTier: user.subscriptionTier || 'free',
        purchaseDate: user.purchaseDate || undefined,
      };

      res.json({
        success: true,
        data: {
          isAuthenticated: true,
          user: userData,
        },
      });
    } catch (error) {
      logger.error('Auth check error:', error);
      res.status(200).json({
        success: true,
        data: {
          isAuthenticated: false,
          user: null,
        },
      });
    }
  });

  /**
   * Get current user - alias for /auth/me
   * GET /api/auth/user
   */
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ')
        ? authHeader.substring(7)
        : req.cookies?.authToken || req.cookies?.auth_token;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          availableProviders: {
            google: true,
            github: true,
          },
        });
      }

      // For now, we'll use the JWT token verification
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);

      const user = await storage.getUser(decoded.sub);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const userData: IUser = {
        id: user.id,
        email: user.email!,
        name: `${user.firstName} ${user.lastName}`.trim() || 'Unknown User',
        avatar: user.profileImageUrl || undefined,
        createdAt: user.createdAt || new Date(),
        isAdmin: user.isAdmin || false,
        lifetimeAccess: user.lifetimeAccess || false,
        subscriptionTier: user.subscriptionTier || 'free',
        purchaseDate: user.purchaseDate || undefined,
      };

      res.json({
        success: true,
        data: userData,
      });
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        availableProviders: {
          google: false,
          github: false,
        },
      });
    }
  });
}
