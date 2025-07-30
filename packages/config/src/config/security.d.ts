/**
 * Security Configuration for Production
 * Implements security headers, rate limiting, and security best practices
 */
import type { Express } from 'express';
/**
 * Configure security middleware
 */
export declare function configureSecurityMiddleware(app: Express): void;
/**
 * Configure rate limiting
 */
export declare function configureRateLimiting(app: Express): void;
/**
 * Configure CORS
 */
export declare function configureCORS(app: Express): void;
/**
 * Input validation and sanitization middleware
 */
export declare function configureInputValidation(app: Express): void;
/**
 * Security monitoring middleware
 */
export declare function configureSecurityMonitoring(app: Express): void;
/**
 * Complete security setup for production
 */
export declare function setupProductionSecurity(app: Express): void;
/**
 * Security health check
 */
export declare function checkSecurityConfiguration(): {
    status: 'secure' | 'warnings' | 'insecure';
    checks: Array<{
        name: string;
        status: 'pass' | 'warn' | 'fail';
        message: string;
    }>;
};
