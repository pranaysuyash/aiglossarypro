/**
 * Unit tests for AuthStateManager
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStateManager } from '../../client/src/lib/AuthStateManager';
import type { IUser } from '../../shared/types';

// Mock user data
const mockUser: IUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    subscriptionTier: 'free',
    createdAt: new Date(),
};

describe('AuthStateManager', () => {
    let authStateManager: AuthStateManager;

    beforeEach(() => {
        // Reset singleton instance
        (AuthStateManager as unknown).instance = undefined;
        authStateManager = AuthStateManager.getInstance();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance', () => {
            const instance1 = AuthStateManager.getInstance();
            const instance2 = AuthStateManager.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('Initial State', () => {
        it('should have correct initial state', () => {
            const state = authStateManager.getState();
            expect(state).toEqual({
                isAuthenticated: false,
                user: null,
                isLoading: false,
                error: null,
                lastCheck: 0,
                source: 'initial'
            });
        });

        it('should have circuit breaker in CLOSED state', () => {
            const status = authStateManager.getCircuitBreakerStatus();
            expect(status.state).toBe('CLOSED');
            expect(status.failures).toBe(0);
        });
    });

    describe('Circuit Breaker Pattern', () => {
        it('should allow auth requests when circuit is CLOSED', () => {
            expect(authStateManager.canMakeAuthRequest()).toBe(true);
        });

        it('should prevent requests too soon after last check', () => {
            // Record a successful auth check
            authStateManager.recordSuccess(mockUser);

            // Advance time by less than MIN_CHECK_INTERVAL (5 seconds)
            vi.advanceTimersByTime(3000);

            expect(authStateManager.canMakeAuthRequest()).toBe(false);
        });

        it('should allow requests after MIN_CHECK_INTERVAL', () => {
            // Record a successful auth check
            authStateManager.recordSuccess(mockUser);

            // Advance time by more than MIN_CHECK_INTERVAL (5 seconds)
            vi.advanceTimersByTime(6000);

            expect(authStateManager.canMakeAuthRequest()).toBe(true);
        });

        it('should open circuit after failure threshold', () => {
            const error = new Error('Network error');

            // Record failures up to threshold (3)
            authStateManager.recordFailure(error);
            authStateManager.recordFailure(error);
            authStateManager.recordFailure(error);

            const status = authStateManager.getCircuitBreakerStatus();
            expect(status.state).toBe('OPEN');
            expect(authStateManager.canMakeAuthRequest()).toBe(false);
        });

        it('should not count 401 errors as failures', () => {
            const unauthorizedError = new Error('401: Unauthorized');

            // Record multiple 401 errors
            authStateManager.recordFailure(unauthorizedError);
            authStateManager.recordFailure(unauthorizedError);
            authStateManager.recordFailure(unauthorizedError);

            const status = authStateManager.getCircuitBreakerStatus();
            expect(status.state).toBe('CLOSED');
            expect(status.failures).toBe(0);
        });

        it('should transition to HALF_OPEN after timeout', () => {
            const error = new Error('Network error');

            // Open the circuit
            authStateManager.recordFailure(error);
            authStateManager.recordFailure(error);
            authStateManager.recordFailure(error);

            expect(authStateManager.canMakeAuthRequest()).toBe(false);

            // Advance time past reset timeout (30 seconds)
            vi.advanceTimersByTime(31000);

            expect(authStateManager.canMakeAuthRequest()).toBe(true);

            const status = authStateManager.getCircuitBreakerStatus();
            expect(status.state).toBe('HALF_OPEN');
        });

        it('should close circuit on successful request after HALF_OPEN', () => {
            const error = new Error('Network error');

            // Open the circuit
            authStateManager.recordFailure(error);
            authStateManager.recordFailure(error);
            authStateManager.recordFailure(error);

            // Wait for timeout
            vi.advanceTimersByTime(31000);

            // Record success (should close circuit)
            authStateManager.recordSuccess(mockUser);

            const status = authStateManager.getCircuitBreakerStatus();
            expect(status.state).toBe('CLOSED');
            expect(status.failures).toBe(0);
        });
    });

    describe('State Management', () => {
        it('should update state on successful auth', () => {
            authStateManager.recordSuccess(mockUser, 'network');

            const state = authStateManager.getState();
            expect(state.isAuthenticated).toBe(true);
            expect(state.user).toEqual(mockUser);
            expect(state.isLoading).toBe(false);
            expect(state.error).toBe(null);
            expect(state.source).toBe('network');
            expect(state.lastCheck).toBeGreaterThan(0);
        });

        it('should update state on auth failure', () => {
            const error = new Error('Network error');
            authStateManager.recordFailure(error);

            const state = authStateManager.getState();
            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBe(null);
            expect(state.isLoading).toBe(false);
            expect(state.error).toEqual(error);
            expect(state.source).toBe('network');
        });

        it('should set loading state', () => {
            authStateManager.setLoading();

            const state = authStateManager.getState();
            expect(state.isLoading).toBe(true);
        });

        it('should not update loading state if already loading', () => {
            const mockListener = vi.fn();
            authStateManager.subscribe(mockListener);

            // Clear initial call
            mockListener.mockClear();

            authStateManager.setLoading();
            authStateManager.setLoading(); // Second call should not trigger update

            // Advance timers to trigger debounced notification
            vi.advanceTimersByTime(200);

            // Should only be called once
            expect(mockListener).toHaveBeenCalledTimes(1);
        });

        it('should reset state on reset', () => {
            // Set some state
            authStateManager.recordSuccess(mockUser);
            authStateManager.setLoading();

            // Reset
            authStateManager.reset();

            const state = authStateManager.getState();
            expect(state.isAuthenticated).toBe(false);
            expect(state.user).toBe(null);
            expect(state.isLoading).toBe(false);
            expect(state.error).toBe(null);
            expect(state.lastCheck).toBe(0);
            expect(state.source).toBe('initial');
        });
    });

    describe('State Updates from Cache/Storage', () => {
        it('should update from cache', () => {
            authStateManager.updateFromCache(mockUser);

            const state = authStateManager.getState();
            expect(state.user).toEqual(mockUser);
            expect(state.isAuthenticated).toBe(true);
            expect(state.source).toBe('cache');
        });

        it('should update from storage', () => {
            authStateManager.updateFromStorage(mockUser);

            const state = authStateManager.getState();
            expect(state.user).toEqual(mockUser);
            expect(state.isAuthenticated).toBe(true);
            expect(state.source).toBe('storage');
        });

        it('should not update if user is the same', () => {
            const mockListener = vi.fn();
            authStateManager.subscribe(mockListener);

            // Set initial user
            authStateManager.updateFromCache(mockUser);
            mockListener.mockClear();

            // Try to update with same user
            authStateManager.updateFromCache(mockUser);

            // Should not trigger listener
            expect(mockListener).not.toHaveBeenCalled();
        });
    });

    describe('Subscription System', () => {
        it('should notify listeners on state change', () => {
            const mockListener = vi.fn();
            authStateManager.subscribe(mockListener);

            // Clear initial call
            mockListener.mockClear();

            authStateManager.recordSuccess(mockUser);

            // Advance timers to trigger debounced notification
            vi.advanceTimersByTime(200);

            expect(mockListener).toHaveBeenCalledWith(
                expect.objectContaining({
                    isAuthenticated: true,
                    user: mockUser
                })
            );
        });

        it('should immediately notify new subscribers with current state', () => {
            // Set some state first
            authStateManager.recordSuccess(mockUser);

            const mockListener = vi.fn();
            authStateManager.subscribe(mockListener);

            expect(mockListener).toHaveBeenCalledWith(
                expect.objectContaining({
                    isAuthenticated: true,
                    user: mockUser
                })
            );
        });

        it('should unsubscribe listeners', () => {
            const mockListener = vi.fn();
            const unsubscribe = authStateManager.subscribe(mockListener);

            // Clear initial call
            mockListener.mockClear();

            // Unsubscribe
            unsubscribe();

            // Change state
            authStateManager.recordSuccess(mockUser);
            vi.advanceTimersByTime(200);

            // Should not be called
            expect(mockListener).not.toHaveBeenCalled();
        });

        it('should handle listener errors gracefully', () => {
            // Spy on console.error to suppress error output during test
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const errorListener = vi.fn(() => {
                throw new Error('Listener error');
            });
            const normalListener = vi.fn();

            // Subscribe listeners - error will be thrown during initial notification
            try {
                authStateManager.subscribe(errorListener);
            } catch (e) {
                // Expected error during initial notification
            }
            authStateManager.subscribe(normalListener);

            // Clear initial calls
            errorListener.mockClear();
            normalListener.mockClear();

            // Change state - this should trigger both listeners
            authStateManager.recordSuccess(mockUser);
            vi.advanceTimersByTime(200);

            // Normal listener should still be called despite error in other listener
            expect(normalListener).toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error in auth state listener:', expect.any(Error));

            // Restore console.error
            consoleErrorSpy.mockRestore();
        });
    });

    describe('Debounced Notifications', () => {
        it('should debounce rapid state changes', () => {
            const mockListener = vi.fn();
            authStateManager.subscribe(mockListener);

            // Clear initial call
            mockListener.mockClear();

            // Make rapid state changes
            authStateManager.setLoading();
            authStateManager.recordSuccess(mockUser);
            authStateManager.setLoading();

            // Should not be called yet
            expect(mockListener).not.toHaveBeenCalled();

            // Advance timers to trigger debounced notification
            vi.advanceTimersByTime(200);

            // Should only be called once with final state
            expect(mockListener).toHaveBeenCalledTimes(1);
        });

        it('should flush pending changes', () => {
            const mockListener = vi.fn();
            authStateManager.subscribe(mockListener);

            // Clear initial call
            mockListener.mockClear();

            authStateManager.recordSuccess(mockUser);

            // Flush immediately
            authStateManager.flushChanges();

            expect(mockListener).toHaveBeenCalledWith(
                expect.objectContaining({
                    isAuthenticated: true,
                    user: mockUser
                })
            );
        });

        it('should cancel pending changes', () => {
            const mockListener = vi.fn();
            authStateManager.subscribe(mockListener);

            // Clear initial call
            mockListener.mockClear();

            authStateManager.recordSuccess(mockUser);

            // Cancel before debounce triggers
            authStateManager.cancelChanges();

            // Advance timers
            vi.advanceTimersByTime(200);

            // Should not be called
            expect(mockListener).not.toHaveBeenCalled();
        });
    });
});