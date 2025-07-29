/**
 * Firebase Authentication Middleware
 * Verifies Firebase ID tokens and manages user sessions
 */

import type { NextFunction, Request, Response } from 'express'
import type { Request, Response } from 'express';
import type { AuthenticatedRequest } from '@aiglossarypro/shared/types';
import { setCustomUserClaims, verifyFirebaseToken } from '@aiglossarypro/config';
import { optimizedStorage as storage } from '../optimizedStorage';

import logger from '../utils/logger';
/**
 * Verify Firebase ID token and attach user to request
 */
export async function authenticateFirebaseToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.firebaseToken;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
      return;
    }

    // Verify the Firebase ID token
    const decodedToken = await verifyFirebaseToken(token);

    if (!decodedToken) {
      res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      });
      return;
    }

    // Get or create user in our database
    let user = await storage.getUserByEmail(decodedToken.email!);

    if (!user) {
      // Create new user from Firebase data
      user = await storage.upsertUser({
        id: decodedToken.uid, // Use Firebase UID as the primary key
        email: decodedToken.email!,
        firstName: decodedToken.name?.split(' ')[0] || '',
        lastName: decodedToken.name?.split(' ').slice(1).join(' ') || '',
        profileImageUrl: decodedToken.picture || undefined,
        authProvider: decodedToken.firebase.sign_in_provider || 'firebase',
        firebaseUid: decodedToken.uid,
      });
    }

    // Update Firebase UID if not set
    if (user && !user.firebaseUid) {
      await storage.updateUser(user.id, { firebaseUid: decodedToken.uid });
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = user!;
    (req as any).firebaseUser = decodedToken;

    next();
  } catch (error) {
    logger.error('Firebase auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
}

/**
 * Require admin role via Firebase custom claims
 */
export async function requireFirebaseAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const firebaseUser = (req as any).firebaseUser;
    const user = (req as AuthenticatedRequest).user;

    if (!firebaseUser || !user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Check Firebase custom claims for admin role
    const isFirebaseAdmin = firebaseUser.admin === true;

    // Check database for admin role
    const isDbAdmin = user.isAdmin === true;

    // Sync admin status if needed
    if (isDbAdmin && !isFirebaseAdmin) {
      // Set Firebase custom claim
      await setCustomUserClaims(firebaseUser.uid, { admin: true });
    }

    if (!isDbAdmin && !isFirebaseAdmin) {
      res.status(403).json({
        success: false,
        message: 'Admin privileges required',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
}

/**
 * Optional Firebase authentication - continues if no token
 */
export async function optionalFirebaseAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : req.cookies?.firebaseToken;

    if (!token) {
      // No token, continue without auth
      next();
      return;
    }

    // Verify token if provided
    const decodedToken = await verifyFirebaseToken(token);

    if (decodedToken) {
      // Get user from database
      const user = await storage.getUserByEmail(decodedToken.email!);

      if (user) {
        (req as AuthenticatedRequest).user = user;
        (req as any).firebaseUser = decodedToken;
      }
    }

    next();
  } catch (error) {
    // Continue without auth on error
    logger.error('Optional auth error:', error);
    next();
  }
}
