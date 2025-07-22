# Performance Optimization Guide

## Current Performance Issues

The application is experiencing a 101ms long task during initial load, which is causing slow startup times.

## Root Causes

1. **Synchronous Initializations in main.tsx**
   - Analytics (PostHog) initialization
   - React Scan integration setup
   - Global error handlers
   - Service Worker registration
   - All happening before React renders

2. **Heavy Initial Bundle**
   - Multiple providers and wrappers loading synchronously
   - Bundle analyzer running in development
   - Large number of imports in App.tsx

## Recommended Optimizations

### 1. Defer Non-Critical Initializations

Replace current main.tsx with main-optimized.tsx which:
- Renders React immediately
- Defers analytics, error tracking, and service worker to `requestIdleCallback`
- Uses dynamic imports for heavy modules

### 2. Lazy Load Analytics

```typescript
// Instead of immediate initialization
if (typeof window !== 'undefined') {
  requestIdleCallback(() => {
    import('./lib/analytics').then(({ initAnalytics }) => {
      initAnalytics();
    });
  });
}
```

### 3. Optimize PostHog Configuration

```typescript
// Reduce initial overhead
posthog.init(key, {
  api_host: 'https://app.posthog.com',
  autocapture: false, // Enable selectively later
  capture_pageview: false, // Capture manually after load
  loaded: (posthog) => {
    // Enable features after initial load
    requestIdleCallback(() => {
      posthog.startSessionRecording();
      posthog.capture('$pageview');
    });
  },
});
```

### 4. Split Service Worker Registration

```typescript
// Register service worker only after page is interactive
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    requestIdleCallback(() => {
      navigator.serviceWorker.register('/sw.js');
    });
  });
}
```

### 5. Optimize Bundle Size

- Use dynamic imports for routes (already implemented)
- Consider code splitting for large dependencies
- Tree-shake unused exports

### 6. Implementation Steps

1. **Immediate**: Replace main.tsx with main-optimized.tsx
2. **Short-term**: 
   - Defer PostHog autocapture
   - Lazy load error tracking
   - Optimize service worker registration timing
3. **Long-term**:
   - Implement route-based code splitting
   - Optimize bundle size with better tree-shaking
   - Consider using Web Workers for heavy computations

## Measuring Success

- Long tasks should be < 50ms
- Time to Interactive (TTI) should improve by 30-50%
- First Contentful Paint (FCP) should be < 1.5s

## Testing

After implementing optimizations:
1. Run `npm run build && npm run preview`
2. Check Chrome DevTools Performance tab
3. Look for reduction in long tasks
4. Verify all features still work correctly