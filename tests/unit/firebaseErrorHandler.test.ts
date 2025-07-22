/**
 * Unit tests for Firebase Error Handler
 */

import type { FirebaseError } from 'firebase/app';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FirebaseErrorHandler, type FirebaseAuthError } from '../../client/src/lib/FirebaseErrorHandler';
import { ErrorSeverity, ErrorType } from '../../shared/errorManager';

// Mock Firebase
vi.mock('firebase/app');
vi.mock('firebase/auth');

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
});

// Mock window events
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(window, 'addEventListener', {
    value: mockAddEventListener,
});
Object.defineProperty(window, 'removeEventListener', {
    value: mockRemoveEventListener,
});

describe('FirebaseErrorHandler', () => {
    let errorHandler: FirebaseErrorHandler;

    beforeEach(() => {
        vi.clearAllMocks();
        errorHandler = FirebaseErrorHandler.getInstance();
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    describe('Error Categorization', () => {
        it('should identify retryable Firebase errors', () => {
            const retryableError: FirebaseError = {
                name: 'FirebaseError',
                message: 'Network request failed',
                code: 'auth/network-request-failed',
            };

            expect(errorHandler.shouldRetry(retryableError)).toBe(true);
        });

        it('should identify non-retryable Firebase errors', () => {
            const nonRetryableError: FirebaseError = {
                name: 'FirebaseError',
                message: 'User not found',
                code: 'auth/user-not-found',
            };

            expect(errorHandler.shouldRetry(nonRetryableError)).toBe(false);
        });

        it('should handle generic network errors as retryable', () => {
            const networkError = new Error('Network connection failed');
            expect(errorHandler.shouldRetry(networkError)).toBe(true);
        });

        it('should handle non-network errors as non-retryable', () => {
            const genericError = new Error('Some other error');
            expect(errorHandler.shouldRetry(genericError)).toBe(false);
        });
    });

    describe('Error Handling', () => {
        it('should create Firebase error with correct properties', async () => {
            const originalError: FirebaseError = {
                name: 'FirebaseError',
                message: 'Network request failed',
                code: 'auth/network-request-failed',
            };

            const firebaseError: FirebaseAuthError = await errorHandler.handleAuthError(
                originalError,
                'signIn',
                { email: 'test@example.com' }
            );

            expect(firebaseError.firebaseCode).toBe('auth/network-request-failed');
            expect(firebaseError.type).toBe(ErrorType.AUTHENTICATION);
            expect(firebaseError.retryable).toBe(true);
            expect(firebaseError.userMessage).toContain('Network error');
        });

        it('should handle timeout errors', async () => {
            const timeoutError = new Error('Operation timed out');

            const firebaseError: FirebaseAuthError = await errorHandler.handleAuthError(
                timeoutError,
                'signIn'
            );

            expect(firebaseError.type).toBe(ErrorType.AUTHENTICATION);
            expect(firebaseError.severity).toBe(ErrorSeverity.MEDIUM);
        });

        it('should set appropriate severity levels', async () => {
            const criticalError: FirebaseError = {
                name: 'FirebaseError',
                message: 'Internal error',
                code: 'auth/internal-error',
            };

            const firebaseError: FirebaseAuthError = await errorHandler.handleAuthError(
                criticalError,
                'signIn'
            );

            expect(firebaseError.severity).toBe(ErrorSeverity.CRITICAL);
        });
    });

    describe('Retry Logic', () => {
        it('should retry operations with exponential backoff', async () => {
            let attemptCount = 0;
            const mockOperation = vi.fn().mockImplementation(() => {
                attemptCount++;
                if (attemptCount < 3) {
                    throw new Error('Network error');
                }
                return Promise.resolve('success');
            });

            const result = await errorHandler.retryOperation(
                mockOperation,
                'testOperation',
                { maxRetries: 3, baseDelay: 100 }
            );

            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(3);
        });

        it('should fail after max retries', async () => {
            const mockOperation = vi.fn().mockRejectedValue(new Error('Persistent error'));

            await expect(
                errorHandler.retryOperation(
                    mockOperation,
                    'testOperation',
                    { maxRetries: 2, baseDelay: 100 }
                )
            ).rejects.toThrow('Persistent error');

            expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
        });

        it('should not retry non-retryable errors', async () => {
            const nonRetryableError: FirebaseError = {
                name: 'FirebaseError',
                message: 'User not found',
                code: 'auth/user-not-found',
            };

            const mockOperation = vi.fn().mockRejectedValue(nonRetryableError);

            await expect(
                errorHandler.retryOperation(mockOperation, 'testOperation')
            ).rejects.toThrow('User not found');

            expect(mockOperation).toHaveBeenCalledTimes(1); // No retries
        });
    });

    describe('Network Status Monitoring', () => {
        it('should detect network availability', () => {
            expect(errorHandler.isNetworkAvailable()).toBe(true);
        });

        it('should handle network offline state', () => {
            Object.defineProperty(navigator, 'onLine', {
                value: false,
            });

            // Simulate offline event
            const offlineEvent = new Event('offline');
            window.dispatchEvent(offlineEvent);

            expect(errorHandler.isNetworkAvailable()).toBe(false);
        });

        it('should notify network change listeners', () => {
            const mockListener = vi.fn();
            const unsubscribe = errorHandler.onNetworkChange(mockListener);

            // Simulate network change
            const onlineEvent = new Event('online');
            window.dispatchEvent(onlineEvent);

            expect(mockListener).toHaveBeenCalledWith(true);

            unsubscribe();
        });

        it('should not retry when network is offline', () => {
            Object.defineProperty(navigator, 'onLine', {
                value: false,
            });

            const networkError: FirebaseError = {
                name: 'FirebaseError',
                message: 'Network request failed',
                code: 'auth/network-request-failed',
            };

            expect(errorHandler.shouldRetry(networkError)).toBe(false);
        });
    });

    describe('Fallback Authentication', () => {
        it('should enable fallback authentication', () => {
            errorHandler.enableFallbackAuth('Firebase service unavailable');

            expect(errorHandler.isFallbackEnabled()).toBe(true);

            const fallbackState = errorHandler.getFallbackState();
            expect(fallbackState.enabled).toBe(true);
            expect(fallbackState.reason).toBe('Firebase service unavailable');
        });

        it('should disable fallback authentication', () => {
            errorHandler.enableFallbackAuth('Test reason');
            errorHandler.disableFallbackAuth();

            expect(errorHandler.isFallbackEnabled()).toBe(false);
        });

        it('should provide fallback state information', () => {
            const reason = 'Circuit breaker opened';
            errorHandler.enableFallbackAuth(reason);

            const state = errorHandler.getFallbackState();
            expect(state.enabled).toBe(true);
            expect(state.reason).toBe(reason);
            expect(state.enabledAt).toBeInstanceOf(Date);
        });
    });

    describe('Circuit Breaker', () => {
        it('should open circuit breaker after repeated failures', async () => {
            // Simulate multiple failures
            for (let i = 0; i < 6; i++) {
                await errorHandler.handleAuthError(
                    new Error('Test error'),
                    'testOperation'
                );
            }

            // Circuit breaker should be open, making operations non-retryable
            const error: FirebaseAuthError = await errorHandler.handleAuthError(
                new Error('Another error'),
                'testOperation'
            );

            expect(error.retryable).toBe(false);
            expect(error.userMessage).toContain('temporarily unavailable');
        });
    });

    describe('Firebase Connectivity Testing', () => {
        it('should test Firebase connectivity', async () => {
            // Mock successful fetch
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
            });

            const isConnected = await errorHandler.testFirebaseConnectivity();
            expect(isConnected).toBe(true);
        });

        it('should handle connectivity test failure', async () => {
            // Mock failed fetch
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const isConnected = await errorHandler.testFirebaseConnectivity();
            expect(isConnected).toBe(false);
        });
    });

    describe('User Messages', () => {
        it('should provide user-friendly error messages', async () => {
            const testCases = [
                {
                    code: 'auth/user-not-found',
                    expectedMessage: 'No account found with this email address.',
                },
                {
                    code: 'auth/wrong-password',
                    expectedMessage: 'Incorrect password. Please try again.',
                },
                {
                    code: 'auth/invalid-email',
                    expectedMessage: 'Please enter a valid email address.',
                },
                {
                    code: 'auth/too-many-requests',
                    expectedMessage: 'Too many failed attempts. Please try again later.',
                },
            ];

            for (const testCase of testCases) {
                const firebaseError: FirebaseError = {
                    name: 'FirebaseError',
                    message: 'Firebase error',
                    code: testCase.code,
                };

                const error: FirebaseAuthError = await errorHandler.handleAuthError(
                    firebaseError,
                    'testOperation'
                );

                expect(error.userMessage).toBe(testCase.expectedMessage);
            }
        });

        it('should provide default message for unknown errors', async () => {
            const unknownError: FirebaseError = {
                name: 'FirebaseError',
                message: 'Unknown error',
                code: 'auth/unknown-error',
            };

            const error: FirebaseAuthError = await errorHandler.handleAuthError(
                unknownError,
                'testOperation'
            );

            expect(error.userMessage).toBe('Authentication error occurred. Please try again.');
        });
    });
});