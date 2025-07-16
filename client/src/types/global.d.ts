/**
 * Global type declarations for development tools
 */

interface DevErrorOverlay {
  showError(error: {
    message: string;
    stack?: string;
    type: string;
    filename?: string;
    lineno?: number;
    colno?: number;
  }): void;
}

declare global {
  interface Window {
    __DEV_ERROR_OVERLAY__?: DevErrorOverlay;
    Sentry?: any;
  }
  
  interface PerformanceEntry {
    value?: number;
  }
  
  interface PerformanceEventTiming extends PerformanceEntry {
    processingStart: number;
  }
  
  interface PerformanceMemory {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }
  
  interface Performance {
    memory?: PerformanceMemory;
  }
  
  interface PerformanceEntry {
    hadRecentInput?: boolean;
  }
}

export {};