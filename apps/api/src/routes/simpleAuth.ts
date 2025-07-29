/**
 * Simple Auth Routes
 * Provides JWT + OAuth authentication endpoints
 */

import type { Express } from 'express';
import { authenticate, requireAdmin, setupSimpleAuth } from '@aiglossarypro/auth';

import logger from '../utils/logger';
/**
 * Register simple authentication routes
 */
export function registerSimpleAuthRoutes(app: Express): void {
  logger.info('🔐 Setting up simple auth routes...');

  // Setup auth endpoints (login, callback, logout, etc.)
  setupSimpleAuth(app);

  // Example protected route
  app.get('/api/auth/protected', authenticate, (req, res) => {
    res.json({
      success: true,
      message: 'This is a protected route',
      user: (req as any).user,
    });
  });

  // Example admin route
  app.get('/api/auth/admin-only', authenticate, requireAdmin, (req, res) => {
    res.json({
      success: true,
      message: 'This is an admin-only route',
      user: (req as any).user,
    });
  });

  logger.info('✅ Simple auth routes registered');
}
