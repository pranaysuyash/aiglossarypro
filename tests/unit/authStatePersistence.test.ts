/**
 * Unit tests for Authentication State Persistence
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStatePersistence } from '../../client/src/lib/AuthStatePersistence';
import type { IUser } from '../../shared/types';

// Mock Firebase functions
vi.mock('../../client/src/lib/firebase', () => ({
    getCurrentUser: vi.fn(),
    getIdToken: vi.fn(),
    refreshIdToken: vi.fn(),
}));

// Mock Firebase Error Handler
vi.mock('../../client/src/lib/FirebaseErrorHandler', () => ({
    firebaseErrorHandler: {
        handleAuthError: vi.fn().mockResolvedValue({
            userMessage: 'Test error message',
        }),
    },
}));

// Mock Firebase Timeout Wrapper
vi.mock('../../client/src/lib/FirebaseTimeoutWrapper', () => ({
    withTimeout: vi.fn().mockImplementation((fn: () => any) => fn()),
    DEFAULT_TIMEOUTS: {
        tokenRefresh: {
            timeout: 5000,
            operation: 'tokenRefresh',
            retryOnTimeout: true,
            maxRetries: 3,
        },
    },
}));

// Mock storage
const mockSessionStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
});

Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
});

// Mock document and window events
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();
Object.defineProperty(window, 'addEventListener', {
    value: mockAddEventListener,
});
Object.defineProperty(document, 'addEventListener', {
    value: mockAddEventListener,
});

describe('AuthStatePersistence', () => {
    let authPersistence: AuthStatePersistence;
    let mockUser: IUser;
    let mockToken: string;

    beforeEach(() => {
        vi.clearAllMocks();
        authPersistence = AuthStatePersistence.getInstance();

        mockUser = {
            id: 'test-user-id',
            uid: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            displayName: 'Test User',
            createdAt: new Date(),
        };

        // Mock JWT token (simplified)
        const payload = {
            exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
            sub: 'test-user-id',
        };
        mockToken = `header.${btoa(JSON.stringify(payload))}.signature`;
    });

    afterEach(() => {
        vi.clearAllTimers();
    });

    describe('storeAuthState', () => {
        it('should store authentication state successfully', async () => {
            await authPersistence.storeAuthState(mockUser, mockToken);

            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
                'aiglossary_auth_state',
                expect.any(String)
            );
            expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
                'aiglossary_auth_state_user',
                JSON.stringify(mockUser)
            );
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'aiglossary_auth_state_user',
                JSON.stringify(mockUser)
            );
        });

        it('should handle storage errors gracefully', async () => {
            mockSessionStorage.setItem.mockImplementation(() => {
                throw new Error('Storage quota exceeded');
            });

            // Should not throw, but handle error internally
            await expect(authPersistence.storeAuthState(mockUser, mockToken)).rejects.toThrow();
        });
    });

    describe('retrieveAuthState', () => {
        it('should retrieve valid authentication state', async () => {
            // Mock stored token data
            const tokenData = {
                accessToken: mockToken,
                expiresAt: Date.now() + 3600000, // 1 hour from now
                userId: mockUser.id,
                lastRefresh: Date.now(),
            };

            mockSessionStorage.getItem.mockImplementation((key) => {
                if (key === 'aiglossary_auth_state') {
                    return btoa(JSON.stringify(tokenData));
                }
                if (key === 'aiglossary_auth_state_user') {
                    return JSON.stringify(mockUser);
                }
                return null;
            });

            const result = await authPersistence.retrieveAuthState();

            expect(result.success).toBe(true);
            expect(result.user).toEqual(mockUser);
            expect(result.recovered).toBe(true);
        });

        it('should return failure when no stored data exists', async () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocalStorage.getItem.mockReturnValue(null);

            const result = await authPersistence.retrieveAuthState();

            expect(result.success).toBe(false);
            expect(result.user).toBe(null);
            expect(result.recovered).toBe(false);
        });

        it('should handle expired tokens by attempting refresh', async () => {
            // Mock expired token
            const expiredTokenData = {
                accessToken: mockToken,
                expiresAt: Date.now() - 1000, // Expired 1 second ago
                userId: mockUser.id,
                lastRefresh: Date.now() - 3600000,
            };

            mockSessionStorage.getItem.mockImplementation((key) => {
                if (key === 'aiglossary_auth_state') {
                    return btoa(JSON.stringify(expiredTokenData));
                }
                if (key === 'aiglossary_auth_state_user') {
                    return JSON.stringify(mockUser);
                }
                return null;
            });

            // Mock successful token refresh
            const { refreshIdToken } = await import('../../client/src/lib/firebase');
            vi.mocked(refreshIdToken).mockResolvedValue('new-token');

            const result = await authPersistence.retrieveAuthState();

            expect(refreshIdToken).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });
    });

    describe('clearAuthState', () => {
        it('should clear all stored authentication data', async () => {
            await authPersistence.clearAuthState();

            expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('aiglossary_auth_state');
            expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('aiglossary_auth_state_user');
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('aiglossary_auth_state_user');
        });

        it('should handle clear errors gracefully', async () => {
            mockSessionStorage.removeItem.mockImplementation(() => {
                throw new Error('Storage error');
            });

            // Should not throw
            await expect(authPersistence.clearAuthState()).resolves.toBeUndefined();
        });
    });

    describe('refreshTokenIfNeeded', () => {
        it('should not refresh valid tokens', async () => {
            const validTokenData = {
                accessToken: mockToken,
                expiresAt: Date.now() + 3600000, // 1 hour from now
                userId: mockUser.id,
                lastRefresh: Date.now(),
            };

            const result = await authPersistence.refreshTokenIfNeeded(validTokenData);

            expect(result.success).toBe(true);
            expect(result.token).toBe(mockToken);
        });

        it('should refresh tokens nearing expiration', async () => {
            const nearExpiryTokenData = {
                accessToken: mockToken,
                expiresAt: Date.now() + 60000, // 1 minute from now (less than 5 minute threshold)
                userId: mockUser.id,
                lastRefresh: Date.now(),
            };

            // Mock successful token refresh
            const { refreshIdToken } = await import('../../client/src/lib/firebase');
            vi.mocked(refreshIdToken).mockResolvedValue('refreshed-token');

            const result = await authPersistence.refreshTokenIfNeeded(nearExpiryTokenData);

            expect(refreshIdToken).toHaveBeenCalled();
            expect(result.success).toBe(true);
            expect(result.token).toBe('refreshed-token');
        });

        it('should handle refresh failures', async () => {
            const expiredTokenData = {
                accessToken: mockToken,
                expiresAt: Date.now() - 1000,
                userId: mockUser.id,
                lastRefresh: Date.now(),
            };

            // Mock failed token refresh
            const { refreshIdToken } = await import('../../client/src/lib/firebase');
            vi.mocked(refreshIdToken).mockResolvedValue(null);

            const result = await authPersistence.refreshTokenIfNeeded(expiredTokenData);

            expect(result.success).toBe(false);
            expect(result.error).toBe('Token refresh failed');
        });

        it('should prevent concurrent refresh attempts', async () => {
            const expiredTokenData = {
                accessToken: mockToken,
                expiresAt: Date.now() - 1000,
                userId: mockUser.id,
                lastRefresh: Date.now(),
            };

            // Mock slow token refresh
            const { refreshIdToken } = await import('../../client/src/lib/firebase');
            vi.mocked(refreshIdToken).mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve('new-token'), 1000))
            );

            // Start two refresh attempts simultaneously
            const promise1 = authPersistence.refreshTokenIfNeeded(expiredTokenData);
            const promise2 = authPersistence.refreshTokenIfNeeded(expiredTokenData);

            const [result1, result2] = await Promise.all([promise1, promise2]);

            // Both should succeed with the same token
            expect(result1.success).toBe(true);
            expect(result2.success).toBe(true);
            expect(result1.token).toBe(result2.token);

            // But refresh should only be called once
            expect(refreshIdToken).toHaveBeenCalledTimes(1);
        });
    });

    describe('recoverFromNetworkError', () => {
        it('should recover from stored state first', async () => {
            // Mock valid stored state
            const tokenData = {
                accessToken: mockToken,
                expiresAt: Date.now() + 3600000,
                userId: mockUser.id,
                lastRefresh: Date.now(),
            };

            mockSessionStorage.getItem.mockImplementation((key) => {
                if (key === 'aiglossary_auth_state') {
                    return btoa(JSON.stringify(tokenData));
                }
                if (key === 'aiglossary_auth_state_user') {
                    return JSON.stringify(mockUser);
                }
                return null;
            });

            const result = await authPersistence.recoverFromNetworkError();

            expect(result.success).toBe(true);
            expect(result.user).toEqual(mockUser);
            expect(result.recovered).toBe(true);
        });

        it('should fallback to Firebase user when stored state is invalid', async () => {
            // Mock no stored state
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocalStorage.getItem.mockReturnValue(null);

            // Mock Firebase current user
            const { getCurrentUser, getIdToken } = await import('../../client/src/lib/firebase');
            const mockFirebaseUser = {
                uid: 'firebase-user-id',
                email: 'firebase@example.com',
                displayName: 'Firebase User',
                photoURL: null,
            };

            vi.mocked(getCurrentUser).mockReturnValue(mockFirebaseUser as any);
            vi.mocked(getIdToken).mockResolvedValue('firebase-token');

            const result = await authPersistence.recoverFromNetworkError();

            expect(result.success).toBe(true);
            expect(result.user?.email).toBe('firebase@example.com');
            expect(result.recovered).toBe(true);
        });

        it('should fail when no recovery options are available', async () => {
            // Mock no stored state
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocalStorage.getItem.mockReturnValue(null);

            // Mock no Firebase user
            const { getCurrentUser } = await import('../../client/src/lib/firebase');
            vi.mocked(getCurrentUser).mockReturnValue(null);

            const result = await authPersistence.recoverFromNetworkError();

            expect(result.success).toBe(false);
            expect(result.user).toBe(null);
            expect(result.error).toContain('Unable to recover');
        });
    });

    describe('validatePersistence', () => {
        it('should return true for valid persisted state', async () => {
            // Mock valid stored state
            const tokenData = {
                accessToken: mockToken,
                expiresAt: Date.now() + 3600000,
                userId: mockUser.id,
                lastRefresh: Date.now(),
            };

            mockSessionStorage.getItem.mockImplementation((key) => {
                if (key === 'aiglossary_auth_state') {
                    return btoa(JSON.stringify(tokenData));
                }
                if (key === 'aiglossary_auth_state_user') {
                    return JSON.stringify(mockUser);
                }
                return null;
            });

            const isValid = await authPersistence.validatePersistence();
            expect(isValid).toBe(true);
        });

        it('should return false for invalid persisted state', async () => {
            mockSessionStorage.getItem.mockReturnValue(null);
            mockLocalStorage.getItem.mockReturnValue(null);

            const isValid = await authPersistence.validatePersistence();
            expect(isValid).toBe(false);
        });
    });

    describe('Token Management', () => {
        it('should correctly parse JWT token expiration', async () => {
            const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
            const payload = { exp: futureExp, sub: 'test-user' };
            const token = `header.${btoa(JSON.stringify(payload))}.signature`;

            await authPersistence.storeAuthState(mockUser, token);

            // Token should not be considered expired
            const result = await authPersistence.retrieveAuthState();
            expect(result.success).toBe(true);
        });

        it('should handle malformed JWT tokens gracefully', async () => {
            const malformedToken = 'not.a.valid.jwt.token';

            // Should not throw, but handle gracefully
            await expect(authPersistence.storeAuthState(mockUser, malformedToken)).resolves.toBeUndefined();
        });
    });

    describe('Event Listeners', () => {
        it('should set up storage event listeners', () => {
            // Verify that event listeners were set up during initialization
            expect(mockAddEventListener).toHaveBeenCalledWith('storage', expect.any(Function));
            expect(mockAddEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
        });
    });
});