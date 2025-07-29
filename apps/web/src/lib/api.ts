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
  data?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  // Fix double /api issue - only add /api if endpoint doesn't already start with /api
  const url = endpoint.startsWith('/api')
    ? endpoint
    : endpoint.startsWith('/')
      ? `/api${endpoint}`
      : endpoint;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add Authorization header if token exists
  const token = localStorage.getItem('authToken');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include',
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      throw new ApiError(
        result.error || result.message || `HTTP ${response.status}`,
        response.status,
        result
      );
    }

    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Network error', 0);
  }
}

export const api = {
  get: <T = Record<string, unknown>>(endpoint: string) => request<T>('GET', endpoint),
  post: <T = Record<string, unknown>>(endpoint: string, data?: Record<string, unknown>) =>
    request<T>('POST', endpoint, data),
  put: <T = Record<string, unknown>>(endpoint: string, data?: Record<string, unknown>) =>
    request<T>('PUT', endpoint, data),
  patch: <T = Record<string, unknown>>(endpoint: string, data?: Record<string, unknown>) =>
    request<T>('PATCH', endpoint, data),
  delete: <T = Record<string, unknown>>(endpoint: string) => request<T>('DELETE', endpoint),
};

export type { ApiResponse, ApiError };
