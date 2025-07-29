import { useAppState } from '@/contexts/AppStateContext';
import { useQuery, useQueryClient, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

interface OptimizedQueryOptions<TData, TError = Error> extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
    queryKey: QueryKey;
    queryFn: () => Promise<TData>;
    // Additional optimization options
    backgroundRefetch?: boolean;
    errorNotification?: boolean;
    loadingState?: boolean;
}

/**
 * Optimized query hook with built-in error handling and loading state management
 */
export function useOptimizedQuery<TData, TError = Error>({
    queryKey,
    queryFn,
    backgroundRefetch = true,
    errorNotification = true,
    loadingState = false,
    ...options
}: OptimizedQueryOptions<TData, TError>) {
    const { setLoading, setError, addNotification } = useAppState();
    const queryClient = useQueryClient();

    // Memoize the query function to prevent unnecessary re-renders
    const memoizedQueryFn = useCallback(queryFn, [queryFn]);

    // Enhanced query options with error handling
    const enhancedOptions = useMemo(() => ({
        ...options,
        queryKey,
        queryFn: memoizedQueryFn,
        refetchOnWindowFocus: backgroundRefetch,
        onError: (error: TError) => {
            if (errorNotification) {
                addNotification({
                    type: 'error' as const,
                    message: error instanceof Error ? error.message : 'An error occurred',
                    autoClose: true,
                });
            }

            if (loadingState) {
                setLoading(false);
            }

            setError(error instanceof Error ? error.message : 'An error occurred');

            // Call original onError if provided
            options.onError?.(error);
        },
        onSuccess: (data: TData) => {
            if (loadingState) {
                setLoading(false);
            }

            setError(null);

            // Call original onSuccess if provided
            options.onSuccess?.(data);
        },
        onSettled: (data: TData | undefined, error: TError | null) => {
            if (loadingState) {
                setLoading(false);
            }

            // Call original onSettled if provided
            options.onSettled?.(data, error);
        },
    }), [
        options,
        queryKey,
        memoizedQueryFn,
        backgroundRefetch,
        errorNotification,
        loadingState,
        addNotification,
        setLoading,
        setError,
    ]);

    const query = useQuery(enhancedOptions);

    // Set loading state when query starts
    if (loadingState && query.isLoading && !query.isFetching) {
        setLoading(true);
    }

    // Enhanced refetch function with error handling
    const optimizedRefetch = useCallback(async () => {
        if (loadingState) {
            setLoading(true);
        }

        try {
            const result = await query.refetch();
            return result;
        } catch (error) {
            if (errorNotification) {
                addNotification({
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Failed to refresh data',
                    autoClose: true,
                });
            }
            throw error;
        } finally {
            if (loadingState) {
                setLoading(false);
            }
        }
    }, [query.refetch, loadingState, setLoading, errorNotification, addNotification]);

    // Invalidate related queries
    const invalidateRelated = useCallback((relatedKeys: QueryKey[]) => {
        relatedKeys.forEach(key => {
            queryClient.invalidateQueries({ queryKey: key });
        });
    }, [queryClient]);

    return {
        ...query,
        refetch: optimizedRefetch,
        invalidateRelated,
    };
}

/**
 * Hook for managing multiple related queries efficiently
 */
export function useOptimizedQueries<T extends Record<string, any>>(
    queries: {
        [K in keyof T]: OptimizedQueryOptions<T[K]>;
    }
) {
    const queryResults = {} as {
        [K in keyof T]: ReturnType<typeof useOptimizedQuery<T[K]>>;
    };

    // Execute all queries
    Object.keys(queries).forEach(key => {
        const queryKey = key as keyof T;
        queryResults[queryKey] = useOptimizedQuery(queries[queryKey]);
    });

    // Aggregate loading and error states
    const isLoading = Object.values(queryResults).some(result => result.isLoading);
    const hasError = Object.values(queryResults).some(result => result.error);
    const errors = Object.values(queryResults)
        .map(result => result.error)
        .filter(Boolean);

    // Refetch all queries
    const refetchAll = useCallback(async () => {
        const promises = Object.values(queryResults).map(result => result.refetch());
        return Promise.allSettled(promises);
    }, [queryResults]);

    return {
        queries: queryResults,
        isLoading,
        hasError,
        errors,
        refetchAll,
    };
}

/**
 * Hook for prefetching data to improve performance
 */
export function usePrefetch() {
    const queryClient = useQueryClient();

    const prefetchQuery = useCallback(
        <TData>(queryKey: QueryKey, queryFn: () => Promise<TData>, staleTime = 300000) => {
            queryClient.prefetchQuery({
                queryKey,
                queryFn,
                staleTime,
            });
        },
        [queryClient]
    );

    const prefetchOnHover = useCallback(
        <TData>(queryKey: QueryKey, queryFn: () => Promise<TData>) => {
            return {
                onMouseEnter: () => prefetchQuery(queryKey, queryFn),
            };
        },
        [prefetchQuery]
    );

    return {
        prefetchQuery,
        prefetchOnHover,
    };
}