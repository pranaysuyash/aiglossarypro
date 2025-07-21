import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { captureException, withScope } from '@sentry/react';
import { 
  errorTracker, 
  ErrorSeverity, 
  ErrorCategory, 
  handleErrorBoundary,
  setupGlobalErrorHandlers 
} from '../errorTracking';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  withScope: vi.fn((callback) => callback({
    setLevel: vi.fn(),
    setTag: vi.fn(),
    setContext: vi.fn(),
    setUser: vi.fn(),
  })),
}));

// Mock fetch
global.fetch = vi.fn();

describe('ErrorTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true
    });

    // Mock import.meta.env
    vi.stubEnv('DEV', true);
    vi.stubEnv('PROD', false);

    // Mock window.Sentry
    (window as any).Sentry = true;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    delete (window as any).Sentry;
  });

  describe('trackError', () => {
    it('should track error with default severity and category', () => {
      const error = new Error('Test error');
      errorTracker.trackError(error);

      expect(console.error).toHaveBeenCalledWith('[Error Tracking]', {
        message: 'Test error',
        stack: expect.any(String),
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.UNKNOWN,
        context: undefined,
      });

      expect(captureException).toHaveBeenCalledWith(error);
    });

    it('should track error with custom severity and category', () => {
      const error = new Error('Critical error');
      const context = {
        user: { id: 'user123', email: 'test@example.com' },
        page: '/dashboard',
      };

      errorTracker.trackError(error, ErrorSeverity.CRITICAL, ErrorCategory.API, context);

      expect(withScope).toHaveBeenCalled();
      const scopeMock = {
        setLevel: vi.fn(),
        setTag: vi.fn(),
        setContext: vi.fn(),
        setUser: vi.fn(),
      };
      
      // Call the withScope callback to test scope configuration
      const callback = (withScope as any).mock.calls[0][0];
      callback(scopeMock);

      expect(scopeMock.setLevel).toHaveBeenCalledWith('fatal');
      expect(scopeMock.setTag).toHaveBeenCalledWith('category', ErrorCategory.API);
      expect(scopeMock.setUser).toHaveBeenCalledWith({
        id: 'user123',
        email: 'test@example.com',
        type: undefined,
      });
    });

    it('should handle string errors', () => {
      errorTracker.trackError('String error message');

      expect(console.error).toHaveBeenCalledWith('[Error Tracking]', {
        message: 'String error message',
        stack: expect.any(String),
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.UNKNOWN,
        context: undefined,
      });
    });

    it('should queue errors when offline', () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const error = new Error('Offline error');
      errorTracker.trackError(error);

      // Error should still be logged
      expect(console.error).toHaveBeenCalled();
      // But not sent to analytics in offline mode
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not send to Sentry if Sentry is not available', () => {
      delete (window as any).Sentry;
      
      const error = new Error('No Sentry error');
      errorTracker.trackError(error);

      expect(captureException).not.toHaveBeenCalled();
    });
  });

  describe('trackAPIError', () => {
    it('should track API errors with proper context', () => {
      errorTracker.trackAPIError('/api/users', 500, 'Internal Server Error');

      expect(console.error).toHaveBeenCalledWith('[Error Tracking]', {
        message: 'API Error: /api/users returned 500 - Internal Server Error',
        stack: expect.any(String),
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.API,
        context: {
          metadata: {
            endpoint: '/api/users',
            statusCode: 500,
          },
        },
      });
    });

    it('should use medium severity for 4xx errors', () => {
      errorTracker.trackAPIError('/api/auth', 401, new Error('Unauthorized'));

      expect(console.error).toHaveBeenCalledWith('[Error Tracking]', 
        expect.objectContaining({
          severity: ErrorSeverity.MEDIUM,
        })
      );
    });
  });

  describe('trackPerformanceIssue', () => {
    it('should track performance issues when threshold is exceeded', () => {
      errorTracker.trackPerformanceIssue('pageLoad', 5000, 3000);

      expect(console.error).toHaveBeenCalledWith('[Error Tracking]', {
        message: 'Performance threshold exceeded: pageLoad took 5000ms (threshold: 3000ms)',
        stack: expect.any(String),
        severity: ErrorSeverity.LOW,
        category: ErrorCategory.PERFORMANCE,
        context: {
          metadata: {
            metric: 'pageLoad',
            value: 5000,
            threshold: 3000,
          },
        },
      });
    });

    it('should not track when value is below threshold', () => {
      errorTracker.trackPerformanceIssue('apiCall', 100, 500);

      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('Analytics integration', () => {
    it('should send errors to analytics in production', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);
      
      (global.fetch as any).mockResolvedValueOnce({ ok: true });

      const error = new Error('Production error');
      errorTracker.trackError(error);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalledWith('/api/errors/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('Production error'),
      });
    });

    it('should not send to analytics in development', async () => {
      vi.stubEnv('PROD', false);
      vi.stubEnv('DEV', true);

      const error = new Error('Dev error');
      errorTracker.trackError(error);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle analytics endpoint failures gracefully', async () => {
      vi.stubEnv('PROD', true);
      vi.stubEnv('DEV', false);
      
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const error = new Error('Test error');
      errorTracker.trackError(error);

      await new Promise(resolve => setTimeout(resolve, 0));

      // Should log the analytics failure but not throw
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send error to analytics:',
        expect.any(Error)
      );
    });
  });

  describe('Online/Offline handling', () => {
    it('should flush error queue when coming back online', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const error1 = new Error('Offline error 1');
      const error2 = new Error('Offline error 2');
      
      errorTracker.trackError(error1);
      errorTracker.trackError(error2);

      // Clear previous calls
      vi.clearAllMocks();

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      // Errors should be re-tracked
      expect(captureException).toHaveBeenCalledTimes(2);
      expect(captureException).toHaveBeenCalledWith(error1);
      expect(captureException).toHaveBeenCalledWith(error2);
    });

    it('should not flush errors older than 1 hour', () => {
      // Mock Date.now to control timestamps
      const originalDateNow = Date.now;
      const mockNow = 1000000;
      Date.now = vi.fn(() => mockNow);

      // Start offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      // Track an error
      const oldError = new Error('Old error');
      errorTracker.trackError(oldError);

      // Move time forward by 2 hours
      Date.now = vi.fn(() => mockNow + 7200000);

      // Clear previous calls
      vi.clearAllMocks();

      // Come back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));

      // Old error should not be re-tracked
      expect(captureException).not.toHaveBeenCalled();

      // Restore Date.now
      Date.now = originalDateNow;
    });
  });

  describe('Error statistics', () => {
    it('should return error statistics structure', () => {
      const stats = errorTracker.getErrorStats();

      expect(stats).toEqual({
        total: 0,
        byCategory: {
          api: 0,
          authentication: 0,
          payment: 0,
          performance: 0,
          ui: 0,
          network: 0,
          validation: 0,
          unknown: 0,
        },
        bySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0,
        },
      });
    });
  });
});

