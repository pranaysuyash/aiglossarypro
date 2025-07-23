/**
 * Authentication State Persistence
 * Handles secure token storage, refresh mechanisms, and state recovery
 */

import type { IUser } from '../../../shared/types';
import { firebaseErrorHandler } from './FirebaseErrorHandler';
import { DEFAULT_TIMEOUTS, withTimeout } from './FirebaseTimeoutWrapper';
import { getCurrentUser, getIdToken, refreshIdToken } from './firebase';
import { authQueryDeduplicator } from './authQueryDeduplicator';

// Token storage interface
export interface TokenStorage {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
    userId: string;
    lastRefresh: number;
}

// Persistence configuration
export interface PersistenceConfig {
    tokenRefreshThreshold: number; // Refresh when token expires in X milliseconds
    maxRetryAttempts: number;
    storageKey: string;
    useSecureStorage: boolean;
}

// Auth state recovery result
export interface AuthStateRecovery {
    success: boolean;
    user: IUser | null;
    error?: string;
    recovered: boolean;
}

/**
 * Authentication State Persistence Manager
 */
export class AuthStatePersistence {
    private static instance: AuthStatePersistence;
    private config: PersistenceConfig;
    private refreshTimer: NodeJS.Timeout | null = null;
    private isRefreshing = false;
    private refreshPromise: Promise<string | null> | null = null;

    private constructor() {
        this.config = {
            tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes
            maxRetryAttempts: 3,
            storageKey: 'aiglossary_auth_state',
            useSecureStorage: true,
        };

        this.initializeTokenRefreshScheduler();
        this.setupStorageEventListeners();
    }

    public static getInstance(): AuthStatePersistence {
        if (!AuthStatePersistence.instance) {
            AuthStatePersistence.instance = new AuthStatePersistence();
        }
        return AuthStatePersistence.instance;
    }

    /**
     * Store authentication state securely
     */
    public async storeAuthState(user: IUser, token: string): Promise<void> {
        try {
            const tokenData: TokenStorage = {
                accessToken: token,
                expiresAt: this.getTokenExpiration(token),
                userId: user.id,
                lastRefresh: Date.now(),
            };

            if (this.config.useSecureStorage) {
                await this.storeSecurely(tokenData);
            } else {
                this.storeInSessionStorage(tokenData);
            }

            // Store user data separately
            this.storeUserData(user);

            // Schedule token refresh
            this.scheduleTokenRefresh(tokenData.expiresAt);

            console.log('✅ Auth state stored successfully');
        } catch (error) {
            const authError = await firebaseErrorHandler.handleAuthError(
                error as Error,
                'storeAuthState',
                { userId: user.id }
            );
            throw authError;
        }
    }

    /**
     * Retrieve stored authentication state
     */
    public async retrieveAuthState(): Promise<AuthStateRecovery> {
        try {
            const tokenData = await this.retrieveTokenData();
            const userData = this.retrieveUserData();

            if (!tokenData || !userData) {
                return {
                    success: false,
                    user: null,
                    recovered: false,
                };
            }

            // Check if token is still valid
            if (this.isTokenExpired(tokenData)) {
                console.log('🔄 Token expired, attempting refresh...');
                const refreshResult = await this.refreshTokenIfNeeded(tokenData);

                if (!refreshResult.success) {
                    await this.clearAuthState();
                    return {
                        success: false,
                        user: null,
                        error: 'Token refresh failed',
                        recovered: false,
                    };
                }

                tokenData.accessToken = refreshResult.token!;
                tokenData.expiresAt = this.getTokenExpiration(refreshResult.token!);
                tokenData.lastRefresh = Date.now();

                // Update stored token
                await this.storeSecurely(tokenData);
            }

            return {
                success: true,
                user: userData,
                recovered: true,
            };
        } catch (error) {
            const authError = await firebaseErrorHandler.handleAuthError(
                error as Error,
                'retrieveAuthState'
            );

            return {
                success: false,
                user: null,
                error: authError.userMessage,
                recovered: false,
            };
        }
    }

