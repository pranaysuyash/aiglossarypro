/**
 * Development Tools Utilities
 *
 * Enhanced development experience with better error handling,
 * debugging tools, and development-specific features.
 */

// Global error handler for development
export function setupDevErrorHandling() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Enhanced console logging for development
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  console.error = (...args) => {
    // Add timestamp and stack trace in development
    const timestamp = new Date().toISOString();
    originalError(`[${timestamp}] ERROR:`, ...args);

    // Try to get stack trace
    if (args[0] instanceof Error) {
      originalError('Stack trace:', args[0].stack);
    }
  };

  console.warn = (...args) => {
    const timestamp = new Date().toISOString();
    originalWarn(`[${timestamp}] WARN:`, ...args);
  };

  // Enhanced development logging
  console.log = (...args) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      originalLog(`[${timestamp}] LOG:`, ...args);
    }
  };

  // Global unhandled promise rejection handler
  window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled Promise Rejection:', event.reason);

    // Prevent default browser behavior
    event.preventDefault();

    // You could show a custom error overlay here
    if (window.__DEV_ERROR_OVERLAY__) {
      window.__DEV_ERROR_OVERLAY__.showError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        type: 'promise-rejection',
      });
    }
  });

  // Global error handler
  window.addEventListener('error', event => {
    console.error('Global Error:', event.error);

    if (window.__DEV_ERROR_OVERLAY__) {
      window.__DEV_ERROR_OVERLAY__.showError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        type: 'javascript-error',
      });
    }
  });
}

// Development performance monitoring
export function setupDevPerformanceMonitoring() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            // Tasks longer than 50ms
            console.warn(`Long Task Detected: ${entry.duration.toFixed(2)}ms`, entry);
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }

  // Monitor layout shifts
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.value > 0.1) {
            // CLS threshold
            console.warn(`Layout Shift Detected: ${entry.value.toFixed(4)}`, entry);
          }
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Layout shift monitoring not available:', error);
    }
  }
}

// Development debugging helpers
export const devTools = {
  // Log component renders
  logRender: (componentName: string, props?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Render: ${componentName}`, props);
    }
  },

  // Log API calls
  logApiCall: (method: string, url: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 API ${method.toUpperCase()}: ${url}`, data);
    }
  },

  // Log state changes
  logStateChange: (stateName: string, oldValue: any, newValue: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 State Change: ${stateName}`, {
        from: oldValue,
        to: newValue,
      });
    }
  },

  // Performance timing
  time: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(`⏱️  ${label}`);
    }
  },

  timeEnd: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`⏱️  ${label}`);
    }
  },

  // Memory usage
  logMemoryUsage: () => {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memory = (performance as any).memory;
      console.log('💾 Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
      });
    }
  },
};

// Source map support detection
export function checkSourceMapSupport() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Check if source maps are working
  const error = new Error('Source map test');
  const stack = error.stack;

  if (stack && stack.includes('.ts:') && !stack.includes('.js:')) {
    console.log('✅ Source maps are working correctly');
  } else {
    console.warn('⚠️  Source maps may not be configured correctly');
    console.log('Stack trace:', stack);
  }
}

// Initialize development tools
export function initDevTools() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  console.log('🔧 Initializing development tools...');

  setupDevErrorHandling();
  setupDevPerformanceMonitoring();
  checkSourceMapSupport();

  // Add development tools to window for debugging
  (window as any).__DEV_TOOLS__ = devTools;

  console.log('✅ Development tools initialized');
  console.log('💡 Access dev tools via window.__DEV_TOOLS__');
}
