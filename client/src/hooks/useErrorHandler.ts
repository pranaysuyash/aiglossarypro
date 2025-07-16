import { useCallback } from 'react';
import { ERROR_MESSAGES } from '@/constants/messages';
import { useToast } from './use-toast';

interface ErrorHandlerOptions {
  showToast?: boolean;
  retryAction?: () => void | Promise<void>;
  logError?: boolean;
}

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback(
    (error: Error | unknown, context?: string, options: ErrorHandlerOptions = {}) => {
      const { showToast = true, retryAction, logError = true } = options;

      // Convert unknown errors to Error objects
      const normalizedError = error instanceof Error ? error : new Error(String(error));

      // Log error for debugging
      if (logError) {
        console.error(`Error in ${context}:`, normalizedError);
      }

      // Determine error type and appropriate message
      let errorMessage:
        | typeof ERROR_MESSAGES.NETWORK_ERROR
        | typeof ERROR_MESSAGES.SESSION_ERROR
        | typeof ERROR_MESSAGES.PERMISSION_ERROR
        | typeof ERROR_MESSAGES.RATE_LIMIT_ERROR
        | typeof ERROR_MESSAGES.TERM_NOT_FOUND = ERROR_MESSAGES.NETWORK_ERROR;

      if (normalizedError.message.includes('fetch')) {
        errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
      } else if (
        normalizedError.message.includes('401') ||
        normalizedError.message.includes('unauthorized')
      ) {
        errorMessage = ERROR_MESSAGES.SESSION_ERROR;
      } else if (
        normalizedError.message.includes('403') ||
        normalizedError.message.includes('forbidden')
      ) {
        errorMessage = ERROR_MESSAGES.PERMISSION_ERROR;
      } else if (
        normalizedError.message.includes('429') ||
        normalizedError.message.includes('rate limit')
      ) {
        errorMessage = ERROR_MESSAGES.RATE_LIMIT_ERROR;
      } else if (normalizedError.message.includes('404')) {
        errorMessage = ERROR_MESSAGES.TERM_NOT_FOUND;
      }

      // Show toast notification
      if (showToast) {
        toast({
          title: errorMessage.title,
          description: errorMessage.description,
          variant: 'destructive',
        });
      }

      return {
        error: normalizedError,
        message: errorMessage,
        canRetry: !!retryAction,
      };
    },
    [toast]
  );

  const handleAsyncError = useCallback(
    async (
      asyncOperation: () => Promise<any>,
      context: string,
      options: ErrorHandlerOptions = {}
    ) => {
      try {
        return await asyncOperation();
      } catch (error) {
        return handleError(error, context, options);
      }
    },
    [handleError]
  );

  const withRetry = useCallback(
    async (operation: () => Promise<any>, maxRetries = 3, context = 'Operation') => {
      let lastError: Error;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt === maxRetries) {
            // Final attempt failed, show error
            handleError(lastError, `${context} (attempt ${attempt}/${maxRetries})`);
            throw lastError;
          }

          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * 2 ** (attempt - 1), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      throw lastError!;
    },
    [handleError]
  );

  return {
    handleError,
    handleAsyncError,
    withRetry,
  };
}

// Utility function for handling API errors specifically
export function getApiErrorMessage(error: any): string {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.status) {
    switch (error.response.status) {
      case 401:
        return ERROR_MESSAGES.SESSION_ERROR.description;
      case 403:
        return ERROR_MESSAGES.PERMISSION_ERROR.description;
      case 404:
        return ERROR_MESSAGES.TERM_NOT_FOUND.description;
      case 429:
        return ERROR_MESSAGES.RATE_LIMIT_ERROR.description;
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Server is temporarily unavailable. Please try again later.';
      default:
        return ERROR_MESSAGES.NETWORK_ERROR.description;
    }
  }
  return error?.message || ERROR_MESSAGES.NETWORK_ERROR.description;
}
