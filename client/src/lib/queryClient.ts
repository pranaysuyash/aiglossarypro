import { QueryClient, type QueryFunction } from '@tanstack/react-query';
import { isInLogoutState } from '@/lib/authPersistence';

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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: 'returnNull' }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
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
