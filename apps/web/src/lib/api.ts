/**
 * Simple API utility for making HTTP requests
 */

interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiError extends Error {
  status: number;
  response?: unknown;

  constructor(message: string, status: number, response?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

async function request<T = Record<string, unknown>>(
  method: string,
  endpoint: string,
  data?: Record<string, unknown>,
  options?: { timeout?: number; signal?: AbortSignal }
): Promise<ApiResponse<T>> {
  // Get API base URL from environment or use relative path as fallback
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  
  // Build the full URL
  const url = endpoint.startsWith('/api')
    ? endpoint
    : endpoint.startsWith('/')
      ? `${apiBaseUrl}${endpoint}`
      : endpoint;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if token exists
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    // localStorage might not be available (SSR, incognito mode, etc.)
    console.warn('Failed to access localStorage for auth token:', error);
  }

  // Setup timeout and abort controller
  const timeout = options?.timeout || 30000; // 30 second default timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const requestOptions: RequestInit = {
    method,
    headers,
    credentials: 'include',
    signal: options?.signal || controller.signal,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, requestOptions);
    clearTimeout(timeoutId); // Clear timeout on successful response
    
    // Check if response is valid JSON
    let result;
    try {
      result = await response.json();
    } catch (parseError) {
      throw new ApiError(
        `Invalid JSON response: ${parseError instanceof Error ? parseError.message : 'Parse error'}`,
        response.status
      );
    }

    if (!response.ok) {
      throw new ApiError(
        result?.error || result?.message || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        result
      );
    }

    // Validate response structure
    if (typeof result !== 'object' || result === null) {
      throw new ApiError(
        'Invalid response format: expected object',
        response.status,
        result
      );
    }

    return result;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle abort/timeout errors
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timeout or was cancelled', 0, error);
    }
    
    // Handle network errors, CORS issues, etc.
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error: Unable to connect to server', 0, error);
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      0,
      error
    );
  }
}

export const api = {
  get: <T = Record<string, unknown>>(
    endpoint: string, 
    options?: { timeout?: number; signal?: AbortSignal }
  ) => request<T>('GET', endpoint, undefined, options),
  
  post: <T = Record<string, unknown>>(
    endpoint: string, 
    data?: Record<string, unknown>,
    options?: { timeout?: number; signal?: AbortSignal }
  ) => request<T>('POST', endpoint, data, options),
  
  put: <T = Record<string, unknown>>(
    endpoint: string, 
    data?: Record<string, unknown>,
    options?: { timeout?: number; signal?: AbortSignal }
  ) => request<T>('PUT', endpoint, data, options),
  
  patch: <T = Record<string, unknown>>(
    endpoint: string, 
    data?: Record<string, unknown>,
    options?: { timeout?: number; signal?: AbortSignal }
  ) => request<T>('PATCH', endpoint, data, options),
  
  delete: <T = Record<string, unknown>>(
    endpoint: string,
    options?: { timeout?: number; signal?: AbortSignal }
  ) => request<T>('DELETE', endpoint, undefined, options),
};

export type { ApiResponse, ApiError };
