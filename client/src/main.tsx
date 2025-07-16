import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initAnalytics, initReactScanIntegration } from './lib/analytics';
import { setupGlobalErrorHandlers } from './utils/errorTracking';

// Performance monitoring
const startTime = performance.now();

// Remove initial loader when React renders
function removeInitialLoader() {
  const loader = document.querySelector('.loader');
  if (loader) {
    loader.remove();
  }
}

// Initialize analytics
initAnalytics();

// Initialize React Scan integration
initReactScanIntegration();

// Setup global error handlers
setupGlobalErrorHandlers();

// Initialize PWA Service Worker
import './utils/serviceWorkerRegistration';

const root = createRoot(document.getElementById('root')!);

root.render(
  <ErrorBoundary>
    <Suspense fallback={<div>Loading...</div>}>
      <App />
    </Suspense>
  </ErrorBoundary>
);

// Remove loader after React hydration
setTimeout(removeInitialLoader, 100);

// Log performance metrics
if (process.env.NODE_ENV === 'development') {
  const endTime = performance.now();
  console.log(`React initialization took ${endTime - startTime} milliseconds`);
}
