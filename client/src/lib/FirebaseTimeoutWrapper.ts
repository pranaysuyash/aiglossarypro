/**
 * Optimized Firebase Timeout Wrapper
 * Addresses performance issues with authentication timeouts
 */

import { firebaseErrorHandler } from './FirebaseErrorHandler';

// Timeout configuration
export interface TimeoutConfig {
    timeout: number;
    operation: string;
    retryOnTimeout: boolean;
    maxRetries: number;
}

// Optimized timeout configurations for better performance
export const DEFAULT_TIMEOUTS: Record<string, TimeoutConfig> = {
    signIn: {
        timeout: 15000, // Reduced to 15 seconds for better UX
        operation: 'signIn',
        retryOnTimeout: true,
        maxRetries: 3, // Increased retries
    },
    signUp: {
        timeout: 20000, // Reduced to 20 seconds for account creation
        operation: 'signUp',
        retryOnTimeout: true,
        maxRetries: 2,
    },
    signOut: {
        timeout: 5000, // 5 seconds
        operation: 'signOut',
        retryOnTimeout: false,
        maxRetries: 0,
    },
    tokenRefresh: {
        timeout: 10000, // 10 seconds
        operation: 'tokenRefresh',
        retryOnTimeout: true,
        maxRetries: 3,
    },
    authStateChange: {
        timeout: 5000, // 5 seconds
        operation: 'authStateChange',
        retryOnTimeout: false,
        maxRetries: 0,
    },
};

/**
 * Progressive timeout strategy
 * Increases timeout on each retry attempt
 */
export function getProgressiveTimeout(baseTimeout: number, retryCount: number): number {
    // Increase timeout by 50% for each retry
    return Math.floor(baseTimeout * Math.pow(1.5, retryCount));
}

/**
 * Network status check before authentication
 */
export async function checkNetworkStatus(): Promise<boolean> {
    try {
        // Try to fetch a small resource from Firebase
        const response = await fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo', {
            method: 'HEAD',
            mode: 'no-cors'
        });
        return true;
    } catch {
        return false;
    }
}

/**
 * Timeout error class
 */
export class TimeoutError extends Error {
    public readonly code = 'auth/timeout';
    public readonly operation: string;

    constructor(message: string, operation: string) {
        super(message);
        this.name = 'TimeoutError';
        this.operation = operation;
    }
}

/**
 * Enhanced timeout wrapper with progressive timeout
 */
export async function withTimeout<T>(
    operation: () => Promise<T>,
    config: TimeoutConfig,
    retryCount: number = 0
): Promise<T> {
    // Check network status before critical operations
    if (config.operation === 'signIn' || config.operation === 'signUp') {
        const isNetworkAvailable = await checkNetworkStatus();
        if (!isNetworkAvailable) {
            throw new Error('Network connection appears to be unavailable');
        }
    }

    // Use progressive timeout for retries
    const timeout = retryCount > 0 
        ? getProgressiveTimeout(config.timeout, retryCount)
        : config.timeout;

    return new Promise(async (resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new TimeoutError(
                `Operation '${config.operation}' timed out after ${timeout}ms`,
                config.operation
            ));
        }, timeout);

        try {
            const result = await operation();
            clearTimeout(timer);
            resolve(result);
        } catch (error: any) {
            clearTimeout(timer);
            
            // Handle retry logic
            if (config.retryOnTimeout && retryCount < config.maxRetries) {
                const shouldRetry = await firebaseErrorHandler.handleAuthError(
                    error,
                    config.operation,
                    { retryCount }
                );

                if (shouldRetry) {
                    // Add exponential backoff delay
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    
                    return withTimeout(operation, config, retryCount + 1);
                }
            }

            reject(error);
        }
    });
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

/**
 * Preemptive Firebase connection warming
 * Call this on app start to reduce initial auth latency
 */
export async function warmFirebaseConnection(): Promise<void> {
    try {
        // Warm up the connection with a lightweight request
        await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup', {
            method: 'HEAD',
            mode: 'no-cors'
        });
    } catch {
        // Ignore errors, this is just a warming request
    }
}