describe('Error handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    (window as any).Sentry = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleErrorBoundary', () => {
    it('should track React Error Boundary errors', () => {
      const error = new Error('Component error');
      const errorInfo = { componentStack: 'at Component\nat ErrorBoundary' };

      handleErrorBoundary(error, errorInfo);

      expect(captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('setupGlobalErrorHandlers', () => {
    it('should handle unhandled promise rejections', () => {
      setupGlobalErrorHandlers();

      const event = new PromiseRejectionEvent('unhandledrejection', {
        reason: 'Promise rejected',
        promise: Promise.reject('test'),
      });

      window.dispatchEvent(event);

      expect(captureException).toHaveBeenCalled();
    });

    it('should handle global errors', () => {
      setupGlobalErrorHandlers();

      const errorEvent = new ErrorEvent('error', {
        error: new Error('Global error'),
        message: 'Global error',
        filename: 'script.js',
        lineno: 10,
        colno: 5,
      });

      window.dispatchEvent(errorEvent);

      expect(captureException).toHaveBeenCalled();
    });

    it('should handle global errors without error object', () => {
      setupGlobalErrorHandlers();

      const errorEvent = new ErrorEvent('error', {
        message: 'Script error',
        filename: 'external-script.js',
        lineno: 1,
        colno: 1,
      });

      window.dispatchEvent(errorEvent);

      expect(captureException).toHaveBeenCalled();
    });
  });
});