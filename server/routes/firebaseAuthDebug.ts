/**
 * Simplified Firebase Auth Routes - Debug Version
 * This version has better error handling and logging
 */

import type { Express, Request, Response } from 'express';

export function registerFirebaseAuthRoutesDebug(app: Express): void {
  console.log('🔧 Registering Firebase Auth Routes (Debug Version)...');

  // Test route to verify the auth routes are working
  app.get('/api/auth/test', (req: Request, res: Response) => {
    console.log('✅ Test route hit');
    res.json({
      success: true,
      message: 'Firebase auth routes are working',
      timestamp: new Date().toISOString(),
    });
  });

  // Check authentication providers
  app.get('/api/auth/providers', (req: Request, res: Response) => {
    console.log('🔍 Providers route hit');

    const firebaseConfigured = !!(
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY_BASE64
    );

    res.json({
      success: true,
      data: {
        firebase: firebaseConfigured,
        google: firebaseConfigured,
        github: firebaseConfigured,
        email: firebaseConfigured,
      },
      debug: {
        projectId: process.env.FIREBASE_PROJECT_ID ? 'set' : 'missing',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'set' : 'missing',
        privateKey: process.env.FIREBASE_PRIVATE_KEY_BASE64 ? 'set' : 'missing',
      },
    });
  });

  // Authentication check route
  app.get('/api/auth/check', (req: Request, res: Response) => {
    console.log('🔍 Auth check route hit');

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.authToken || req.cookies?.auth_token;

    if (!token) {
      return res.json({
        success: true,
        data: {
          isAuthenticated: false,
          user: null,
          debug: 'No token provided',
        },
      });
    }

    // For now, just return unauthenticated
    res.json({
      success: true,
      data: {
        isAuthenticated: false,
        user: null,
        debug: 'Token verification not implemented in debug version',
      },
    });
  });

  // Firebase login route (simplified)
  app.post('/api/auth/firebase/login', (req: Request, res: Response) => {
    console.log('🔍 Firebase login route hit');
    console.log('Request body:', req.body);

    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'ID token is required',
      });
    }

    // For now, return a debug message
    res.json({
      success: false,
      message: 'Firebase login not implemented in debug version',
      debug: 'Token received but not processed',
    });
  });

  // Standard login route
  app.post('/api/auth/login', (req: Request, res: Response) => {
    console.log('🔍 Standard login route hit');
    res.json({
      success: false,
      message: 'Please use Firebase authentication',
      redirectTo: '/api/auth/firebase/login',
    });
  });

  console.log('✅ Firebase Auth Routes (Debug Version) registered');
}
