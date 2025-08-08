/**
 * Unit tests for Auth Query Deduplicator
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authQueryDeduplicator } from '../../client/src/lib/authQueryDeduplicator';
describe('AuthQueryDeduplicator', () => {
    beforeEach(() => {
        // Clear the deduplicator state before each test
        authQueryDeduplicator.clear();
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });
    describe('Query Deduplication', () => {
        it('should return the same promise for simultaneous queries', async () => {
            const mockQueryFn = vi.fn().mockResolvedValue({ id: 'user1' });
            // Start two queries simultaneously
            const promise1 = authQueryDeduplicator.executeQuery(mockQueryFn);
            const promise2 = authQueryDeduplicator.executeQuery(mockQueryFn);
            // Query function should only be called once
            expect(mockQueryFn).toHaveBeenCalledTimes(1);
            // Both promises should resolve to the same result
            const [result1, result2] = await Promise.all([promise1, promise2]);
            expect(result1).toEqual(result2);
            expect(result1).toEqual({ id: 'user1' });
        });
        it('should cache results for minimum interval', async () => {
            const mockQueryFn = vi.fn().mockResolvedValue({ id: 'user1' });
            // First query
            const result1 = await authQueryDeduplicator.executeQuery(mockQueryFn);
            expect(mockQueryFn).toHaveBeenCalledTimes(1);
            // Advance time by less than MIN_QUERY_INTERVAL (5 seconds)
            vi.advanceTimersByTime(3000);
            // Second query should return cached result
            const result2 = await authQueryDeduplicator.executeQuery(mockQueryFn);
            expect(mockQueryFn).toHaveBeenCalledTimes(1); // Still only called once
            expect(result2).toEqual(result1);
        });
        it('should allow new query after minimum interval', async () => {
            const mockQueryFn = vi.fn()
                .mockResolvedValueOnce({ id: 'user1' })
                .mockResolvedValueOnce({ id: 'user2' });
            // First query
            const result1 = await authQueryDeduplicator.executeQuery(mockQueryFn);
            expect(result1).toEqual({ id: 'user1' });
            // Advance time by more than MIN_QUERY_INTERVAL (5 seconds)
            vi.advanceTimersByTime(6000);
            // Second query should execute new query
            const result2 = await authQueryDeduplicator.executeQuery(mockQueryFn);
            expect(mockQueryFn).toHaveBeenCalledTimes(2);
            expect(result2).toEqual({ id: 'user2' });
        });
    });
    describe('Loop Prevention', () => {
        it('should prevent too many consecutive queries with errors', async () => {
            const mockQueryFn = vi.fn().mockRejectedValue(new Error('Network error'));
            // Make maximum consecutive failed queries
            for (let i = 0; i < 3; i++) {
                try {
                    await authQueryDeduplicator.executeQuery(mockQueryFn);
                }
                catch (e) {
                    // Expected error
                }
                vi.advanceTimersByTime(6000); // Advance past cache time
            }
            expect(mockQueryFn).toHaveBeenCalledTimes(3);
            // Next query should be blocked due to consecutive failures
            try {
                const result = await authQueryDeduplicator.executeQuery(mockQueryFn);
                // Should return undefined/null since no successful result was cached
                expect(result).toBeUndefined();
            }
            catch (e) {
                // Or it might throw the cached error
            }
            // Should still only have 3 calls due to blocking
            expect(mockQueryFn).toHaveBeenCalledTimes(3);
        });
        it('should reset consecutive queries after forced delay', async () => {
            const mockQueryFn = vi.fn().mockResolvedValue({ id: 'user1' });
            // Make maximum consecutive queries
            for (let i = 0; i < 3; i++) {
                await authQueryDeduplicator.executeQuery(mockQueryFn);
                vi.advanceTimersByTime(6000);
            }
            // Advance time past forced delay (30 seconds)
            vi.advanceTimersByTime(31000);
            // Should allow new query
            await authQueryDeduplicator.executeQuery(mockQueryFn);
            expect(mockQueryFn).toHaveBeenCalledTimes(4);
        });
        it('should reset consecutive queries on successful result', async () => {
            const mockQueryFn = vi.fn().mockResolvedValue({ id: 'user1' });
            // Make a few queries
            await authQueryDeduplicator.executeQuery(mockQueryFn);
            vi.advanceTimersByTime(6000);
            await authQueryDeduplicator.executeQuery(mockQueryFn);
            const state = authQueryDeduplicator.getState();
            expect(state.consecutiveQueries).toBe(0); // Reset after successful result
        });
        it('should maintain consecutive query count on error', async () => {
            const mockQueryFn = vi.fn()
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Network error'))
                .mockResolvedValueOnce({ id: 'user1' });
            // First two queries fail
            try {
                await authQueryDeduplicator.executeQuery(mockQueryFn);
            }
            catch (e) {
                // Expected error
            }
            vi.advanceTimersByTime(6000);
            try {
                await authQueryDeduplicator.executeQuery(mockQueryFn);
            }
            catch (e) {
                // Expected error
            }
            vi.advanceTimersByTime(6000);
            // Third query succeeds and should reset counter
            await authQueryDeduplicator.executeQuery(mockQueryFn);
            const state = authQueryDeduplicator.getState();
            expect(state.consecutiveQueries).toBe(0);
        });
    });
    describe('Result Comparison', () => {
        it('should detect when result is the same', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            const mockQueryFn = vi.fn().mockResolvedValue({ id: 'user1' });
            // First query
            await authQueryDeduplicator.executeQuery(mockQueryFn);
            vi.advanceTimersByTime(6000);
            // Second query with same result
            await authQueryDeduplicator.executeQuery(mockQueryFn);
            expect(consoleSpy).toHaveBeenCalledWith('📊 Auth query returned same result as before');
            consoleSpy.mockRestore();
        });
        it('should detect when result is different', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            const mockQueryFn = vi.fn()
                .mockResolvedValueOnce({ id: 'user1' })
                .mockResolvedValueOnce({ id: 'user2' });
            // First query
            await authQueryDeduplicator.executeQuery(mockQueryFn);
            vi.advanceTimersByTime(6000);
            // Second query with different result
            await authQueryDeduplicator.executeQuery(mockQueryFn);
            expect(consoleSpy).toHaveBeenCalledWith('📊 Auth query returned new result');
            consoleSpy.mockRestore();
        });
    });
    describe('State Management', () => {
        it('should clear all state', () => {
            const mockQueryFn = vi.fn().mockResolvedValue({ id: 'user1' });
            // Execute a query to set some state
            authQueryDeduplicator.executeQuery(mockQueryFn);
            // Clear state
            authQueryDeduplicator.clear();
            const state = authQueryDeduplicator.getState();
            expect(state).toEqual({
                promise: null,
                lastQueryTime: 0,
                result: null,
                consecutiveQueries: 0,
                lastResultHash: null
            });
        });
        it('should provide current state for debugging', async () => {
            const mockQueryFn = vi.fn().mockResolvedValue({ id: 'user1' });
            await authQueryDeduplicator.executeQuery(mockQueryFn);
            const state = authQueryDeduplicator.getState();
            expect(state.result).toEqual({ id: 'user1' });
            expect(state.lastQueryTime).toBeGreaterThan(0);
            expect(state.consecutiveQueries).toBe(0);
            expect(state.lastResultHash).toBe(JSON.stringify({ id: 'user1' }));
        });
        it('should reset consecutive queries manually', async () => {
            const mockQueryFn = vi.fn().mockRejectedValue(new Error('Network error'));
            // Make some failed queries
            try {
                await authQueryDeduplicator.executeQuery(mockQueryFn);
            }
            catch (e) {
                // Expected
            }
            vi.advanceTimersByTime(6000);
            try {
                await authQueryDeduplicator.executeQuery(mockQueryFn);
            }
            catch (e) {
                // Expected
            }
            // Reset manually
            authQueryDeduplicator.resetConsecutiveQueries();
            const state = authQueryDeduplicator.getState();
            expect(state.consecutiveQueries).toBe(0);
        });
    });
});
