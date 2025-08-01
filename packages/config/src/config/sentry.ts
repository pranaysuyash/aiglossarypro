/**
 * Sentry Configuration for Production Error Tracking
 */

import * as Sentry from '@sentry/node';
import { httpIntegration, expressIntegration, consoleIntegration, localVariablesIntegration, startSpan } from '@sentry/node';
import { log as logger } from '../utils/logger';

interface SentryConfig {
  dsn?: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
  enabled: boolean;
}

/**
 * Initialize Sentry error tracking
 */
export function initializeSentry(): void {
  const config: SentryConfig = {
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || process.env.npm_package_version || '1.0.0',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enabled: !!(process.env.SENTRY_DSN && process.env.NODE_ENV === 'production'),
  };

  if (!config.dsn) {
    logger.info('Sentry DSN not configured - error tracking disabled');
    return;
  }

  if (!config.enabled) {
    logger.info('Sentry disabled in development mode');
    return;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,

      // Performance monitoring
      tracesSampleRate: config.tracesSampleRate,
      profilesSampleRate: config.profilesSampleRate,

      // Integrations
      integrations: [
        // HTTP integration for Express
        httpIntegration(),

        // Express integration
        expressIntegration(),

        // Console integration
        consoleIntegration(),

        // Local variables in stack traces
        localVariablesIntegration({
          captureAllExceptions: false,
        }),
      ],

      // Error filtering
      beforeSend(event, hint) {
        // Filter out development/test errors
        if (config.environment !== 'production') {
          return null;
        }

        // Filter out known non-critical errors
        const error = hint.originalException;
        if (error instanceof Error) {
          // Skip CORS errors
          if (error.message.includes('CORS')) {
            return null;
          }

          // Skip client disconnect errors
          if (
            error.message.includes('ECONNRESET') ||
            error.message.includes('EPIPE') ||
            error.message.includes('Client disconnected')
          ) {
            return null;
          }

          // Skip rate limit errors (they're expected)
          if (error.message.includes('Too many requests')) {
            return null;
          }
        }

        return event;
      },

      // Transaction filtering
      beforeSendTransaction(event) {
        // Only send in production
        if (config.environment !== 'production') {
          return null;
        }

        // Filter out health check transactions
        if (event.transaction?.includes('/health') || event.transaction?.includes('/monitoring')) {
          return null;
        }

        return event;
      },

      // Set user context
      initialScope: {
        tags: {
          component: 'server',
          service: 'ai-glossary-pro',
        },
      },
    });

    logger.info('Sentry error tracking initialized', {
      environment: config.environment,
      release: config.release,
      tracesSampleRate: config.tracesSampleRate,
    });
  } catch (error) {
    logger.error('Failed to initialize Sentry:', error);
  }
}

/**
 * Express middleware for Sentry request tracking
 */
// Request handler is no longer needed in newer Sentry versions
export const sentryRequestHandler = (_req: any, _res: any, next: any) => next();

/**
 * Express middleware for Sentry tracing
 */
// Tracing handler is no longer needed in newer Sentry versions  
export const sentryTracingHandler = (_req: any, _res: any, next: any) => next();

/**
 * Express error handler for Sentry
 */
// Use express error handler instead
export const sentryErrorHandler: any = Sentry.expressErrorHandler({
  shouldHandleError(_error: any) {
    // Only handle errors in production
    return process.env.NODE_ENV === 'production';
  },
});

/**
 * Manually capture exception with context
 */
export function captureException(
  error: Error,
  context?: {
    user?: { id?: string; email?: string; username?: string };
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  }
): string | undefined {
  if (process.env.NODE_ENV !== 'production') {
    logger.error('Exception (Sentry disabled):', { error: error, ...context });
    return undefined;
  }

  return Sentry.withScope(scope => {
    if (context?.user) {
      scope.setUser(context.user);
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    return Sentry.captureException(error);
  });
}

/**
 * Capture custom message with context
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: {
    user?: { id?: string; email?: string; username?: string };
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
): string | undefined {
  if (process.env.NODE_ENV !== 'production') {
    logger.info('Message (Sentry disabled):', { message, level, ...context });
    return undefined;
  }

  return Sentry.withScope(scope => {
    if (context?.user) {
      scope.setUser(context.user);
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    scope.setLevel(level);
    return Sentry.captureMessage(message);
  });
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string,
  description?: string
): any {
  if (process.env.NODE_ENV !== 'production') {
    return undefined;
  }

  return startSpan({
    name,
    op,
    attributes: {
      description: description || '',
    },
  }, () => {});
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category = 'default',
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  data?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('Breadcrumb (Sentry disabled):', { message, category, level, data });
    return;
  }

  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set user context for current scope
 */
export function setUser(user: {
  id?: string;
  email?: string;
  username?: string;
  [key: string]: any;
}): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  Sentry.setUser(user);
}

/**
 * Set tag for current scope
 */
export function setTag(key: string, value: string): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  Sentry.setTag(key, value);
}

/**
 * Check if Sentry is configured and enabled
 */
export function isSentryEnabled(): boolean {
  return !!(process.env.SENTRY_DSN && process.env.NODE_ENV === 'production');
}

/**
 * Flush Sentry data (useful for serverless or before shutdown)
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  if (!isSentryEnabled()) {
    return true;
  }

  try {
    return await Sentry.flush(timeout);
  } catch (error) {
    logger.error('Error flushing Sentry:', error);
    return false;
  }
}

// Export Sentry for direct use if needed
export { Sentry };
