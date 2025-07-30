/**
 * Sentry Configuration for Production Error Tracking
 */
import * as Sentry from '@sentry/node';
/**
 * Initialize Sentry error tracking
 */
export declare function initializeSentry(): void;
/**
 * Express middleware for Sentry request tracking
 */
export declare const sentryRequestHandler: (_req: any, _res: any, next: any) => any;
/**
 * Express middleware for Sentry tracing
 */
export declare const sentryTracingHandler: (_req: any, _res: any, next: any) => any;
/**
 * Express error handler for Sentry
 */
export declare const sentryErrorHandler: any;
/**
 * Manually capture exception with context
 */
export declare function captureException(error: Error, context?: {
    user?: {
        id?: string;
        email?: string;
        username?: string;
    };
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}): string | undefined;
/**
 * Capture custom message with context
 */
export declare function captureMessage(message: string, level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug', context?: {
    user?: {
        id?: string;
        email?: string;
        username?: string;
    };
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
}): string | undefined;
/**
 * Start a transaction for performance monitoring
 */
export declare function startTransaction(name: string, op: string, description?: string): any;
/**
 * Add breadcrumb for debugging
 */
export declare function addBreadcrumb(message: string, category?: string, level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug', data?: Record<string, unknown>): void;
/**
 * Set user context for current scope
 */
export declare function setUser(user: {
    id?: string;
    email?: string;
    username?: string;
    [key: string]: any;
}): void;
/**
 * Set tag for current scope
 */
export declare function setTag(key: string, value: string): void;
/**
 * Check if Sentry is configured and enabled
 */
export declare function isSentryEnabled(): boolean;
/**
 * Flush Sentry data (useful for serverless or before shutdown)
 */
export declare function flushSentry(timeout?: number): Promise<boolean>;
export { Sentry };
