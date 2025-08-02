// Auth package exports
// Firebase authentication is handled in the config package
// This package provides auth-related utilities and middleware

import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Define AuthenticatedRequest locally to avoid circular dependencies
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin?: boolean;
  };
}

// Simple logger for now
const logger = {
  info: (...args: any[]) => console.log('[auth]', ...args),
  warn: (...args: any[]) => console.warn('[auth]', ...args),
  error: (...args: any[]) => console.error('[auth]', ...args),
};

/**
 * Middleware to check if user is authenticated
 * This is a placeholder - actual authentication is handled by firebaseAuth middleware
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authReq = req as unknown as AuthenticatedRequest;
  
  if (!authReq.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }
  
  next();
}

/**
 * Middleware to check if user is admin
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authReq = req as unknown as AuthenticatedRequest;
  
  if (!authReq.user || !authReq.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required',
    });
  }
  
  next();
}

/**
 * Extract bearer token from request
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookies as fallback
  return req.cookies?.firebaseToken || req.cookies?.auth_token || null;
}

/**
 * Check if request has valid auth token (without verifying it)
 */
export function hasAuthToken(req: Request): boolean {
  return extractBearerToken(req) !== null;
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: any): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin || false,
    },
    secret,
    { expiresIn: '30d' }
  );
}

/**
 * Verify JWT token
 */
export async function verifyToken(token: string): Promise<any> {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.verify(token, secret);
  } catch (error) {
    logger.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Middleware to authenticate requests
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authReq = req as unknown as AuthenticatedRequest;
  const token = extractBearerToken(req);
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No authentication token provided',
    });
  }
  
  const decoded = await verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token',
    });
  }
  
  authReq.user = decoded;
  next();
}

/**
 * Setup simple auth routes
 */
export function setupSimpleAuth(app: any): void {
  // Login endpoint
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    // This is a simple implementation - in production, verify against database
    if (email && password) {
      const user = { id: '1', email, isAdmin: false };
      const token = generateToken(user);
      
      res.json({
        success: true,
        token,
        user,
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }
  });
  
  // Logout endpoint
  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  });
}

export { logger as authLogger };