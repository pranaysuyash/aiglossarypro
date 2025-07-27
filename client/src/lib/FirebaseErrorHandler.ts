/**
 * Firebase Error Handler
 * Handles Firebase authentication errors with retry logic, fallback mechanisms,
 * and network status monitoring
 */

import type { FirebaseError } from 'firebase/app';
import { ErrorManager, ErrorSeverity, ErrorType, type EnhancedError } from '../../../shared/errorManager';

// Firebase-specific error interface
export interface FirebaseAuthError extends EnhancedError {
    firebaseCode: string;
    retryable: boolean;
    retryCount: number;
    maxRetries: number;
    backoffDelay: number;
}

// Network status interface
export interface NetworkStatus {
    online: boolean;
    lastChecked: Date;
    connectionType?: string;
}

// Retry configuration
export interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
}

// Fallback authentication state
export interface FallbackAuthState {
    enabled: boolean;
    reason: string;
    enabledAt: Date;
    lastAttempt?: Date;
}

/**
 * Firebase Error Handler with comprehensive error management
 */
export class FirebaseErrorHandler {
    private static instance: FirebaseErrorHandler;
    private errorManager: ErrorManager;
    private networkStatus: NetworkStatus;
    private fallbackState: FallbackAuthState;
    private retryConfig: RetryConfig;
    private networkListeners: ((online: boolean) => void)[] = [];
    private retryQueues: Map<string, Promise<unknown>> = new Map();

    // Circuit breaker state
    private circuitBreaker = {
        failureCount: 0,
        lastFailureTime: 0,
        state: 'closed' as 'closed' | 'open' | 'half-open',
        threshold: 5,
        timeout: 30000, // 30 seconds
    };

    private constructor() {
        this.errorManager = ErrorManager.getInstance();
        this.networkStatus = {
            online: navigator.onLine,
            lastChecked: new Date(),
        };
        this.fallbackState = {
            enabled: false,
            reason: '',
            enabledAt: new Date(),
        };
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2,
            jitter: true,
        };

