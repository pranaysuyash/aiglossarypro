import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Initialize Sentry for server-side error tracking
export const initSentry = () => {
  if (process.env.NODE_ENV !== 'production') {
    // Skip Sentry in development unless explicitly enabled
    if (!process.env.SENTRY_DSN_DEV) {
      console.log('Sentry disabled in development environment');
      return;
    }
  }

  const dsn = process.env.SENTRY_DSN || process.env.SENTRY_DSN_DEV;
  
  if (!dsn) {
    console.warn('Sentry DSN not configured - error monitoring disabled');
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
      nodeProfilingIntegration(),
      // Capture console.log, console.error, etc.
      new Sentry.Integrations.Console({
        levels: ['error']
      }),
      // Capture HTTP requests
      new Sentry.Integrations.Http({
        tracing: true
      }),
      // Capture database queries (if using supported ORM)
      new Sentry.Integrations.OnUncaughtException({
        exitEvenIfOtherHandlersAreRegistered: false
      }),
      new Sentry.Integrations.OnUnhandledRejection({
        mode: 'warn'
      })
    ],
    
    // Configure which data to send
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.data) {
        const data = event.request.data;
        // Remove password fields
        if (typeof data === 'object') {
          Object.keys(data).forEach(key => {
            if (key.toLowerCase().includes('password') || 
                key.toLowerCase().includes('secret') ||
                key.toLowerCase().includes('token')) {
              data[key] = '[Filtered]';
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
    }
  });
  
  console.log(`Sentry initialized for ${process.env.NODE_ENV} environment`);
};

// Helper functions for common error scenarios
export const captureAPIError = (error: Error, context: {
  method: string;
  path: string;
  userId?: string;
  requestId?: string;
  body?: any;
}) => {
  Sentry.withScope((scope) => {
    scope.setTag('errorType', 'api');
    scope.setContext('api', {
      method: context.method,
      path: context.path,
      userId: context.userId,
      requestId: context.requestId
    });
    
    if (context.body && typeof context.body === 'object') {
      // Filter sensitive data before logging
      const sanitizedBody = { ...context.body };
      Object.keys(sanitizedBody).forEach(key => {
        if (key.toLowerCase().includes('password') || 
            key.toLowerCase().includes('secret') ||
            key.toLowerCase().includes('token')) {
          sanitizedBody[key] = '[Filtered]';
        }
      });
      scope.setContext('requestBody', sanitizedBody);
    }
    
    Sentry.captureException(error);
  });
};

export const captureAuthError = (error: Error, context: {
  email?: string;
  provider?: string;
  action: string;
}) => {
  Sentry.withScope((scope) => {
    scope.setTag('errorType', 'authentication');
    scope.setContext('auth', {
      email: context.email,
      provider: context.provider,
      action: context.action
    });
    
    Sentry.captureException(error);
  });
};

export const captureDatabaseError = (error: Error, context: {
  query?: string;
  operation: string;
  table?: string;
}) => {
  Sentry.withScope((scope) => {
    scope.setTag('errorType', 'database');
    scope.setContext('database', {
      query: context.query?.substring(0, 200), // Truncate long queries
      operation: context.operation,
      table: context.table
    });
    
    Sentry.captureException(error);
  });
};

// Performance monitoring
export const startTransaction = (name: string, operation: string) => {
  return Sentry.startTransaction({
    name,
    op: operation
  });
};

// Add breadcrumb for debugging
export const addBreadcrumb = (message: string, category: string, level: Sentry.SeverityLevel = 'info', data?: any) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data
  });
};

// Set user context
export const setUser = (user: {
  id: string;
  email?: string;
  username?: string;
}) => {
  Sentry.setUser(user);
};

// Clear user context (on logout)
export const clearUser = () => {
  Sentry.setUser(null);
};

// Express middleware for request tracking
export const sentryRequestHandler = () => Sentry.Handlers.requestHandler();
export const sentryTracingHandler = () => Sentry.Handlers.tracingHandler();
export const sentryErrorHandler = () => Sentry.Handlers.errorHandler();

export default Sentry;