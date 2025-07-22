/**
 * Firebase Timeout Wrapper
 * Adds timeout handling to Firebase authentication operations
 */

import { firebaseErrorHandler } from './FirebaseErrorHandler';

// Timeout configuration
export interface TimeoutConfig {
    timeout: number;
    operation: string;
    retryOnTimeout: boolean;
    maxRetries: number;
}

// Default timeout configurations for different operations
export const DEFAULT_TIMEOUTS: Record<string, TimeoutConfig> = {
    signIn: {
        timeout: 5000, // 5 seconds
        operation: 'signIn',
        retryOnTimeout: true,
        maxRetries: 2,
    },
    signUp: {
        timeout: 8000, // 8 seconds for account creation
        operation: 'signUp',
        retryOnTimeout: true,
        maxRetries: 2,
    },
    signOut: {
        timeout: 3000, // 3 seconds
        operation: 'signOut',
        retryOnTimeout: false,
        maxRetries: 0,
    },
    tokenRefresh: {
        timeout: 5000, // 5 seconds
        operation: 'tokenRefresh',
        retryOnTimeout: true,
        maxRetries: 3,
    },
    authStateChange: {
        timeout: 2000, // 2 seconds
        operation: 'authStateChange',
        retryOnTimeout: false,
        maxRetries: 0,
    },
};

/**
 * Timeout error class
 */
export class TimeoutError extends Error {
    constructor(operation: string, timeout: number) {
        super(`Operation '${operation}' timed out after ${timeout}ms`);
        this.name = 'TimeoutError';
    }
}

/**
 * Wrap a Firebase operation with timeout handling
 */
export async function withTimeout<T>(
    operation: () => Promise<T>,
    config: TimeoutConfig
): Promise<T> {
    const { timeout, operation: operationName, retryOnTimeout, maxRetries } = config;

    const executeWithTimeout = async (): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new TimeoutError(operationName, timeout));
            }, timeout);

            operation()
                .then((result) => {
                    clearTimeout(timeoutId);
                    resolve(result);
                })
                .catch((error) => {
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    };

    if (retryOnTimeout && maxRetries > 0) {
        return firebaseErrorHandler.retryOperation(
            executeWithTimeout,
            operationName,
            { maxRetries }
        );
    }

    try {
        return await executeWithTimeout();
    } catch (error) {
        if (error instanceof TimeoutError) {
            const firebaseError = await firebaseErrorHandler.handleAuthError(
                error,
                operationName,
                { timeout, retryOnTimeout, maxRetries }
            );
            throw firebaseError;
        }
        throw error;
    }
}

/**
 * Create a timeout wrapper for a specific operation
 */
export function createTimeoutWrapper<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    operationName: string,
    customTimeout?: number
): (...args: T) => Promise<R> {
    const config = DEFAULT_TIMEOUTS[operationName] || {
        timeout: customTimeout || 5000,
        operation: operationName,
        retryOnTimeout: true,
        maxRetries: 2,
    };

    if (customTimeout) {
        config.timeout = customTimeout;
    }

    return async (...args: T): Promise<R> => {
        return withTimeout(() => fn(...args), config);
    };
}

/**
 * Batch timeout wrapper for multiple operations
 */
export async function withBatchTimeout<T>(
    operations: Array<{
        operation: () => Promise<T>;
        name: string;
        timeout?: number;
    }>,
    globalTimeout: number = 10000
): Promise<T[]> {
    const batchPromise = Promise.all(
        operations.map(({ operation, name, timeout }) =>
            withTimeout(operation, {
                timeout: timeout || DEFAULT_TIMEOUTS[name]?.timeout || 5000,
                operation: name,
                retryOnTimeout: false,
                maxRetries: 0,
            })
        )
    );

    return withTimeout(() => batchPromise, {
        timeout: globalTimeout,
        operation: 'batchOperation',
        retryOnTimeout: false,
        maxRetries: 0,
    });
}

/**
 * Race timeout - returns the first successful operation or timeout
 */
export async function raceWithTimeout<T>(
    operations: Array<{
        operation: () => Promise<T>;
        name: string;
        priority: number;
    }>,
    timeout: number = 5000
): Promise<{ result: T; operationName: string }> {
    const sortedOperations = operations.sort((a, b) => a.priority - b.priority);

    const racePromise = Promise.race(
        sortedOperations.map(async ({ operation, name }) => {
            try {
                const result = await operation();
                return { result, operationName: name };
            } catch (error) {
                // Log error but don't fail the race
                console.warn(`Operation ${name} failed in race:`, error);
                throw error;
            }
        })
    );

    return withTimeout(() => racePromise, {
        timeout,
        operation: 'raceOperation',
        retryOnTimeout: false,
        maxRetries: 0,
    });
}

/**
 * Timeout queue for managing multiple concurrent operations
 */
export class TimeoutQueue {
    private queue: Map<string, Promise<any>> = new Map();
    private maxConcurrent: number;
    private currentCount: number = 0;

    constructor(maxConcurrent: number = 3) {
        this.maxConcurrent = maxConcurrent;
    }

    async add<T>(
        key: string,
        operation: () => Promise<T>,
        config: TimeoutConfig
    ): Promise<T> {
        // If operation is already in queue, return existing promise
        if (this.queue.has(key)) {
            return this.queue.get(key);
        }

        // Wait if we've reached max concurrent operations
        while (this.currentCount >= this.maxConcurrent) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.currentCount++;

        const promise = withTimeout(operation, config)
            .finally(() => {
                this.currentCount--;
                this.queue.delete(key);
            });

        this.queue.set(key, promise);
        return promise;
    }

    clear(): void {
        this.queue.clear();
        this.currentCount = 0;
    }

    size(): number {
        return this.queue.size;
    }
}

// Export singleton timeout queue
export const timeoutQueue = new TimeoutQueue(3);