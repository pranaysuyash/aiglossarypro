import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';

// Performance monitoring
const startTime = performance.now();

// Remove initial loader when React renders
function removeInitialLoader() {
  const loader = document.querySelector('.loader');
  if (loader) {
    loader.remove();
  }
}

// Import and setup development cleanup utilities
if (import.meta.env.DEV) {
  import('./utils/devCleanup').then(({ setupAutoCleanup }) => {
    setupAutoCleanup();
  });
  
  // Setup auth debugging utilities
  import('./utils/authDebug').then(({ setupNetworkDebugger }) => {
    setupNetworkDebugger();
  });
  
  // Always unregister service workers in development
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      if (registrations.length > 0) {
        console.log(`🔍 Found ${registrations.length} service worker(s) to unregister`);
        registrations.forEach(registration => {
          registration.unregister().then(success => {
            if (success) {
              console.log('🔥 [Dev] Unregistered service worker:', registration.scope);
            } else {
              console.error('❌ Failed to unregister service worker:', registration.scope);
            }
          });
        });
      }
    });
  }
}

// Render React app immediately
const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorBoundary>
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <App />
      </Suspense>
    </BrowserRouter>
  </ErrorBoundary>
);

// Defer non-critical initializations
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    // Initialize analytics after initial render
    import('./lib/analytics').then(({ initAnalytics, initReactScanIntegration }) => {
      initAnalytics();
      initReactScanIntegration();
    });

    // Setup error handlers after initial render
    import('./utils/errorTracking').then(({ setupGlobalErrorHandlers }) => {
      setupGlobalErrorHandlers();
    });

    // Initialize PWA Service Worker after initial render (only in production)
    if (import.meta.env.PROD) {
      import('./utils/serviceWorkerRegistration');
    }
    
    // Warm Firebase connection to reduce authentication latency
    import('./lib/firebase').then(({ warmFirebaseConnection }) => {
      if (warmFirebaseConnection) {
        warmFirebaseConnection();
      }
    });
    
    // Remove loader after React hydration
    removeInitialLoader();
  }, { timeout: 2000 });
} else {
  // Fallback for browsers without requestIdleCallback
  setTimeout(() => {
    import('./lib/analytics').then(({ initAnalytics, initReactScanIntegration }) => {
      initAnalytics();
      initReactScanIntegration();
    });
    import('./utils/errorTracking').then(({ setupGlobalErrorHandlers }) => {
      setupGlobalErrorHandlers();
    });
    // Initialize PWA Service Worker (only in production)
    if (import.meta.env.PROD) {
      import('./utils/serviceWorkerRegistration');
    }
    removeInitialLoader();
  }, 100);
}

// Log performance metrics
if (process.env.NODE_ENV === 'development') {
  requestAnimationFrame(() => {
    const endTime = performance.now();
    console.log(`React initialization took ${endTime - startTime} milliseconds`);
  });
  
  // Import Firebase test utility in development
  import('./lib/firebaseTest').then(() => {
    console.log('🔥 Firebase test utility loaded. Run testFirebaseConnection() in console to test.');
  });
}

// Initialize comprehensive performance tracking
import('./utils/performance').then(({ trackPerformanceMetrics }) => {
  // Wait for page load to complete before tracking
  if (document.readyState === 'complete') {
    trackPerformanceMetrics();
  } else {
    window.addEventListener('load', () => {
      // Delay slightly to ensure all metrics are available
      setTimeout(trackPerformanceMetrics, 100);
    });
  }
});