        this.initializeNetworkMonitoring();
        this.initializeErrorRecoveryStrategies();
    }

    public static getInstance(): FirebaseErrorHandler {
        if (!FirebaseErrorHandler.instance) {
            FirebaseErrorHandler.instance = new FirebaseErrorHandler();
        }
        return FirebaseErrorHandler.instance;
    }

    /**
     * Handle Firebase authentication errors with retry logic
     */
    public async handleAuthError(
        error: FirebaseError | FirebaseAuthError | Error,
        operation: string,
        context: Record<string, unknown> = {}
    ): Promise<FirebaseAuthError> {
        const firebaseError = this.createFirebaseError(error, operation, context);

        // Check circuit breaker
        if (!this.canExecuteOperation()) {
            firebaseError.userMessage = 'Authentication service is temporarily unavailable. Please try again later.';
            firebaseError.retryable = false;
            return firebaseError;
        }

        // Track error for circuit breaker
        this.recordFailure();

        // Log error for monitoring
        await this.errorManager.handleError(firebaseError);

        return firebaseError;
    }

    /**
     * Determine if an error is retryable
     */
    public shouldRetry(error: FirebaseError | FirebaseAuthError | Error): boolean {
        if (!this.isNetworkAvailable()) {
            return false;
        }

        if (this.isFirebaseError(error)) {
            return this.isRetryableFirebaseError(error.code);
        }

        // Generic error - check if it's network-related
        const message = error.message.toLowerCase();
        return message.includes('network') ||
            message.includes('timeout') ||
            message.includes('connection') ||
            message.includes('fetch');
    }

    /**
     * Retry an operation with exponential backoff
     */
    public async retryOperation<T>(
        operation: () => Promise<T>,
        operationName: string,
        customConfig?: Partial<RetryConfig>
    ): Promise<T> {
        const config = { ...this.retryConfig, ...customConfig };
        const queueKey = `${operationName}-${Date.now()}`;

        // Check if similar operation is already in queue
        if (this.retryQueues.has(operationName)) {
            return this.retryQueues.get(operationName);
        }

        const retryPromise = this.executeWithRetry(operation, operationName, config);
        this.retryQueues.set(operationName, retryPromise);

        try {
            const result = await retryPromise;
            this.retryQueues.delete(operationName);
            this.recordSuccess(); // Reset circuit breaker on success
            return result;
        } catch (error) {
            this.retryQueues.delete(operationName);
            throw error;
        }
    }

    /**
     * Enable fallback authentication mode
     */
    public enableFallbackAuth(reason: string): void {
        this.fallbackState = {
            enabled: true,
            reason,
            enabledAt: new Date(),
        };

        console.warn(`🔄 Fallback authentication enabled: ${reason}`);

        // Notify error manager
        this.errorManager.handleError(
            this.errorManager.createError(
                `Fallback authentication enabled: ${reason}`,
                ErrorType.AUTHENTICATION,
                ErrorSeverity.HIGH,
                { metadata: { fallbackEnabled: true, reason } }
            )
        );
    }

    /**
     * Disable fallback authentication mode
     */
    public disableFallbackAuth(): void {
        if (this.fallbackState.enabled) {
            console.log('✅ Fallback authentication disabled - Firebase service restored');
        }

        this.fallbackState = {
            enabled: false,
            reason: '',
            enabledAt: new Date(),
        };
    }

    /**
     * Check if fallback authentication is enabled
     */
    public isFallbackEnabled(): boolean {
        return this.fallbackState.enabled;
    }

    /**
     * Get fallback authentication state
     */
    public getFallbackState(): FallbackAuthState {
        return { ...this.fallbackState };
    }

    /**
     * Check network availability
     */
    public isNetworkAvailable(): boolean {
        return this.networkStatus.online;
    }

    /**
     * Subscribe to network status changes
     */
    public onNetworkChange(callback: (online: boolean) => void): () => void {
        this.networkListeners.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.networkListeners.indexOf(callback);
            if (index > -1) {
                this.networkListeners.splice(index, 1);
            }
        };
    }

    /**
     * Get current network status
     */
    public getNetworkStatus(): NetworkStatus {
        return { ...this.networkStatus };
    }

    /**
     * Test Firebase connectivity
     */
    public async testFirebaseConnectivity(): Promise<boolean> {
        try {
            // Use a public Firebase JS file that always returns 200
            const response = await fetch('https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js', {
                method: 'HEAD',
                mode: 'no-cors',
            });
            return true;
        } catch (error) {
            // Only treat actual network failures as offline
            if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
                console.warn('Firebase connectivity test failed - network error:', error);
                return false;
            }
            // Other errors (like CORS) don't mean Firebase is down
            console.debug('Firebase connectivity test - non-network error, treating as UP:', error);
            return true;
        }
    }

    // Private methods

    private initializeNetworkMonitoring(): void {
        // Monitor online/offline events
        window.addEventListener('online', this.handleNetworkOnline.bind(this));
        window.addEventListener('offline', this.handleNetworkOffline.bind(this));

        // Periodic connectivity check
        setInterval(() => {
            this.checkNetworkStatus();
        }, 30000); // Check every 30 seconds
    }

    private initializeErrorRecoveryStrategies(): void {
        // Register Firebase-specific recovery strategies
        this.errorManager.registerRecoveryStrategy({
            canRecover: (error) => error.type === ErrorType.AUTHENTICATION && this.shouldRetry(error.originalError || error),
            recover: async (error) => {
                if (this.isFirebaseError(error.originalError)) {
                    // Don't enable fallback auth - let Firebase handle retries
                    // The connectivity check was causing false positives
                    console.debug('Firebase network error, but not enabling fallback auth');
                }
            },
        });
    }

    private createFirebaseError(
        error: FirebaseError | FirebaseAuthError | Error,
        operation: string,
        context: Record<string, unknown>
    ): FirebaseAuthError {
        const isFirebaseErr = this.isFirebaseError(error);
        const firebaseCode = isFirebaseErr ? error.code : 'unknown';

        const baseError = this.errorManager.createError(
            error,
            ErrorType.AUTHENTICATION,
            this.getErrorSeverity(firebaseCode),
            {
                ...context,
                metadata: {
                    ...context.metadata,
                    operation,
                    firebaseCode,
                    networkOnline: this.networkStatus.online,
                },
            },
            this.getUserMessage(firebaseCode)
        );

        const firebaseError: FirebaseAuthError = {
            ...baseError,
            firebaseCode,
            retryable: this.shouldRetry(error),
            retryCount: 0,
            maxRetries: this.retryConfig.maxRetries,
            backoffDelay: this.retryConfig.baseDelay,
        };

        return firebaseError;
    }

    private isFirebaseError(error: Error | unknown): error is FirebaseError {
        return error && typeof error === 'object' && 'code' in error && error.code?.startsWith('auth/');
    }

    private isRetryableFirebaseError(code: string): boolean {
        const retryableCodes = [
            'auth/network-request-failed',
            'auth/timeout',
            'auth/internal-error',
            'auth/service-unavailable',
            'auth/too-many-requests',
            'auth/quota-exceeded',
        ];

        return retryableCodes.includes(code);
    }

    private getErrorSeverity(firebaseCode: string): ErrorSeverity {
        const criticalCodes = ['auth/internal-error', 'auth/service-unavailable'];
        const highCodes = ['auth/network-request-failed', 'auth/timeout'];
        const mediumCodes = ['auth/too-many-requests', 'auth/quota-exceeded'];

        if (criticalCodes.includes(firebaseCode)) {return ErrorSeverity.CRITICAL;}
        if (highCodes.includes(firebaseCode)) {return ErrorSeverity.HIGH;}
        if (mediumCodes.includes(firebaseCode)) {return ErrorSeverity.MEDIUM;}

        return ErrorSeverity.LOW;
    }

    private getUserMessage(firebaseCode: string): string {
        const messages: Record<string, string> = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-disabled': 'This account has been disabled. Please contact support.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection and try again.',
            'auth/timeout': 'Request timed out. Please try again.',
            'auth/service-unavailable': 'Authentication service is temporarily unavailable.',
            'auth/internal-error': 'An internal error occurred. Please try again.',
            'auth/quota-exceeded': 'Service quota exceeded. Please try again later.',
            'auth/invalid-credential': 'Invalid credentials. Please check your login information.',
            'auth/credential-already-in-use': 'This credential is already associated with another account.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
        };

        return messages[firebaseCode] || 'Authentication error occurred. Please try again.';
    }

    private async executeWithRetry<T>(
        operation: () => Promise<T>,
        operationName: string,
        config: RetryConfig
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;

                if (attempt === config.maxRetries || !this.shouldRetry(error as Error)) {
                    break;
                }

                const delay = this.calculateBackoffDelay(attempt, config);
                console.warn(`🔄 Retrying ${operationName} (attempt ${attempt + 1}/${config.maxRetries}) after ${delay}ms:`, error);

                await this.sleep(delay);
            }
        }

        throw lastError!;
    }

    private calculateBackoffDelay(attempt: number, config: RetryConfig): number {
        let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
        delay = Math.min(delay, config.maxDelay);

        if (config.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }

        return Math.floor(delay);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private handleNetworkOnline(): void {
        this.networkStatus = {
            online: true,
            lastChecked: new Date(),
        };

        console.log('🌐 Network connection restored');
        this.notifyNetworkListeners(true);

        // Test Firebase connectivity when network comes back
        // Skip connectivity test - it was causing false positives
        // Just check if we're online
        if (navigator.onLine && this.fallbackState.enabled) {
            this.disableFallbackAuth();
        }
    }

    private handleNetworkOffline(): void {
        this.networkStatus = {
            online: false,
            lastChecked: new Date(),
        };

        console.warn('🌐 Network connection lost');
        this.notifyNetworkListeners(false);
    }

    private async checkNetworkStatus(): Promise<void> {
        const wasOnline = this.networkStatus.online;
        const isOnline = navigator.onLine;

        if (wasOnline !== isOnline) {
            this.networkStatus = {
                online: isOnline,
                lastChecked: new Date(),
            };

            if (isOnline) {
                this.handleNetworkOnline();
            } else {
                this.handleNetworkOffline();
            }
        } else {
            this.networkStatus.lastChecked = new Date();
        }
    }

    private notifyNetworkListeners(online: boolean): void {
        this.networkListeners.forEach(listener => {
            try {
                listener(online);
            } catch (error) {
                console.error('Network listener error:', error);
            }
        });
    }

    // Circuit breaker methods

    private canExecuteOperation(): boolean {
        const now = Date.now();

        switch (this.circuitBreaker.state) {
            case 'closed':
                return true;
            case 'open':
                if (now - this.circuitBreaker.lastFailureTime > this.circuitBreaker.timeout) {
                    this.circuitBreaker.state = 'half-open';
                    return true;
                }
                return false;
            case 'half-open':
                return true;
            default:
                return true;
        }
    }

    private recordFailure(): void {
        this.circuitBreaker.failureCount++;
        this.circuitBreaker.lastFailureTime = Date.now();

        if (this.circuitBreaker.failureCount >= this.circuitBreaker.threshold) {
            this.circuitBreaker.state = 'open';
            console.warn('🔴 Firebase circuit breaker opened due to repeated failures');

            // Don't enable fallback auth - it causes more problems
            // Just log the issue and let Firebase handle retries
            console.warn('Circuit breaker open but not enabling fallback auth');
        }
    }

    private recordSuccess(): void {
        this.circuitBreaker.failureCount = 0;
        this.circuitBreaker.state = 'closed';

        // Disable fallback on successful operation
        if (this.fallbackState.enabled) {
            this.disableFallbackAuth();
        }
    }
}

// Export singleton instance
export const firebaseErrorHandler = FirebaseErrorHandler.getInstance();