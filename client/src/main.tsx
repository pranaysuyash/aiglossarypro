import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAnalytics } from "./lib/analytics";

// Performance monitoring
const startTime = performance.now();

// Remove initial loader when React renders
function removeInitialLoader() {
  const loader = document.querySelector('.loader');
  if (loader) {
    loader.remove();
  }
}

// Error boundary for better UX
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize analytics
initAnalytics();

const root = createRoot(document.getElementById("root")!);

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
