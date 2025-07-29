import { isInLogoutState } from '@/lib/authPersistence';
import { MemoryMonitor } from '@/lib/MemoryMonitor';
import { IndexedDBManager } from '@/lib/IndexedDBManager';
import { QueryClient, type QueryFunction } from '@tanstack/react-query';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  const requestInit: RequestInit = {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    credentials: 'include',
  };

  if (data) {
    requestInit.body = JSON.stringify(data);
  }

  const res = await fetch(url, requestInit);

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = 'returnNull' | 'throw';
export const getQueryFn: <T>(options: { on401: UnauthorizedBehavior }) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      // Check if we're in logout state for auth queries
      if (queryKey[0] === '/api/auth/user' && isInLogoutState()) {
        console.log('🚫 Blocking auth query during logout state');
        return null;
      }

      // Prepare headers
      const headers: Record<string, string> = {};

      // Add Authorization header if token exists
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(queryKey[0] as string, {
        credentials: 'include',
        headers,
      });

      if (unauthorizedBehavior === 'returnNull' && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const jsonResponse = await res.json();

      // Extract data from API response format {success: true, data: ...}
      if (
        jsonResponse &&
        typeof jsonResponse === 'object' &&
        'success' in jsonResponse &&
        'data' in jsonResponse
      ) {
        return jsonResponse.data;
      }

      // Return full response if not in expected format
      return jsonResponse;
    };

// Memory-optimized query client with automatic cleanup
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: 'returnNull' }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 300000, // 5 minutes
      gcTime: 600000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except 408, 429
        if (error instanceof Error && error.message.includes('4')) {
          const status = parseInt(error.message.split(':')[0]);
          if (status >= 400 && status < 500 && status !== 408 && status !== 429) {
            return false;
          }
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        if (error instanceof Error && error.message.includes('4')) {
          const status = parseInt(error.message.split(':')[0]);
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry once for server errors
        return failureCount < 1;
      },
      retryDelay: 1000,
    },
  },
});

// Memory optimization: Set cache size limits
const MAX_CACHE_SIZE = 50; // Maximum number of queries to cache
const MEMORY_CHECK_INTERVAL = 30000; // Check memory every 30 seconds

// Register cleanup function with memory monitor (only in browser environment)
if (typeof window !== 'undefined') {
  try {
    MemoryMonitor.registerCleanupFunction(() => {
      console.log('🧹 Emergency query cache cleanup triggered');

      // Get all queries and sort by last access time
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.getAll();

      // Remove oldest queries if cache is too large
      if (queries.length > MAX_CACHE_SIZE) {
        const sortedQueries = queries
          .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0))
          .slice(0, queries.length - MAX_CACHE_SIZE);

        sortedQueries.forEach(query => {
          queryCache.remove(query);
        });

        console.log(`🧹 Removed ${sortedQueries.length} old queries from cache`);
      }

      // Force garbage collection of query cache
      queryClient.getQueryCache().clear();
      queryClient.getMutationCache().clear();
    });
  } catch (error) {
    console.warn('Failed to register memory monitor cleanup:', error);
  }
}

// Periodic cache optimization
let cacheOptimizationInterval: NodeJS.Timeout | null = null;

function startCacheOptimization() {
  if (cacheOptimizationInterval) {
    return;
  }

  cacheOptimizationInterval = setInterval(() => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();

    // Check if cache size exceeds limit
    if (queries.length > MAX_CACHE_SIZE) {
      console.log(`🧹 Cache size (${queries.length}) exceeds limit (${MAX_CACHE_SIZE}), cleaning up...`);

      // Remove stale queries first
      const staleQueries = queries.filter(query => {
        const staleTime = query.options.staleTime || 0;
        const dataUpdatedAt = query.state.dataUpdatedAt || 0;
        return Date.now() - dataUpdatedAt > staleTime;
      });

      staleQueries.forEach(query => {
        queryCache.remove(query);
      });

      // If still too many, remove oldest queries
      const remainingQueries = queryCache.getAll();
      if (remainingQueries.length > MAX_CACHE_SIZE) {
        const sortedQueries = remainingQueries
          .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0))
          .slice(0, remainingQueries.length - MAX_CACHE_SIZE);

        sortedQueries.forEach(query => {
          queryCache.remove(query);
        });
      }

      console.log(`🧹 Cache cleanup completed, ${queryCache.getAll().length} queries remaining`);
    }

    // Check memory usage and trigger GC if needed
    const memoryStats = MemoryMonitor.getMemoryStats();
    if (memoryStats.current && memoryStats.current.usedJSHeapSize > 256 * 1024 * 1024) {
      MemoryMonitor.triggerGarbageCollection();
    }
  }, MEMORY_CHECK_INTERVAL);
}

function stopCacheOptimization() {
  if (cacheOptimizationInterval) {
    clearInterval(cacheOptimizationInterval);
    cacheOptimizationInterval = null;
  }
}

// Start cache optimization when module loads (only in browser)
if (typeof window !== 'undefined') {
  startCacheOptimization();

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    stopCacheOptimization();
  });
}

// Export cache management functions
export const cacheManager = {
  startOptimization: startCacheOptimization,
  stopOptimization: stopCacheOptimization,
  getCacheSize: () => queryClient.getQueryCache().getAll().length,
  clearCache: () => {
    queryClient.getQueryCache().clear();
    queryClient.getMutationCache().clear();
  },
  optimizeCache: () => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();

    if (queries.length > MAX_CACHE_SIZE) {
      const sortedQueries = queries
        .sort((a, b) => (a.state.dataUpdatedAt || 0) - (b.state.dataUpdatedAt || 0))
        .slice(0, queries.length - MAX_CACHE_SIZE);

      sortedQueries.forEach(query => {
        queryCache.remove(query);
      });

      return sortedQueries.length;
    }

    return 0;
  },
};
