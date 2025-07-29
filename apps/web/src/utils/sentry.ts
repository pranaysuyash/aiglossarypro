import * as Sentry from '@sentry/react';
import React from 'react';

// Initialize Sentry for frontend error tracking
export const initSentry = () => {
  if (import.meta.env.MODE !== 'production') {
    // Skip Sentry in development unless explicitly enabled
    if (!import.meta.env.VITE_SENTRY_DSN_DEV) {
      console.log('Sentry disabled in development environment');
      return;
    }
  }

  const dsn = import.meta.env.VITE_SENTRY_DSN || import.meta.env.VITE_SENTRY_DSN_DEV;

  if (!dsn) {
    console.warn('Sentry DSN not configured - error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    release: import.meta.env.VITE_APP_VERSION,

    // Performance monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,

    // Session replay (for debugging user interactions)
    replaysSessionSampleRate: import.meta.env.MODE === 'production' ? 0.01 : 0.1,
    replaysOnErrorSampleRate: 1.0,

    integrations: [
      // Browser tracing integration
      Sentry.browserTracingIntegration(),

      // Session replay
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: true,
      }),
    ],

    // Configure which data to send
    beforeSend(event, _hint) {
      // Filter out sensitive data from forms
      if (event.request?.data) {
        const data = event.request.data;
        if (typeof data === 'object' && data !== null) {
          Object.keys(data).forEach(key => {
            if (
              key.toLowerCase().includes('password') ||
              key.toLowerCase().includes('secret') ||
              key.toLowerCase().includes('token')
            ) {
              (data as Record<string, any>)[key] = '[Filtered]';
            }
          });
        }
      }

      // Don't send events for development builds unless explicitly enabled
      if (import.meta.env.MODE === 'development' && !import.meta.env.VITE_SENTRY_DSN_DEV) {
        return null;
      }

      return event;
    },

    // Ignore certain errors that are not actionable
    ignoreErrors: [
      // Browser extensions
      'Non-Error promise rejection captured',
      // Network errors that are expected
      'NetworkError when attempting to fetch resource',
      'Failed to fetch',
      // ResizeObserver loop limit exceeded (common browser quirk)
      'ResizeObserver loop limit exceeded',
    ],
  });

  console.log(`Frontend Sentry initialized for ${import.meta.env.MODE} environment`);
};

// Helper functions for common frontend error scenarios
export const captureUIError = (
  error: Error,
  context: {
    component?: string;
    action?: string;
    userId?: string;
    props?: Record<string, unknown>;
  }
) => {
  Sentry.withScope(scope => {
    scope.setTag('errorType', 'ui');
    scope.setContext('ui', {
      component: context.component,
      action: context.action,
      userId: context.userId,
    });

    if (context.props) {
      // Filter sensitive props
      const sanitizedProps = { ...context.props };
      Object.keys(sanitizedProps).forEach(key => {
        if (
          key.toLowerCase().includes('password') ||
          key.toLowerCase().includes('secret') ||
          key.toLowerCase().includes('token')
        ) {
          sanitizedProps[key] = '[Filtered]';
        }
      });
      scope.setContext('componentProps', sanitizedProps);
    }

    Sentry.captureException(error);
  });
};

export const captureAPIError = (
  error: Error,
  context: {
    endpoint: string;
    method: string;
    status?: number;
    userId?: string;
  }
) => {
  Sentry.withScope(scope => {
    scope.setTag('errorType', 'api');
    scope.setContext('api', {
      endpoint: context.endpoint,
      method: context.method,
      status: context.status,
      userId: context.userId,
    });

    Sentry.captureException(error);
  });
};

export const captureUserAction = (
  action: string,
  context?: {
    userId?: string;
    termId?: string;
    category?: string;
    searchQuery?: string;
  }
) => {
  Sentry.addBreadcrumb({
    message: `User action: ${action}`,
    category: 'user',
    level: 'info',
    data: context,
  });
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  const span = Sentry.startSpan(
    {
      name,
      op: 'navigation',
    },
    () => {
      try {
        return fn();
      } catch (error) {
        Sentry.captureException(error);
        throw error;
      }
    }
  );

  return span;
};

// React Error Boundary HOC
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryOptions?: {
    fallback?: React.ComponentType<{ error: unknown; resetError: () => void }>;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    showDialog?: boolean;
  }
) => {
  const ErrorFallback = ({ error, resetError }: { error: unknown; resetError: () => void }) => {
    const _errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return React.createElement(
      'div',
      {
        className: 'flex items-center justify-center min-h-96 p-8',
      },
      React.createElement(
        'div',
        {
          className: 'text-center',
        },
        React.createElement(
          'h2',
          {
            className: 'text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4',
          },
          'Something went wrong'
        ),
        React.createElement(
          'p',
          {
            className: 'text-gray-600 dark:text-gray-400 mb-6',
          },
          "We've been notified about this error and will fix it soon."
        ),
        React.createElement(
          'button',
          {
            onClick: resetError,
            className:
              'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors',
          },
          'Try again'
        )
      )
    );
  };

  return Sentry.withErrorBoundary(Component, {
    fallback: ErrorFallback,
    showDialog: import.meta.env.MODE !== 'production',
    ...errorBoundaryOptions,
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

export default Sentry;
