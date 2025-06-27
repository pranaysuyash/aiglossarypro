/**
 * Simple Auth Routes
 * Provides JWT + OAuth authentication endpoints
 */

import type { Express } from 'express';
import { 
  setupSimpleAuth,
  authenticate,
  optionalAuth,
  requireAdmin
} from '../auth/simpleAuth';

/**
 * Register simple authentication routes
 */
export function registerSimpleAuthRoutes(app: Express): void {
  console.log('🔐 Setting up simple auth routes...');
  
  // Setup auth endpoints (login, callback, logout, etc.)
  setupSimpleAuth(app);
  
  // Example protected route
  app.get('/api/auth/protected', authenticate, (req, res) => {
    res.json({
      success: true,
      message: 'This is a protected route',
      user: (req as any).user
    });
  });
  
  // Example admin route
  app.get('/api/auth/admin-only', authenticate, requireAdmin, (req, res) => {
    res.json({
      success: true,
      message: 'This is an admin-only route',
      user: (req as any).user
    });
  });
  
  console.log('✅ Simple auth routes registered');
}