    /**
     * Clear all stored authentication state
     */
    public async clearAuthState(): Promise<void> {
        try {
            // Clear token storage
            if (this.config.useSecureStorage) {
                await this.clearSecureStorage();
            } else {
                sessionStorage.removeItem(this.config.storageKey);
            }

            // Clear user data
            sessionStorage.removeItem(`${this.config.storageKey}_user`);
            localStorage.removeItem(`${this.config.storageKey}_user`);

            // Clear refresh timer
            if (this.refreshTimer) {
                clearTimeout(this.refreshTimer);
                this.refreshTimer = null;
            }

            // Clear any ongoing refresh
            this.isRefreshing = false;
            this.refreshPromise = null;

            console.log('✅ Auth state cleared successfully');
        } catch (error) {
            console.error('Error clearing auth state:', error);
        }
    }

    /**
     * Refresh token if needed
     */
    public async refreshTokenIfNeeded(tokenData?: TokenStorage): Promise<{
        success: boolean;
        token?: string;
        error?: string;
    }> {
        try {
            // If already refreshing, return the existing promise
            if (this.isRefreshing && this.refreshPromise) {
                const token = await this.refreshPromise;
                return {
                    success: !!token,
                    token: token || undefined,
                    error: token ? undefined : 'Token refresh failed',
                };
            }

            const currentTokenData = tokenData || await this.retrieveTokenData();

            if (!currentTokenData) {
                return {
                    success: false,
                    error: 'No token data available',
                };
            }

            // Check if refresh is needed
            const timeUntilExpiry = currentTokenData.expiresAt - Date.now();
            if (timeUntilExpiry > this.config.tokenRefreshThreshold) {
                return {
                    success: true,
                    token: currentTokenData.accessToken,
                };
            }

            // Start refresh process
            this.isRefreshing = true;
            this.refreshPromise = this.performTokenRefresh();

            const newToken = await this.refreshPromise;

            this.isRefreshing = false;
            this.refreshPromise = null;

            if (newToken) {
                // Update stored token
                currentTokenData.accessToken = newToken;
                currentTokenData.expiresAt = this.getTokenExpiration(newToken);
                currentTokenData.lastRefresh = Date.now();

                await this.storeSecurely(currentTokenData);
                this.scheduleTokenRefresh(currentTokenData.expiresAt);

                // Reset deduplicator to allow immediate auth queries after token refresh
                authQueryDeduplicator.resetConsecutiveQueries();

                return {
                    success: true,
                    token: newToken,
                };
            }

            return {
                success: false,
                error: 'Token refresh failed',
            };
        } catch (error) {
            this.isRefreshing = false;
            this.refreshPromise = null;

            const authError = await firebaseErrorHandler.handleAuthError(
                error as Error,
                'refreshTokenIfNeeded'
            );

            return {
                success: false,
                error: authError.userMessage,
            };
        }
    }

    /**
     * Recover authentication state after network errors
     */
    public async recoverFromNetworkError(): Promise<AuthStateRecovery> {
        try {
            console.log('🔄 Attempting auth state recovery after network error...');

            // First, try to retrieve stored state
            const storedState = await this.retrieveAuthState();

            if (storedState.success && storedState.user) {
                console.log('✅ Auth state recovered from storage');
                return storedState;
            }

            // If stored state is invalid, try to get current Firebase user
            const currentUser = getCurrentUser();
            if (currentUser) {
                console.log('🔄 Attempting to get fresh token from Firebase...');

                const freshToken = await withTimeout(
                    () => getIdToken(),
                    {
                        ...DEFAULT_TIMEOUTS.tokenRefresh,
                        operation: 'recoverFromNetworkError',
                    }
                );

                if (freshToken) {
                    // Create user object from Firebase user
                    const user: IUser = {
                        id: currentUser.uid,
                        uid: currentUser.uid,
                        email: currentUser.email || '',
                        name: currentUser.displayName || currentUser.email || '',
                        displayName: currentUser.displayName || undefined,
                        profileImageUrl: currentUser.photoURL || undefined,
                        createdAt: new Date(),
                    };

                    // Store the recovered state
                    await this.storeAuthState(user, freshToken);
                    
                    // Reset deduplicator to allow immediate auth queries after recovery
                    authQueryDeduplicator.resetConsecutiveQueries();

                    console.log('✅ Auth state recovered from Firebase');
                    return {
                        success: true,
                        user,
                        recovered: true,
                    };
                }
            }

            console.log('❌ Auth state recovery failed');
            return {
                success: false,
                user: null,
                error: 'Unable to recover authentication state',
                recovered: false,
            };
        } catch (error) {
            const authError = await firebaseErrorHandler.handleAuthError(
                error as Error,
                'recoverFromNetworkError'
            );

            return {
                success: false,
                user: null,
                error: authError.userMessage,
                recovered: false,
            };
        }
    }

