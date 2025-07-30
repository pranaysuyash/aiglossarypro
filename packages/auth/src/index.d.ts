import type { NextFunction, Request, Response } from 'express';
declare const logger: {
    info: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
};
/**
 * Middleware to check if user is authenticated
 * This is a placeholder - actual authentication is handled by firebaseAuth middleware
 */
export declare function requireAuth(req: Request, res: Response, next: NextFunction): any;
/**
 * Middleware to check if user is admin
 */
export declare function requireAdmin(req: Request, res: Response, next: NextFunction): any;
/**
 * Extract bearer token from request
 */
export declare function extractBearerToken(req: Request): string | null;
/**
 * Check if request has valid auth token (without verifying it)
 */
export declare function hasAuthToken(req: Request): boolean;
export { logger as authLogger };
