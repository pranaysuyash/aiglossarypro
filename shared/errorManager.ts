import type { ErrorInfo } from 'react';

// Error types for categorization
export enum ErrorType {
    AUTHENTICATION = 'authentication',
    AUTHORIZATION = 'authorization',
    VALIDATION = 'validation',
    DATABASE = 'database',
    NETWORK = 'network',
    API = 'api',
    BUSINESS_LOGIC = 'business_logic',
    SYSTEM = 'system',
    UNKNOWN = 'unknown',
}

// Error severity levels
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

// Error context interface
export interface ErrorContext {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    userAgent?: string;
    url?: string;
    method?: string;
    timestamp?: Date;
    metadata?: Record<string, unknown>;
}

// Enhanced error interface
export interface EnhancedError extends Error {
    type: ErrorType;
    severity: ErrorSeverity;
    context: ErrorContext;
    userMessage: string;
    code?: string;
    retryable?: boolean;
    originalError?: Error;
}

// Error handler function type
export type ErrorHandler = (error: EnhancedError) => void | Promise<void>;

// Error recovery strategy
export interface ErrorRecoveryStrategy {
    canRecover: (error: EnhancedError) => boolean;
    recover: (error: EnhancedError) => Promise<void>;
}

/**
 * Centralized Error Manager for handling all application errors
 */
export class ErrorManager {
    private static instance: ErrorManager;
    private errorHandlers: Map<ErrorType, ErrorHandler[]> = new Map();
    private recoveryStrategies: ErrorRecoveryStrategy[] = [];
    private errorCounts: Map<string, number> = new Map();
    private isInitialized = false;

    private constructor() {
        this.initializeDefaultHandlers();
    }

    public static getInstance(): ErrorManager {
        if (!ErrorManager.instance) {
            ErrorManager.instance = new ErrorManager();
        }
        return ErrorManager.instance;
    }

    /**
     * Initialize the error manager with default configurations
     */
    public initialize(): void {
        if (this.isInitialized) {return;}

        // Set up global error handlers
        if (typeof window !== 'undefined') {
            // Client-side error handling
            window.addEventListener('error', this.handleGlobalError.bind(this));
            window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        } else {
            // Server-side error handling
            process.on('uncaughtException', this.handleUncaughtException.bind(this));
            process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
        }

        this.isInitialized = true;
    }

    /**
     * Create an enhanced error from a regular error
     */
    public createError(
        error: Error | string,
        type: ErrorType = ErrorType.UNKNOWN,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        context: Partial<ErrorContext> = {},
        userMessage?: string
    ): EnhancedError {
        const baseError = typeof error === 'string' ? new Error(error) : error;

        const enhancedError: EnhancedError = {
            ...baseError,
            name: baseError.name || 'Error',
            message: baseError.message,
            stack: baseError.stack,
            type,
            severity,
            context: {
                timestamp: new Date(),
                ...context,
            },
            userMessage: userMessage || this.generateUserMessage(type, baseError.message),
            originalError: typeof error === 'string' ? undefined : error,
        };

        return enhancedError;
    }

    /**
     * Handle an error through the centralized system
     */
    public async handleError(
        error: Error | EnhancedError,
        type?: ErrorType,
        severity?: ErrorSeverity,
        context?: Partial<ErrorContext>
    ): Promise<void> {
        let enhancedError: EnhancedError;

        if (this.isEnhancedError(error)) {
            enhancedError = error;
        } else {
            enhancedError = this.createError(
                error,
                type || ErrorType.UNKNOWN,
                severity || ErrorSeverity.MEDIUM,
                context
            );
        }

        // Track error frequency
        this.trackErrorFrequency(enhancedError);

        // Try recovery strategies first
        const recovered = await this.attemptRecovery(enhancedError);
        if (recovered) {
            return;
        }

        // Execute registered handlers
        await this.executeHandlers(enhancedError);
    }

    /**
     * Register an error handler for a specific error type
     */
    public registerHandler(type: ErrorType, handler: ErrorHandler): void {
        if (!this.errorHandlers.has(type)) {
            this.errorHandlers.set(type, []);
        }
        this.errorHandlers.get(type)!.push(handler);
    }

    /**
     * Register a recovery strategy
     */
    public registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void {
        this.recoveryStrategies.push(strategy);
    }

    /**
     * Get error statistics
     */
    public getErrorStats(): Record<string, number> {
        return Object.fromEntries(this.errorCounts);
    }

    /**
     * Clear error statistics
     */
    public clearErrorStats(): void {
        this.errorCounts.clear();
    }

    // Private methods

    private initializeDefaultHandlers(): void {
        // Console logging handler
        this.registerHandler(ErrorType.UNKNOWN, (error) => {
            console.error('Unhandled error:', error);
        });

        // Critical error handler
        this.registerHandler(ErrorType.SYSTEM, (error) => {
            if (error.severity === ErrorSeverity.CRITICAL) {
                console.error('CRITICAL SYSTEM ERROR:', error);
                // In a real application, this might trigger alerts
            }
        });
    }

