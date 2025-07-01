/**
 * Firebase Authentication Routes
 * Handles login, logout, and token exchange
 */

import type { Express, Request, Response } from 'express';
import { verifyFirebaseToken, getUserByEmail, createFirebaseUser } from '../config/firebase';
import { optimizedStorage as storage } from '../optimizedStorage';
import { generateToken } from '../auth/simpleAuth';
import type { ApiResponse, IUser } from '../../shared/types';

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
          message: 'ID token is required'
        });
      }

      // Verify Firebase token
      const decodedToken = await verifyFirebaseToken(idToken);
      
      if (!decodedToken) {
        return res.status(401).json({
          success: false,
          message: 'Invalid ID token'
        });
      }

      // Get or create user in database
      let user = await storage.getUserByEmail(decodedToken.email!);
      
      if (!user) {
        // Create new user
        const nameParts = (decodedToken.name || '').split(' ');
        user = await storage.createUser({
          email: decodedToken.email!,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          profileImageUrl: decodedToken.picture || undefined,
          authProvider: decodedToken.firebase.sign_in_provider || 'firebase',
          firebaseUid: decodedToken.uid,
        });
      } else {
        // Update Firebase UID if not set
        if (!user.firebaseUid) {
          await storage.updateUser(user.id, { firebaseUid: decodedToken.uid });
        }
      }

      if (!user) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create or retrieve user'
        });
      }

      // Generate JWT token for session
      const jwtToken = generateToken(user);

      // Set cookie for session
      res.cookie('authToken', jwtToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Transform to IUser format
      const userData: IUser = {
        id: user.id,
        email: user.email!,
        name: `${user.firstName} ${user.lastName}`.trim() || 'Unknown User',
        avatar: user.profileImageUrl || undefined,
        createdAt: user.createdAt || new Date(),
        isAdmin: user.isAdmin || false
      };

      const response: ApiResponse<{ user: IUser; token: string }> = {
        success: true,
        data: {
          user: userData,
          token: jwtToken
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Firebase login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
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
          message: 'Email and password are required'
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists'
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
          message: 'Failed to create Firebase user'
        });
      }

      // Create user in database
      const user = await storage.createUser({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        authProvider: 'email',
        firebaseUid: firebaseUser.uid,
      });

      if (!user) {
        return res.status(500).json({
          success: false,
          message: 'Failed to create user record'
        });
      }

      res.json({
        success: true,
        message: 'Account created successfully. Please sign in.',
        data: {
          email: user.email
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Registration failed'
      });
    }
  });

  /**
   * Logout - clear session
   * POST /api/auth/logout
   */
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    // Clear auth cookie
    res.clearCookie('authToken');
    res.clearCookie('firebaseToken');
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  /**
   * Get authentication providers status
   * GET /api/auth/providers
   */
  app.get('/api/auth/providers', (req: Request, res: Response) => {
    const firebaseConfigured = !!(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    );

    res.json({
      success: true,
      data: {
        firebase: firebaseConfigured,
        google: firebaseConfigured, // Available through Firebase
        github: firebaseConfigured, // Available through Firebase
        email: firebaseConfigured   // Available through Firebase
      }
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
        : req.cookies?.authToken;

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      // For now, we'll use the JWT token verification
      // In production, you might want to verify against Firebase too
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      
      const user = await storage.getUser(decoded.sub);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const userData: IUser = {
        id: user.id,
        email: user.email!,
        name: `${user.firstName} ${user.lastName}`.trim() || 'Unknown User',
        avatar: user.profileImageUrl || undefined,
        createdAt: user.createdAt || new Date(),
        isAdmin: user.isAdmin || false
      };

      res.json({
        success: true,
        data: userData
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  });
}