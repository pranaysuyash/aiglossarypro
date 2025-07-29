import { useEffect, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

/**
 * Hook to track page loading state based on React Query fetching/mutating state
 */
export function usePageLoading() {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Show loading if any queries are fetching or mutating
    setIsLoading(isFetching > 0 || isMutating > 0);
  }, [isFetching, isMutating]);

  return isLoading;
}

/**
 * Hook to show a loading skeleton for a minimum duration
 * Prevents flashing of loading states for quick operations
 */
export function useMinimumLoadingTime(isLoading: boolean, minDuration = 300) {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading && !loadingStartTime) {
      // Start loading
      setShowLoading(true);
      setLoadingStartTime(Date.now());
    } else if (!isLoading && loadingStartTime) {
      // Calculate how long we've been loading
      const elapsed = Date.now() - loadingStartTime;
      const remaining = Math.max(0, minDuration - elapsed);

      if (remaining > 0) {
        // Keep showing loading for the minimum duration
        setTimeout(() => {
          setShowLoading(false);
          setLoadingStartTime(null);
        }, remaining);
      } else {
        // We've already shown loading for long enough
        setShowLoading(false);
        setLoadingStartTime(null);
      }
    }
  }, [isLoading, loadingStartTime, minDuration]);

  return showLoading;
}