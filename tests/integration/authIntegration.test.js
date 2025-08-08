/**
 * Integration tests for authentication loop prevention
 * Tests the complete integration of AuthStateManager, authQueryDeduplicator, and useAuth hook
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStateManager } from '../../client/src/lib/AuthStateManager';
import { authQueryDeduplicator } from '../../client/src/lib/authQueryDeduplicator';
// Mock fetch for API calls
global.fetch = vi.fn();
describe('Authentication Loop Prevention Integration', () => {
    let authStateManager;
    beforeEach(() => {
        // Reset singleton instances
        AuthStateManager.instance = undefined;
        authStateManager = AuthStateManager.getInstance();
        authQueryDeduplicator.clear();
        vi.useFakeTimers();
        vi.clearAllMocks();
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });
    describe('Circuit Breaker Integration', () => {
        it('should prevent auth queries when circuit breaker is open', () => {
            // Trigger circuit breaker by recording failures
            const error = new Error('Network error');
            authStateManager.recordFailure(error);
            authStateManager.recordFailure(error);
            authStateManager.recordFailure(error);
            // Circuit breaker should be open
            expect(authStateManager.canMakeAuthRequest()).toBe(false);
        });
        it('should allow queries after circuit breaker timeout', () => {
            // Open circuit breaker
            const error = new Error('Network error');
            authStateManager.recordFailure(error);
            authStateManager.recordFailure(error);
            authStateManager.recordFailure(error);
            expect(authStateManager.canMakeAuthRequest()).toBe(false);
            // Advance time past reset timeout (30 seconds)
            vi.advanceTimersByTime(31000);
            // Should transition to HALF_OPEN and allow one request
            expect(authStateManager.canMakeAuthRequest()).toBe(true);
        });
    });
    describe('Query Deduplication Integration', () => {
        it('should deduplicate simultaneous auth queries', async () => {
            const mockQueryFn = vi.fn().mockResolvedValue({ id: 1, email: 'test@example.com' });
            // Start multiple queries simultaneously
            const promise1 = authQueryDeduplicator.executeQuery(mockQueryFn);
            const promise2 = authQueryDeduplicator.executeQuery(mockQueryFn);
            const promise3 = authQueryDeduplicator.executeQuery(mockQueryFn);
            // All promises should resolve to the same result (deduplication)
            const [result1, result2, result3] = await Promise.all([promise1, promise2, promise3]);
            expect(result1).toEqual(result2);
            expect(result2).toEqual(result3);
            // Query function should only be called once
            expect(mockQueryFn).toHaveBeenCalledTimes(1);
        });
        it('should cache results for minimum interval', async () => {
            const mockQueryFn = vi.fn().mockResolvedValue({ id: 1, email: 'test@example.com' });
            // First query
            await authQueryDeduplicator.executeQuery(mockQueryFn);
            expect(mockQueryFn).toHaveBeenCalledTimes(1);
            // Second query within minimum interval should return cached result
            vi.advanceTimersByTime(3000); // Less than 5 seconds
            await authQueryDeduplicator.executeQuery(mockQueryFn);
            expect(mockQueryFn).toHaveBeenCalledTimes(1); // Still only called once
            // Third query after minimum interval should make new request
            vi.advanceTimersByTime(3000); // Total 6 seconds, more than 5 seconds
            await authQueryDeduplicator.executeQuery(mockQueryFn);
            expect(mockQueryFn).toHaveBeenCalledTimes(2); // Called twice now
        });
    });
    describe('State Synchronization', () => {
        it('should synchronize state between components', () => {
            const mockUser = { id: 1, email: 'test@example.com' };
            // Record success in AuthStateManager
            authStateManager.recordSuccess(mockUser, 'network');
            // State should be updated
            const state = authStateManager.getState();
            expect(state.isAuthenticated).toBe(true);
            expect(state.user).toEqual(mockUser);
            expect(state.source).toBe('network');
        });
        it('should handle logout properly', () => {
            const mockUser = { id: 1, email: 'test@example.com' };
            // Set authenticated state
            authStateManager.recordSuccess(mockUser, 'network');
            expect(authStateManager.getState().isAuthenticated).toBe(true);
            // Reset (logout)
            authStateManager.reset();
            authQueryDeduplicator.clear();
            // State should be reset
            const state = authStateManager.getState();
            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBe(null);
            // Deduplicator should be cleared
            const deduplicatorState = authQueryDeduplicator.getState();
            expect(deduplicatorState.result).toBe(null);
            expect(deduplicatorState.consecutiveQueries).toBe(0);
        });
    });
    describe('Error Handling Integration', () => {
        it('should handle 401 errors without triggering circuit breaker', () => {
            const unauthorizedError = new Error('401: Unauthorized');
            // Record multiple 401 errors with time advancement
            authStateManager.recordFailure(unauthorizedError);
            vi.advanceTimersByTime(6000); // Advance past minimum interval
            authStateManager.recordFailure(unauthorizedError);
            vi.advanceTimersByTime(6000); // Advance past minimum interval
            authStateManager.recordFailure(unauthorizedError);
            // Circuit breaker should remain closed for 401s
            const status = authStateManager.getCircuitBreakerStatus();
            expect(status.state).toBe('CLOSED');
            expect(status.failures).toBe(0);
            // Advance time past minimum interval to allow requests
            vi.advanceTimersByTime(6000);
            // Should still allow auth requests
            expect(authStateManager.canMakeAuthRequest()).toBe(true);
        });
        it('should handle network errors with circuit breaker', () => {
            const networkError = new Error('Network error');
            // Record network errors to trigger circuit breaker
            authStateManager.recordFailure(networkError);
            authStateManager.recordFailure(networkError);
            authStateManager.recordFailure(networkError);
            // Circuit breaker should be open
            const status = authStateManager.getCircuitBreakerStatus();
            expect(status.state).toBe('OPEN');
            expect(status.failures).toBe(3);
            // Should block auth requests
            expect(authStateManager.canMakeAuthRequest()).toBe(false);
        });
    });
});
