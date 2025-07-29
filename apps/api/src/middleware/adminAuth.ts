import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import { users } from '@aiglossarypro/shared/schema';
import type { AuthenticatedRequest } from '@aiglossarypro/shared/types';
import { verifyToken } from '@aiglossarypro/auth';
import { db } from '@aiglossarypro/database';

import logger from '../utils/logger';
/**
 * Authentication token middleware - validates user is authenticated
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // First check for JWT token in Authorization header or cookies
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.auth_token;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        // Set user on request from JWT token
        (req as AuthenticatedRequest).user = {
          id: decoded.sub,
          email: decoded.email,
          firstName: decoded.firstName || null,
          lastName: decoded.lastName || null,
          profileImageUrl: decoded.profileImageUrl || null,
          claims: {
            sub: decoded.sub,
            email: decoded.email,
            name: decoded.name,
          },
          isAdmin: decoded.isAdmin,
        };
        next();
        return;
      }
    }

    // Fallback to passport session authentication
    if (req.isAuthenticated?.() && req.user?.id) {
      next();
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  } catch (error) {
    logger.error('Error in authentication middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication verification failed',
    });
  }
}

/**
 * Middleware to check if the authenticated user has admin privileges
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user?.id) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // SECURITY: Removed development backdoor for production safety
    // Production systems must use proper Firebase authentication only

    // Check if user has admin role
    const user = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!user.length || !user[0].isAdmin) {
      res.status(403).json({
        success: false,
        message: 'Admin privileges required',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error checking admin privileges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify admin privileges',
    });
  }
}

/**
 * Check if a user is an admin (for use in route handlers)
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user.length > 0 && user[0].isAdmin === true;
  } catch (error) {
    logger.error('Error checking if user is admin:', error);
    return false;
  }
}
