import { QueryKey } from '@tanstack/react-query';
import { AuthStateManager } from './AuthStateManager';

// Track auth queries globally
const authQueryTracker = {
  lastQueryTime: 0,
  queryCount: 0,
  resetTime: Date.now()
};

// Minimum time between auth queries (1 second - reduced for faster auth updates)
const MIN_QUERY_INTERVAL = 1000;

// Maximum queries per minute
const MAX_QUERIES_PER_MINUTE = 10;

/**
 * Custom query key with deduplication
 */
export const authQueryKey: QueryKey = ['/api/auth/user'];

/**
 * Check if we should allow an auth query
 */
export function shouldAllowAuthQuery(): boolean {
  const now = Date.now();
  const authStateManager = AuthStateManager.getInstance();

  // Always allow the first query
  const isFirstQuery = authQueryTracker.lastQueryTime === 0;
  if (isFirstQuery) {
    console.log('✅ First auth query - allowing through');
    return true;
  }

  // Check circuit breaker first
  if (!authStateManager.canMakeAuthRequest()) {
    console.log('🚫 Auth query blocked by circuit breaker');
    return false;
  }

  // Check minimum interval
  if (now - authQueryTracker.lastQueryTime < MIN_QUERY_INTERVAL) {
    console.log(`🚫 Auth query blocked: Too soon (${now - authQueryTracker.lastQueryTime}ms since last query)`);
    return false;
  }

  // Reset counter every minute
  if (now - authQueryTracker.resetTime > 60000) {
    authQueryTracker.queryCount = 0;
    authQueryTracker.resetTime = now;
  }

  // Check rate limit
  if (authQueryTracker.queryCount >= MAX_QUERIES_PER_MINUTE) {
    console.log(`🚫 Auth query blocked: Rate limit exceeded (${authQueryTracker.queryCount} queries this minute)`);
    return false;
  }

  return true;
}

/**
 * Record that an auth query was made
 */
export function recordAuthQuery(): void {
  authQueryTracker.lastQueryTime = Date.now();
  authQueryTracker.queryCount++;
  console.log(`📊 Auth query #${authQueryTracker.queryCount} recorded`);
}

/**
 * Reset auth query tracker (for testing)
 */
export function resetAuthQueryTracker(): void {
  authQueryTracker.lastQueryTime = 0;
  authQueryTracker.queryCount = 0;
  authQueryTracker.resetTime = Date.now();
}

/**
 * Get auth query options with protection and deduplication
 */
export function getAuthQueryOptions() {
  return {
    queryKey: authQueryKey,
    enabled: shouldAllowAuthQuery(),
    staleTime: 5 * 60 * 1000, // 5 minutes - consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnReconnect: false, // Don't refetch when network reconnects
    refetchInterval: false, // No automatic refetching
    retry: 1, // Allow one retry for auth queries to handle temporary issues
    retryOnMount: false, // Don't retry on mount
    networkMode: 'online' as const, // Only run when online
    // Query deduplication is handled by React Query automatically for same query keys
    // Additional deduplication is handled by authQueryDeduplicator
  };
}