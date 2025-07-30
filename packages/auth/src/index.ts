// Auth package exports
// Firebase authentication is handled in the config package
// This package provides auth-related utilities and middleware

import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from '@aiglossarypro/shared/types';

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

export { logger as authLogger };