    private isEnhancedError(error: Error | unknown): error is EnhancedError {
        return error && typeof error === 'object' && 'type' in error && 'severity' in error;
    }

    private generateUserMessage(type: ErrorType, originalMessage: string): string {
        const userMessages: Record<ErrorType, string> = {
            [ErrorType.AUTHENTICATION]: 'Please check your login credentials and try again.',
            [ErrorType.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
            [ErrorType.VALIDATION]: 'Please check your input and try again.',
            [ErrorType.DATABASE]: 'We\'re experiencing technical difficulties. Please try again later.',
            [ErrorType.NETWORK]: 'Network connection error. Please check your internet connection.',
            [ErrorType.API]: 'Service temporarily unavailable. Please try again later.',
            [ErrorType.BUSINESS_LOGIC]: 'Unable to complete the requested operation.',
            [ErrorType.SYSTEM]: 'System error occurred. Our team has been notified.',
            [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.',
        };

        return userMessages[type] || userMessages[ErrorType.UNKNOWN];
    }

    private trackErrorFrequency(error: EnhancedError): void {
        const key = `${error.type}:${error.name}`;
        const current = this.errorCounts.get(key) || 0;
        this.errorCounts.set(key, current + 1);
    }

    private async attemptRecovery(error: EnhancedError): Promise<boolean> {
        for (const strategy of this.recoveryStrategies) {
            if (strategy.canRecover(error)) {
                try {
                    await strategy.recover(error);
                    return true;
                } catch (recoveryError) {
                    console.warn('Recovery strategy failed:', recoveryError);
                }
            }
        }
        return false;
    }

    private async executeHandlers(error: EnhancedError): Promise<void> {
        const handlers = this.errorHandlers.get(error.type) || [];
        const globalHandlers = this.errorHandlers.get(ErrorType.UNKNOWN) || [];

        const allHandlers = [...handlers, ...globalHandlers];

        for (const handler of allHandlers) {
            try {
                await handler(error);
            } catch (handlerError) {
                console.error('Error handler failed:', handlerError);
            }
        }
    }

    // Global error handlers

    private handleGlobalError(event: ErrorEvent): void {
        const error = this.createError(
            event.error || new Error(event.message),
            ErrorType.SYSTEM,
            ErrorSeverity.HIGH,
            {
                url: event.filename,
                metadata: {
                    lineno: event.lineno,
                    colno: event.colno,
                },
            }
        );

        this.handleError(error);
    }

    private handleUnhandledRejection(event: PromiseRejectionEvent | any): void {
        const error = this.createError(
            event.reason || new Error('Unhandled promise rejection'),
            ErrorType.SYSTEM,
            ErrorSeverity.HIGH,
            {
                metadata: {
                    type: 'unhandled_rejection',
                },
            }
        );

        this.handleError(error);
    }

    private handleUncaughtException(error: Error): void {
        const enhancedError = this.createError(
            error,
            ErrorType.SYSTEM,
            ErrorSeverity.CRITICAL,
            {
                metadata: {
                    type: 'uncaught_exception',
                },
            }
        );

        this.handleError(enhancedError);
    }
}

// Convenience functions for common error scenarios

export const createAuthError = (message: string, context?: Partial<ErrorContext>): EnhancedError => {
    return ErrorManager.getInstance().createError(
        new Error(message),
        ErrorType.AUTHENTICATION,
        ErrorSeverity.MEDIUM,
        context,
        'Authentication failed. Please check your credentials.'
    );
};

export const createValidationError = (message: string, context?: Partial<ErrorContext>): EnhancedError => {
    return ErrorManager.getInstance().createError(
        new Error(message),
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        context,
        'Please check your input and try again.'
    );
};

export const createDatabaseError = (message: string, context?: Partial<ErrorContext>): EnhancedError => {
    return ErrorManager.getInstance().createError(
        new Error(message),
        ErrorType.DATABASE,
        ErrorSeverity.HIGH,
        context,
        'Database operation failed. Please try again later.'
    );
};

export const createNetworkError = (message: string, context?: Partial<ErrorContext>): EnhancedError => {
    return ErrorManager.getInstance().createError(
        new Error(message),
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        context,
        'Network error. Please check your connection and try again.'
    );
};

// React-specific error handling
export interface ReactErrorContext extends ErrorContext {
    componentStack?: string;
    errorBoundary?: string;
}

export const createReactError = (
    error: Error,
    errorInfo: ErrorInfo,
    context?: Partial<ReactErrorContext>
): EnhancedError => {
    return ErrorManager.getInstance().createError(
        error,
        ErrorType.SYSTEM,
        ErrorSeverity.HIGH,
        {
            ...context,
            componentStack: errorInfo.componentStack,
            metadata: {
                ...context?.metadata,
                reactError: true,
            },
        },
        'A component error occurred. Please refresh the page.'
    );
};

// Export singleton instance
export const errorManager = ErrorManager.getInstance();