    /**
     * Check if authentication state survives page refresh
     */
    public async validatePersistence(): Promise<boolean> {
        try {
            const recovery = await this.retrieveAuthState();
            return recovery.success && recovery.user !== null;
        } catch (error) {
            console.error('Persistence validation failed:', error);
            return false;
        }
    }

    // Private methods

    private async storeSecurely(tokenData: TokenStorage): Promise<void> {
        try {
            // Use sessionStorage for now - in production, consider more secure options
            const encryptedData = this.encryptTokenData(tokenData);
            sessionStorage.setItem(this.config.storageKey, encryptedData);
        } catch (error) {
            console.error('Secure storage failed, falling back to session storage:', error);
            this.storeInSessionStorage(tokenData);
        }
    }

    private storeInSessionStorage(tokenData: TokenStorage): void {
        sessionStorage.setItem(this.config.storageKey, JSON.stringify(tokenData));
    }

    private async retrieveTokenData(): Promise<TokenStorage | null> {
        try {
            const stored = sessionStorage.getItem(this.config.storageKey);
            if (!stored) return null;

            if (this.config.useSecureStorage) {
                return this.decryptTokenData(stored);
            } else {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error retrieving token data:', error);
            return null;
        }
    }

    private storeUserData(user: IUser): void {
        // Store user data in both session and local storage for persistence
        const userData = JSON.stringify(user);
        sessionStorage.setItem(`${this.config.storageKey}_user`, userData);
        localStorage.setItem(`${this.config.storageKey}_user`, userData);
    }

    private retrieveUserData(): IUser | null {
        try {
            // Try session storage first, then local storage
            let stored = sessionStorage.getItem(`${this.config.storageKey}_user`);
            if (!stored) {
                stored = localStorage.getItem(`${this.config.storageKey}_user`);
            }

            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error retrieving user data:', error);
            return null;
        }
    }

    private async clearSecureStorage(): Promise<void> {
        sessionStorage.removeItem(this.config.storageKey);
    }

    private encryptTokenData(tokenData: TokenStorage): string {
        // Simple base64 encoding for now - in production, use proper encryption
        return btoa(JSON.stringify(tokenData));
    }

    private decryptTokenData(encryptedData: string): TokenStorage {
        // Simple base64 decoding for now - in production, use proper decryption
        return JSON.parse(atob(encryptedData));
    }

    private getTokenExpiration(token: string): number {
        try {
            // Parse JWT token to get expiration
            const payload = JSON.parse(atob(token.split('.')[1]));
            return (payload.exp || 0) * 1000; // Convert to milliseconds
        } catch (error) {
            // If parsing fails, assume token expires in 1 hour
            return Date.now() + (60 * 60 * 1000);
        }
    }

    private isTokenExpired(tokenData: TokenStorage): boolean {
        const timeUntilExpiry = tokenData.expiresAt - Date.now();
        return timeUntilExpiry <= this.config.tokenRefreshThreshold;
    }

    private async performTokenRefresh(): Promise<string | null> {
        try {
            return await withTimeout(
                () => refreshIdToken(),
                {
                    ...DEFAULT_TIMEOUTS.tokenRefresh,
                    operation: 'performTokenRefresh',
                }
            );
        } catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    }

    private scheduleTokenRefresh(expiresAt: number): void {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        const timeUntilRefresh = expiresAt - Date.now() - this.config.tokenRefreshThreshold;

        if (timeUntilRefresh > 0) {
            this.refreshTimer = setTimeout(() => {
                this.refreshTokenIfNeeded();
            }, timeUntilRefresh);

            console.log(`🕐 Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);
        }
    }

    private initializeTokenRefreshScheduler(): void {
        // Check for existing token and schedule refresh if needed
        this.retrieveTokenData().then(tokenData => {
            if (tokenData && !this.isTokenExpired(tokenData)) {
                this.scheduleTokenRefresh(tokenData.expiresAt);
            }
        });
    }

    private setupStorageEventListeners(): void {
        // Listen for storage events to sync across tabs
        window.addEventListener('storage', (event) => {
            if (event.key === this.config.storageKey && event.newValue === null) {
                // Auth state was cleared in another tab
                this.clearAuthState();
            }
        });

        // Listen for page visibility changes to refresh tokens when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshTokenIfNeeded();
            }
        });
    }
}

// Export singleton instance
export const authStatePersistence = AuthStatePersistence.getInstance();