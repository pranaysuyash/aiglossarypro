/**
 * Simple JWT + OAuth Authentication System
 * Simple authentication using Google/GitHub OAuth
 * 
 * Features:
 * - JWT tokens for sessions
 * - Google OAuth (free)
 * - GitHub OAuth (free)
 * - No external auth service costs
 * - Admin user management
 */

import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction, Express } from 'express';
import { optimizedStorage as storage } from '../optimizedStorage';
import type { AuthenticatedRequest } from '../../shared/types';

// OAuth configurations
interface OAuthConfig {
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  github: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 1 week

/**
 * Generate JWT token for user
 */
export function generateToken(user: any): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      isAdmin: user.isAdmin || false,
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Authentication middleware
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  // Set user on request
  (req as AuthenticatedRequest).user = {
    id: decoded.sub,
    email: decoded.email,
    firstName: decoded.firstName || null,
    lastName: decoded.lastName || null,
    profileImageUrl: decoded.profileImageUrl || null,
    claims: {
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name
    },
    isAdmin: decoded.isAdmin
  };

  next();
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '') || 
                req.cookies?.auth_token;

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      (req as AuthenticatedRequest).user = {
        id: decoded.sub,
        email: decoded.email,
        firstName: decoded.firstName || null,
        lastName: decoded.lastName || null,
        profileImageUrl: decoded.profileImageUrl || null,
        claims: {
          sub: decoded.sub,
          email: decoded.email,
          name: decoded.name
        },
        isAdmin: decoded.isAdmin
      };
    }
  }

  next();
}

/**
 * Admin authentication middleware
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user || !authReq.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
}

/**
 * Google OAuth login
 */
export async function googleOAuthLogin(code: string): Promise<{ user: any; token: string }> {
  // Exchange code for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    })
  });

  const tokens = await tokenResponse.json();
  
  if (!tokens.access_token) {
    throw new Error('Failed to get access token from Google');
  }

  // Get user info from Google
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });

  const googleUser = await userResponse.json();

  // Upsert user in database
  const user = await storage.upsertUser({
    id: googleUser.id,
    email: googleUser.email,
    firstName: googleUser.given_name,
    lastName: googleUser.family_name,
    profileImageUrl: googleUser.picture
  });

  // Generate our JWT token
  const token = generateToken(user);

  return { user, token };
}

/**
 * GitHub OAuth login
 */
export async function githubOAuthLogin(code: string): Promise<{ user: any; token: string }> {
  // Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code
    })
  });

  const tokens = await tokenResponse.json();
  
  if (!tokens.access_token) {
    throw new Error('Failed to get access token from GitHub');
  }

  // Get user info from GitHub
  const userResponse = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });

  const githubUser = await userResponse.json();

  // Upsert user in database
  const user = await storage.upsertUser({
    id: githubUser.id.toString(),
    email: githubUser.email,
    firstName: githubUser.name?.split(' ')[0] || githubUser.login,
    lastName: githubUser.name?.split(' ').slice(1).join(' ') || '',
    profileImageUrl: githubUser.avatar_url
  });

  // Generate our JWT token
  const token = generateToken(user);

  return { user, token };
}

/**
 * Setup simple auth routes
 */
export function setupSimpleAuth(app: Express) {
  console.log('🔧 Setting up simple JWT + OAuth authentication');

  // Google OAuth callback
  app.get('/api/auth/google/callback', async (req: Request, res: Response) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Authorization code required'
        });
      }

      const { user, token } = await googleOAuthLogin(code as string);
      
      // Set JWT as HTTP-only cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
      });

      res.redirect('/?auth=success');
    } catch (error) {
      console.error('Google OAuth error:', error);
      res.redirect('/?auth=error');
    }
  });

  // GitHub OAuth callback
  app.get('/api/auth/github/callback', async (req: Request, res: Response) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).json({
          success: false,
          message: 'Authorization code required'
        });
      }

      const { user, token } = await githubOAuthLogin(code as string);
      
      // Set JWT as HTTP-only cookie
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
      });

      res.redirect('/?auth=success');
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      res.redirect('/?auth=error');
    }
  });

  // Login initiation routes
  app.get('/api/auth/google', (req: Request, res: Response) => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI!)}&` +
      `response_type=code&` +
      `scope=openid%20email%20profile`;
    
    res.redirect(googleAuthUrl);
  });

  app.get('/api/auth/github', (req: Request, res: Response) => {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?` +
      `client_id=${process.env.GITHUB_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.GITHUB_REDIRECT_URI!)}&` +
      `scope=user:email`;
    
    res.redirect(githubAuthUrl);
  });

  // Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('auth_token');
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Get current user
  app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    res.json({
      success: true,
      data: {
        id: authReq.user.claims.sub,
        email: authReq.user.claims.email,
        name: authReq.user.claims.name,
        isAdmin: authReq.user.isAdmin
      }
    });
  });
}