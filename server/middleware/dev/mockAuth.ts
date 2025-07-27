/**
 * DISABLED: Mock authentication middleware
 *
 * SECURITY NOTICE: This file has been DISABLED for production safety.
 * Mock authentication creates security vulnerabilities and must not be used
 * in production environments.
 *
 * This file contained development-only authentication bypasses that could
 * allow unauthorized admin access if accidentally enabled in production.
 *
 * For local development, use proper Firebase authentication with test accounts.
 */

import type { NextFunction, Request, Response } from 'express'
import type { Request, Response } from 'express';

import logger from '../../utils/logger';
// SECURITY: All mock authentication functions are disabled
export const mockIsAuthenticated = (_req: Request, res: Response, _next: NextFunction) => {
  logger.error('🚨 SECURITY ERROR: Mock authentication is DISABLED');
  logger.error('🚨 Use proper Firebase authentication instead');
  res.status(500).json({
    success: false,
    message: 'Mock authentication is disabled for security reasons',
    error: 'Use Firebase authentication for all environments',
  });
};

export const mockAuthenticateToken = (_req: Request, res: Response, _next: NextFunction) => {
  logger.error('🚨 SECURITY ERROR: Mock authentication is DISABLED');
  logger.error('🚨 Use proper Firebase authentication instead');
  res.status(500).json({
    success: false,
    message: 'Mock authentication is disabled for security reasons',
    error: 'Use Firebase authentication for all environments',
  });
};

export async function mockRequireAdmin(
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  logger.error('🚨 SECURITY ERROR: Mock admin authentication is DISABLED');
  logger.error('🚨 Use proper Firebase authentication instead');
  res.status(500).json({
    success: false,
    message: 'Mock admin authentication is disabled for security reasons',
    error: 'Use Firebase authentication for all environments',
  });
}

export function setupMockAuth(_app: any) {
  logger.error('🚨 SECURITY ERROR: Mock authentication setup is DISABLED');
  logger.error('🚨 This function will not set up any mock endpoints');
  logger.error('🚨 Use proper Firebase authentication instead');

  // Do nothing - no mock endpoints will be created
  return;
}

export function setMockLogoutState(_loggedOut: boolean) {
  logger.error('🚨 SECURITY ERROR: Mock authentication is DISABLED');
  logger.error('🚨 Mock logout state cannot be modified');
}

/**
 * MIGRATION GUIDE:
 *
 * To restore local development authentication:
 * 1. Set up Firebase emulator suite locally
 * 2. Create test Firebase users with admin privileges
 * 3. Use proper Firebase Auth SDK for authentication
 * 4. Never use mock authentication in any environment
 *
 * This ensures consistent security across all environments.
 */
