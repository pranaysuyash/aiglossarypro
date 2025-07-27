import * as Sentry from '@sentry/node';
import type { NextFunction, Request, Response } from 'express';

import logger from './logger';
// Initialize Sentry for server-side error tracking
export const initSentry = () => {
  if (process.env.NODE_ENV !== 'production') {
    // Skip Sentry in development unless explicitly enabled
    if (!process.env.SENTRY_DSN_DEV) {
      logger.info('Sentry disabled in development environment');
      return;
    }
  }

  const dsn = process.env.SENTRY_DSN || process.env.SENTRY_DSN_DEV;

  if (!dsn) {
    logger.warn('Sentry DSN not configured - error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version,

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    integrations: [
      // HTTP integration for request tracing
      Sentry.httpIntegration(),
      // Console integration for capturing console errors
      Sentry.consoleIntegration(),
      // Node.js context integration
      Sentry.contextLinesIntegration(),
      // Local variables integration
      Sentry.localVariablesIntegration(),
    ],

    // Configure which data to send
    beforeSend(event, _hint) {
      // Filter out sensitive data
      if (event.request?.data) {
        const data = event.request.data;
        // Remove password fields
        if (typeof data === 'object') {
          Object.keys(data).forEach(key => {
            if (
              key.toLowerCase().includes('password') ||
              key.toLowerCase().includes('secret') ||
              key.toLowerCase().includes('token')
            ) {
              (data as Record<string, unknown>)[key] = '[Filtered]';
            }
          });
        }
      }

      // Filter out health check errors to reduce noise
      if (event.request?.url?.includes('/health')) {
        return null;
      }

      return event;
    },

    // Set user context
    beforeSendTransaction(event) {
      return event;
    },
  });

  logger.info(`Sentry initialized for ${process.env.NODE_ENV} environment`);
};

// Helper functions for common error scenarios
export const captureAPIError = (
  error: Error,
  context: {
    method: string;
    path: string;
    userId?: string;
    requestId?: string;
    body?: Record<string, unknown>;
  }
) => {
  Sentry.withScope(scope => {
    scope.setTag('errorType', 'api');
    scope.setContext('api', {
      method: context.method,
      path: context.path,
      userId: context.userId,
      requestId: context.requestId,
    });

    if (context.body && typeof context.body === 'object') {
      // Filter sensitive data before logging
      const sanitizedBody = { ...context.body };
      Object.keys(sanitizedBody).forEach(key => {
        if (
          key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('token')
        ) {
          sanitizedBody[key] = '[Filtered]';
        }
      });
      scope.setContext('requestBody', sanitizedBody);
    }

    Sentry.captureException(error);
  });
};

export const captureAuthError = (
  error: Error,
  context: {
    email?: string;
    provider?: string;
    action: string;
  }
) => {
  Sentry.withScope(scope => {
    scope.setTag('errorType', 'authentication');
    scope.setContext('auth', {
      email: context.email,
      provider: context.provider,
      action: context.action,
    });

    Sentry.captureException(error);
  });
};

export const captureAuthEvent = (
  action: string,
  context: {
    userId?: string;
    email?: string;
    provider?: string;
    error?: string;
  }
) => {
  Sentry.addBreadcrumb({
    message: `Auth event: ${action}`,
    category: 'auth',
    level: context.error ? 'error' : 'info',
    data: {
      userId: context.userId,
      email: context.email,
      provider: context.provider,
      error: context.error,
    },
  });
};

export const captureDatabaseError = (
  error: Error,
  context: {
    query?: string;
    operation: string;
    table?: string;
  }
) => {
  Sentry.withScope(scope => {
    scope.setTag('errorType', 'database');
    scope.setContext('database', {
      query: context.query?.substring(0, 200), // Truncate long queries
      operation: context.operation,
      table: context.table,
    });

    Sentry.captureException(error);
  });
};

// Performance monitoring with enhanced metrics
export const startTransaction = (name: string, operation: string) => {
  return Sentry.startTransaction({
    name,
    op: operation,
    tags: {
      environment: process.env.NODE_ENV || 'development',
      service: 'ai-glossary-pro',
    },
  });
};

// Performance monitoring for API endpoints
export const monitorAPIPerformance = (
  name: string,
  operation: () => Promise<unknown>,
  context?: {
    userId?: string;
    endpoint?: string;
    method?: string;
  }
) => {
  return Sentry.startSpan(
    {
      name,
      op: 'api.request',
      tags: {
        endpoint: context?.endpoint,
        method: context?.method,
      },
    },
    async (span) => {
      const startTime = Date.now();

      try {
        const result = await operation();

        const duration = Date.now() - startTime;
        span?.setData('duration', duration);
        span?.setData('success', true);

        // Track slow operations
        if (duration > 5000) {
          Sentry.addBreadcrumb({
            message: `Slow operation detected: ${name}`,
            level: 'warning',
            data: { duration, endpoint: context?.endpoint },
          });
        }

        return result;
      } catch (error) {
        span?.setData('success', false);
        span?.setData('error', error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    }
  );
};

// Database query performance monitoring
export const monitorDatabaseQuery = async (
  queryName: string,
  query: () => Promise<unknown>,
  context?: {
    table?: string;
    operation?: string;
  }
) => {
  return Sentry.startSpan(
    {
      name: `db.${queryName}`,
      op: 'db.query',
      tags: {
        table: context?.table,
        operation: context?.operation,
      },
    },
    async (span) => {
      const startTime = Date.now();

      try {
        const result = await query();
        const duration = Date.now() - startTime;

        span?.setData('duration', duration);
        span?.setData('success', true);

        // Alert on slow queries
        if (duration > 2000) {
          Sentry.addBreadcrumb({
            message: `Slow database query: ${queryName}`,
            level: 'warning',
            data: { duration, table: context?.table },
          });
        }

        return result;
      } catch (error) {
        span?.setData('success', false);
        span?.setData('error', error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    }
  );
};

// Add breadcrumb for debugging
export const addBreadcrumb = (
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, unknown>
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  });
};

// Set user context
export const setUser = (user: { id: string; email?: string; username?: string }) => {
  Sentry.setUser(user);
};

// Clear user context (on logout)
export const clearUser = () => {
  Sentry.setUser(null);
};

// Express middleware for request tracking
export const sentryRequestHandler = () => (_req: Request, _res: Response, next: NextFunction) =>
  next();
export const sentryTracingHandler = () => (_req: Request, _res: Response, next: NextFunction) =>
  next();
export const sentryErrorHandler = () => Sentry.expressErrorHandler();

export default Sentry;
