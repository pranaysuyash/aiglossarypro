import { captureException, withScope, SeverityLevel } from '@sentry/react';

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories
export enum ErrorCategory {
  API = 'api',
  AUTH = 'authentication',
  PAYMENT = 'payment',
  PERFORMANCE = 'performance',
  UI = 'ui',
  NETWORK = 'network',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

interface ErrorContext {
  user?: {
    id?: string;
    email?: string;
    type?: 'free' | 'premium' | 'guest';
    subscription?: {
      plan: 'free' | 'premium' | 'lifetime';
      expiresAt?: Date;
      trialEndsAt?: Date;
    };
    sessionId?: string;
    deviceId?: string;
  };
  page?: string;
  action?: string;
  severity?: ErrorSeverity;
  category?: ErrorCategory;
  metadata?: Record<string, any>;
  // Performance monitoring
  performance?: {
    pageLoadTime?: number;
    apiResponseTime?: number;
    renderTime?: number;
    memoryUsage?: number;
  };
  // Analytics tracking
  analytics?: {
    sessionDuration?: number;
    pageViews?: number;
    lastInteraction?: string;
    referrer?: string;
  };
  // Content management
  content?: {
    termId?: string;
    categoryId?: string;
    searchQuery?: string;
    contentType?: 'term' | 'category' | 'learning-path';
  };
  // Admin features
  adminAction?: {
    type: 'create' | 'update' | 'delete' | 'bulk-action';
    entityType: string;
    entityId?: string;
    changes?: Record<string, any>;
  };
  // Device and browser info
  device?: {
    type: 'mobile' | 'tablet' | 'desktop';
    os?: string;
    browser?: string;
    screenResolution?: string;
    connectionType?: string;
  };
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private errorQueue: Array<{ error: Error; context: ErrorContext; timestamp: number }> = [];
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  // Track an error with context
  trackError(
    error: Error | string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    context?: ErrorContext
  ): void {
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    // Enhanced error object with additional metadata
    const enhancedError = {
      ...errorObj,
      severity,
      category,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context,
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('[Error Tracking]', {
        message: errorObj.message,
        stack: errorObj.stack,
        severity,
        category,
        context,
      });
    }

    // Send to Sentry if available
    if (window.Sentry) {
      withScope(scope => {
        scope.setLevel(this.mapSeverityToSentryLevel(severity));
        scope.setTag('category', category);
        scope.setContext('error_details', enhancedError);

        if (context?.user) {
          scope.setUser({
            id: context.user.id,
            email: context.user.email,
            type: context.user.type,
          });
        }

        captureException(errorObj);
      });
    }

    // Queue error if offline
    if (!this.isOnline) {
      this.errorQueue.push({
        error: errorObj,
        context: { ...context, severity, category },
        timestamp: Date.now(),
      });
    }

    // Send to custom analytics endpoint
    this.sendToAnalytics(enhancedError);
  }

  // Track API errors specifically
  trackAPIError(
    endpoint: string,
    statusCode: number,
    error: Error | string,
    context?: ErrorContext
  ): void {
    const apiError = new Error(
      `API Error: ${endpoint} returned ${statusCode} - ${typeof error === 'string' ? error : error.message}`
    );

    this.trackError(
      apiError,
      statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      ErrorCategory.API,
      {
        ...context,
        metadata: {
          ...context?.metadata,
          endpoint,
          statusCode,
        },
      }
    );
  }

  // Track performance issues
  trackPerformanceIssue(
    metric: string,
    value: number,
    threshold: number,
    context?: ErrorContext
  ): void {
    if (value > threshold) {
      const perfError = new Error(
        `Performance threshold exceeded: ${metric} took ${value}ms (threshold: ${threshold}ms)`
      );

      this.trackError(perfError, ErrorSeverity.LOW, ErrorCategory.PERFORMANCE, {
        ...context,
        metadata: {
          ...context?.metadata,
          metric,
          value,
          threshold,
        },
      });
    }
  }

  // Map internal severity to Sentry levels
  private mapSeverityToSentryLevel(severity: ErrorSeverity): SeverityLevel {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'info';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.CRITICAL:
        return 'fatal';
      default:
        return 'error';
    }
  }

  // Send errors to custom analytics endpoint
  private async sendToAnalytics(error: any): Promise<void> {
    try {
      // Only send in production
      if (import.meta.env.PROD) {
        await fetch('/api/errors/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(error),
        });
      }
    } catch (err) {
      // Silently fail - don't create error loop
      console.error('Failed to send error to analytics:', err);
    }
  }

  // Flush queued errors when coming back online
  private flushErrorQueue(): void {
    while (this.errorQueue.length > 0) {
      const { error, context, timestamp } = this.errorQueue.shift()!;

      // Only send if error is less than 1 hour old
      if (Date.now() - timestamp < 3600000) {
        this.trackError(error, context.severity, context.category, context);
      }
    }
  }

  // Get error statistics
  getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    // This would typically fetch from your analytics backend
    return {
      total: 0,
      byCategory: Object.values(ErrorCategory).reduce(
        (acc, cat) => ({ ...acc, [cat]: 0 }),
        {}
      ) as Record<ErrorCategory, number>,
      bySeverity: Object.values(ErrorSeverity).reduce(
        (acc, sev) => ({ ...acc, [sev]: 0 }),
        {}
      ) as Record<ErrorSeverity, number>,
    };
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance();

// React Error Boundary error handler
export const handleErrorBoundary = (error: Error, errorInfo: { componentStack: string }) => {
  errorTracker.trackError(error, ErrorSeverity.HIGH, ErrorCategory.UI, {
    metadata: {
      componentStack: errorInfo.componentStack,
    },
  });
};

// Global error handler
export const setupGlobalErrorHandlers = () => {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    errorTracker.trackError(
      new Error(`Unhandled Promise Rejection: ${event.reason}`),
      ErrorSeverity.HIGH,
      ErrorCategory.UNKNOWN,
      {
        metadata: {
          reason: event.reason,
          promise: event.promise,
        },
      }
    );
  });

  // Global error handler
  window.addEventListener('error', event => {
    errorTracker.trackError(
      event.error || new Error(event.message),
      ErrorSeverity.HIGH,
      ErrorCategory.UNKNOWN,
      {
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      }
    );
  });
};
