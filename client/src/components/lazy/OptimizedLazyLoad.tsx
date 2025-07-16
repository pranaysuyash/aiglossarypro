import { type ComponentType, lazy, Suspense, useEffect, useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from '@/hooks/useInView';

interface OptimizedLazyLoadProps {
  // Component import function
  importFn: () => Promise<{ default: ComponentType<any> }>;
  // Fallback component while loading
  fallback?: React.ReactNode;
  // Preload on hover
  preloadOnHover?: boolean;
  // Preload when near viewport
  preloadDistance?: string;
  // Custom error fallback
  errorFallback?: React.ReactNode;
  // Component props
  componentProps?: Record<string, any>;
  // Retry attempts on error
  retryAttempts?: number;
  // Retry delay in ms
  retryDelay?: number;
}

// Cache for preloaded components
const componentCache = new Map<string, ComponentType<any>>();
const preloadPromises = new Map<string, Promise<any>>();

export function OptimizedLazyLoad({
  importFn,
  fallback,
  preloadOnHover = true,
  preloadDistance = '200px',
  errorFallback,
  componentProps = {},
  retryAttempts = 3,
  retryDelay = 1000,
}: OptimizedLazyLoadProps) {
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { ref, isInView } = useInView({
    threshold: 0,
    rootMargin: preloadDistance,
  });

  // Generate a unique key for this component
  const componentKey = importFn.toString();

  // Preload component function
  const preloadComponent = async () => {
    if (componentCache.has(componentKey)) {
      return componentCache.get(componentKey)!;
    }

    if (preloadPromises.has(componentKey)) {
      return preloadPromises.get(componentKey);
    }

    const promise = importFn()
      .then(module => {
        const comp = module.default;
        componentCache.set(componentKey, comp);
        preloadPromises.delete(componentKey);
        return comp;
      })
      .catch(err => {
        preloadPromises.delete(componentKey);
        throw err;
      });

    preloadPromises.set(componentKey, promise);
    return promise;
  };

  // Load component with retry logic
  const loadComponent = async () => {
    try {
      const comp = await preloadComponent();
      setComponent(() => comp);
      setError(null);
    } catch (err) {
      setError(err as Error);

      if (retryCount < retryAttempts) {
        setTimeout(
          () => {
            setRetryCount(prev => prev + 1);
            loadComponent();
          },
          retryDelay * (retryCount + 1)
        );
      }
    }
  };

  // Load when in view
  useEffect(() => {
    if (isInView && !Component && !error) {
      loadComponent();
    }
  }, [isInView]);

  // Preload on hover
  const handleMouseEnter = () => {
    if (preloadOnHover && !Component && !componentCache.has(componentKey)) {
      preloadComponent().catch(() => {}); // Ignore errors during preload
    }
  };

  // Error state
  if (error && retryCount >= retryAttempts) {
    return (
      <ErrorBoundary
        fallback={
          errorFallback || (
            <div className="p-4 text-center">
              <p className="text-red-600 dark:text-red-400">Failed to load component</p>
              <button
                onClick={() => {
                  setRetryCount(0);
                  setError(null);
                  loadComponent();
                }}
                className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          )
        }
      >
        <div />
      </ErrorBoundary>
    );
  }

  // Loading state
  if (!Component) {
    return (
      <div ref={ref} onMouseEnter={handleMouseEnter}>
        {fallback || <DefaultFallback />}
      </div>
    );
  }

  // Render component
  return (
    <ErrorBoundary>
      <Suspense fallback={fallback || <DefaultFallback />}>
        <Component {...componentProps} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Default loading fallback
function DefaultFallback() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

// Preload multiple components
export function preloadComponents(
  importFns: Array<() => Promise<{ default: ComponentType<any> }>>
) {
  return Promise.all(
    importFns.map(fn => {
      const key = fn.toString();
      if (!componentCache.has(key) && !preloadPromises.has(key)) {
        return fn()
          .then(module => {
            componentCache.set(key, module.default);
          })
          .catch(() => {}); // Ignore errors during preload
      }
      return Promise.resolve();
    })
  );
}

// Hook for preloading on interaction
export function usePreloadOnInteraction(
  importFn: () => Promise<{ default: ComponentType<any> }>,
  event: 'mouseenter' | 'focus' | 'touchstart' = 'mouseenter'
) {
  const [isPreloaded, setIsPreloaded] = useState(false);
  const key = importFn.toString();

  const preload = async () => {
    if (!isPreloaded && !componentCache.has(key)) {
      try {
        const module = await importFn();
        componentCache.set(key, module.default);
        setIsPreloaded(true);
      } catch (error: any) {
        console.error('Failed to preload component:', error);
      }
    }
  };

  return {
    [event]: preload,
    isPreloaded: isPreloaded || componentCache.has(key),
  };
}

// Clear component cache (useful for memory management)
export function clearComponentCache() {
  componentCache.clear();
  preloadPromises.clear();
}
