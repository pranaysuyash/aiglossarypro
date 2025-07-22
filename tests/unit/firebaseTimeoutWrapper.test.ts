/**
 * Unit tests for Firebase Timeout Wrapper
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createTimeoutWrapper,
    DEFAULT_TIMEOUTS,
    raceWithTimeout,
    TimeoutError,
    TimeoutQueue,
    withBatchTimeout,
    withTimeout,
} from '../../client/src/lib/FirebaseTimeoutWrapper';

describe('FirebaseTimeoutWrapper', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('withTimeout', () => {
        it('should resolve when operation completes within timeout', async () => {
            const mockOperation = vi.fn().mockResolvedValue('success');
            const config = {
                timeout: 1000,
                operation: 'test',
                retryOnTimeout: false,
                maxRetries: 0,
            };

            const promise = withTimeout(mockOperation, config);

            // Fast-forward time but not past timeout
            vi.advanceTimersByTime(500);

            const result = await promise;
            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(1);
        });

        it('should reject with TimeoutError when operation exceeds timeout', async () => {
            const mockOperation = vi.fn().mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 2000))
            );

            const config = {
                timeout: 1000,
                operation: 'test',
                retryOnTimeout: false,
                maxRetries: 0,
            };

            const promise = withTimeout(mockOperation, config);

            // Fast-forward past timeout
            vi.advanceTimersByTime(1001);

            await expect(promise).rejects.toThrow(TimeoutError);
            await expect(promise).rejects.toThrow("Operation 'test' timed out after 1000ms");
        });

        it('should retry on timeout when configured', async () => {
            let callCount = 0;
            const mockOperation = vi.fn().mockImplementation(() => {
                callCount++;
                if (callCount === 1) {
                    return new Promise(resolve => setTimeout(resolve, 2000)); // Will timeout
                }
                return Promise.resolve('success');
            });

            const config = {
                timeout: 1000,
                operation: 'test',
                retryOnTimeout: true,
                maxRetries: 2,
            };

            const promise = withTimeout(mockOperation, config);

            // Let first attempt timeout
            vi.advanceTimersByTime(1001);

            // Let retry succeed
            vi.advanceTimersByTime(500);

            const result = await promise;
            expect(result).toBe('success');
        });

        it('should handle operation errors within timeout', async () => {
            const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));
            const config = {
                timeout: 1000,
                operation: 'test',
                retryOnTimeout: false,
                maxRetries: 0,
            };

            await expect(withTimeout(mockOperation, config)).rejects.toThrow('Operation failed');
        });
    });

    describe('createTimeoutWrapper', () => {
        it('should create a wrapped function with default timeout', async () => {
            const mockFn = vi.fn().mockResolvedValue('result');
            const wrappedFn = createTimeoutWrapper(mockFn, 'signIn');

            const result = await wrappedFn('arg1', 'arg2');

            expect(result).toBe('result');
            expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
        });

        it('should use custom timeout when provided', async () => {
            const mockFn = vi.fn().mockImplementation(
                () => new Promise(resolve => setTimeout(resolve, 2000))
            );

            const wrappedFn = createTimeoutWrapper(mockFn, 'customOperation', 1000);

            const promise = wrappedFn();
            vi.advanceTimersByTime(1001);

            await expect(promise).rejects.toThrow(TimeoutError);
        });

        it('should use predefined timeout configuration', async () => {
            const mockFn = vi.fn().mockResolvedValue('result');
            const wrappedFn = createTimeoutWrapper(mockFn, 'signIn');

            await wrappedFn();

            // Should use DEFAULT_TIMEOUTS.signIn configuration
            expect(mockFn).toHaveBeenCalled();
        });
    });

    describe('withBatchTimeout', () => {
        it('should execute multiple operations in parallel', async () => {
            const operations = [
                {
                    operation: vi.fn().mockResolvedValue('result1'),
                    name: 'op1',
                },
                {
                    operation: vi.fn().mockResolvedValue('result2'),
                    name: 'op2',
                },
                {
                    operation: vi.fn().mockResolvedValue('result3'),
                    name: 'op3',
                },
            ];

            const results = await withBatchTimeout(operations, 5000);

            expect(results).toEqual(['result1', 'result2', 'result3']);
            operations.forEach(op => {
                expect(op.operation).toHaveBeenCalledTimes(1);
            });
        });

        it('should timeout if global timeout is exceeded', async () => {
            const operations = [
                {
                    operation: vi.fn().mockImplementation(
                        () => new Promise(resolve => setTimeout(resolve, 3000))
                    ),
                    name: 'slowOp',
                },
            ];

            const promise = withBatchTimeout(operations, 1000);
            vi.advanceTimersByTime(1001);

            await expect(promise).rejects.toThrow(TimeoutError);
        });

        it('should handle individual operation failures', async () => {
            const operations = [
                {
                    operation: vi.fn().mockResolvedValue('success'),
                    name: 'goodOp',
                },
                {
                    operation: vi.fn().mockRejectedValue(new Error('Failed')),
                    name: 'badOp',
                },
            ];

            await expect(withBatchTimeout(operations, 5000)).rejects.toThrow('Failed');
        });
    });

    describe('raceWithTimeout', () => {
        it('should return result from first successful operation', async () => {
            const operations = [
                {
                    operation: vi.fn().mockImplementation(
                        () => new Promise(resolve => setTimeout(() => resolve('slow'), 1000))
                    ),
                    name: 'slowOp',
                    priority: 2,
                },
                {
                    operation: vi.fn().mockResolvedValue('fast'),
                    name: 'fastOp',
                    priority: 1,
                },
            ];

            const result = await raceWithTimeout(operations, 2000);

            expect(result).toEqual({
                result: 'fast',
                operationName: 'fastOp',
            });
        });

        it('should respect priority ordering', async () => {
            const operations = [
                {
                    operation: vi.fn().mockResolvedValue('lowPriority'),
                    name: 'lowPriorityOp',
                    priority: 3,
                },
                {
                    operation: vi.fn().mockResolvedValue('highPriority'),
                    name: 'highPriorityOp',
                    priority: 1,
                },
                {
                    operation: vi.fn().mockResolvedValue('mediumPriority'),
                    name: 'mediumPriorityOp',
                    priority: 2,
                },
            ];

            const result = await raceWithTimeout(operations, 2000);

            expect(result.operationName).toBe('highPriorityOp');
        });

        it('should timeout if no operation completes in time', async () => {
            const operations = [
                {
                    operation: vi.fn().mockImplementation(
                        () => new Promise(resolve => setTimeout(resolve, 2000))
                    ),
                    name: 'slowOp',
                    priority: 1,
                },
            ];

            const promise = raceWithTimeout(operations, 1000);
            vi.advanceTimersByTime(1001);

            await expect(promise).rejects.toThrow(TimeoutError);
        });
    });

    describe('TimeoutQueue', () => {
        let queue: TimeoutQueue;

        beforeEach(() => {
            queue = new TimeoutQueue(2); // Max 2 concurrent operations
        });

        it('should execute operations within concurrency limit', async () => {
            const mockOp1 = vi.fn().mockResolvedValue('result1');
            const mockOp2 = vi.fn().mockResolvedValue('result2');

            const config = {
                timeout: 1000,
                operation: 'test',
                retryOnTimeout: false,
                maxRetries: 0,
            };

            const promise1 = queue.add('op1', mockOp1, config);
            const promise2 = queue.add('op2', mockOp2, config);

            const results = await Promise.all([promise1, promise2]);

            expect(results).toEqual(['result1', 'result2']);
            expect(queue.size()).toBe(0);
        });

        it('should queue operations beyond concurrency limit', async () => {
            let resolveOp1: (value: string) => void;
            let resolveOp2: (value: string) => void;

            const mockOp1 = vi.fn().mockImplementation(
                () => new Promise<string>(resolve => { resolveOp1 = resolve; })
            );
            const mockOp2 = vi.fn().mockImplementation(
                () => new Promise<string>(resolve => { resolveOp2 = resolve; })
            );
            const mockOp3 = vi.fn().mockResolvedValue('result3');

            const config = {
                timeout: 5000,
                operation: 'test',
                retryOnTimeout: false,
                maxRetries: 0,
            };

            // Start first two operations (should execute immediately)
            const promise1 = queue.add('op1', mockOp1, config);
            const promise2 = queue.add('op2', mockOp2, config);

            // Third operation should be queued
            const promise3 = queue.add('op3', mockOp3, config);

            expect(queue.size()).toBe(3);

            // Complete first operation
            resolveOp1!('result1');
            await promise1;

            // Now third operation should start
            vi.advanceTimersByTime(100); // Allow queue processing

            const result3 = await promise3;
            expect(result3).toBe('result3');
        });

        it('should return existing promise for duplicate keys', async () => {
            const mockOp = vi.fn().mockResolvedValue('result');
            const config = {
                timeout: 1000,
                operation: 'test',
                retryOnTimeout: false,
                maxRetries: 0,
            };

            const promise1 = queue.add('sameKey', mockOp, config);
            const promise2 = queue.add('sameKey', mockOp, config);

            expect(promise1).toBe(promise2);
            expect(mockOp).toHaveBeenCalledTimes(1);
        });

        it('should clear queue', () => {
            const config = {
                timeout: 1000,
                operation: 'test',
                retryOnTimeout: false,
                maxRetries: 0,
            };

            queue.add('op1', vi.fn(), config);
            queue.add('op2', vi.fn(), config);

            expect(queue.size()).toBe(2);

            queue.clear();
            expect(queue.size()).toBe(0);
        });
    });

    describe('DEFAULT_TIMEOUTS', () => {
        it('should have appropriate timeout values for different operations', () => {
            expect(DEFAULT_TIMEOUTS.signIn.timeout).toBe(5000);
            expect(DEFAULT_TIMEOUTS.signUp.timeout).toBe(8000);
            expect(DEFAULT_TIMEOUTS.signOut.timeout).toBe(3000);
            expect(DEFAULT_TIMEOUTS.tokenRefresh.timeout).toBe(5000);
            expect(DEFAULT_TIMEOUTS.authStateChange.timeout).toBe(2000);
        });

        it('should configure retry behavior appropriately', () => {
            expect(DEFAULT_TIMEOUTS.signIn.retryOnTimeout).toBe(true);
            expect(DEFAULT_TIMEOUTS.signOut.retryOnTimeout).toBe(false);
            expect(DEFAULT_TIMEOUTS.authStateChange.retryOnTimeout).toBe(false);
        });
    });

    describe('TimeoutError', () => {
        it('should create timeout error with correct message', () => {
            const error = new TimeoutError('testOperation', 5000);

            expect(error.name).toBe('TimeoutError');
            expect(error.message).toBe("Operation 'testOperation' timed out after 5000ms");
        });
    });
});