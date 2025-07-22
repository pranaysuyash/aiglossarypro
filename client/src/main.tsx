import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
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

// Render React app immediately
const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorBoundary>
    <Suspense fallback={<div>Loading...</div>}>
      <App />
    </Suspense>
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

    // Initialize PWA Service Worker after initial render
    import('./utils/serviceWorkerRegistration');
    
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
    import('./utils/serviceWorkerRegistration');
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