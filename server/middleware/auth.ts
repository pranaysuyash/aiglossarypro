import type { Request, Response, NextFunction } from 'express';
import { multiAuthMiddleware } from './multiAuth';

// Export requireAuth as an alias for multiAuthMiddleware to maintain compatibility
export const requireAuth = multiAuthMiddleware;

// Re-export multiAuthMiddleware for consistency
export { multiAuthMiddleware };