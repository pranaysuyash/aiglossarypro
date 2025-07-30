"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorManager = exports.createReactError = exports.createNetworkError = exports.createDatabaseError = exports.createValidationError = exports.createAuthError = exports.ErrorManager = exports.ErrorSeverity = exports.ErrorType = void 0;
// Error types for categorization
var ErrorType;
(function (ErrorType) {
    ErrorType["AUTHENTICATION"] = "authentication";
    ErrorType["AUTHORIZATION"] = "authorization";
    ErrorType["VALIDATION"] = "validation";
    ErrorType["DATABASE"] = "database";
    ErrorType["NETWORK"] = "network";
    ErrorType["API"] = "api";
    ErrorType["BUSINESS_LOGIC"] = "business_logic";
    ErrorType["SYSTEM"] = "system";
    ErrorType["UNKNOWN"] = "unknown";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
// Error severity levels
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
/**
 * Centralized Error Manager for handling all application errors
 */
class ErrorManager {
    constructor() {
        this.errorHandlers = new Map();
        this.recoveryStrategies = [];
        this.errorCounts = new Map();
        this.isInitialized = false;
        this.initializeDefaultHandlers();
    }
    static getInstance() {
        if (!ErrorManager.instance) {
            ErrorManager.instance = new ErrorManager();
        }
        return ErrorManager.instance;
    }
    /**
     * Initialize the error manager with default configurations
     */
    initialize() {
        if (this.isInitialized) {
            return;
        }
        // Set up global error handlers
        if (typeof window !== 'undefined') {
            // Client-side error handling
            window.addEventListener('error', this.handleGlobalError.bind(this));
            window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        }
        else {
            // Server-side error handling
            process.on('uncaughtException', this.handleUncaughtException.bind(this));
            process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
        }
        this.isInitialized = true;
    }
    /**
     * Create an enhanced error from a regular error
     */
    createError(error, type = ErrorType.UNKNOWN, severity = ErrorSeverity.MEDIUM, context = {}, userMessage) {
        const baseError = typeof error === 'string' ? new Error(error) : error;
        const enhancedError = {
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
            userMessage: userMessage || this.generateUserMessage(type),
            originalError: typeof error === 'string' ? undefined : error,
        };
        return enhancedError;
    }
    /**
     * Handle an error through the centralized system
     */
    async handleError(error, type, severity, context) {
        let enhancedError;
        if (this.isEnhancedError(error)) {
            enhancedError = error;
        }
        else {
            enhancedError = this.createError(error, type || ErrorType.UNKNOWN, severity || ErrorSeverity.MEDIUM, context);
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
    registerHandler(type, handler) {
        if (!this.errorHandlers.has(type)) {
            this.errorHandlers.set(type, []);
        }
        this.errorHandlers.get(type).push(handler);
    }
    /**
     * Register a recovery strategy
     */
    registerRecoveryStrategy(strategy) {
        this.recoveryStrategies.push(strategy);
    }
    /**
     * Get error statistics
     */
    getErrorStats() {
        return Object.fromEntries(this.errorCounts);
    }
    /**
     * Clear error statistics
     */
    clearErrorStats() {
        this.errorCounts.clear();
    }
    // Private methods
    initializeDefaultHandlers() {
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
    isEnhancedError(error) {
        return !!(error && typeof error === 'object' && 'type' in error && 'severity' in error);
    }
    generateUserMessage(type) {
        const userMessages = {
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
    trackErrorFrequency(error) {
        const key = `${error.type}:${error.name}`;
        const current = this.errorCounts.get(key) || 0;
        this.errorCounts.set(key, current + 1);
    }
    async attemptRecovery(error) {
        for (const strategy of this.recoveryStrategies) {
            if (strategy.canRecover(error)) {
                try {
                    await strategy.recover(error);
                    return true;
                }
                catch (recoveryError) {
                    console.warn('Recovery strategy failed:', recoveryError);
                }
            }
        }
        return false;
    }
    async executeHandlers(error) {
        const handlers = this.errorHandlers.get(error.type) || [];
        const globalHandlers = this.errorHandlers.get(ErrorType.UNKNOWN) || [];
        const allHandlers = [...handlers, ...globalHandlers];
        for (const handler of allHandlers) {
            try {
                await handler(error);
            }
            catch (handlerError) {
                console.error('Error handler failed:', handlerError);
            }
        }
    }
    // Global error handlers
    handleGlobalError(event) {
        const error = this.createError(event.error || new Error(event.message), ErrorType.SYSTEM, ErrorSeverity.HIGH, {
            url: event.filename,
            metadata: {
                lineno: event.lineno,
                colno: event.colno,
            },
        });
        this.handleError(error);
    }
    handleUnhandledRejection(event) {
        const error = this.createError(event.reason || new Error('Unhandled promise rejection'), ErrorType.SYSTEM, ErrorSeverity.HIGH, {
            metadata: {
                type: 'unhandled_rejection',
            },
        });
        this.handleError(error);
    }
    handleUncaughtException(error) {
        const enhancedError = this.createError(error, ErrorType.SYSTEM, ErrorSeverity.CRITICAL, {
            metadata: {
                type: 'uncaught_exception',
            },
        });
        this.handleError(enhancedError);
    }
}
exports.ErrorManager = ErrorManager;
// Convenience functions for common error scenarios
const createAuthError = (message, context) => {
    return ErrorManager.getInstance().createError(new Error(message), ErrorType.AUTHENTICATION, ErrorSeverity.MEDIUM, context, 'Authentication failed. Please check your credentials.');
};
exports.createAuthError = createAuthError;
const createValidationError = (message, context) => {
    return ErrorManager.getInstance().createError(new Error(message), ErrorType.VALIDATION, ErrorSeverity.LOW, context, 'Please check your input and try again.');
};
exports.createValidationError = createValidationError;
const createDatabaseError = (message, context) => {
    return ErrorManager.getInstance().createError(new Error(message), ErrorType.DATABASE, ErrorSeverity.HIGH, context, 'Database operation failed. Please try again later.');
};
exports.createDatabaseError = createDatabaseError;
const createNetworkError = (message, context) => {
    return ErrorManager.getInstance().createError(new Error(message), ErrorType.NETWORK, ErrorSeverity.MEDIUM, context, 'Network error. Please check your connection and try again.');
};
exports.createNetworkError = createNetworkError;
const createReactError = (error, errorInfo, context) => {
    return ErrorManager.getInstance().createError(error, ErrorType.SYSTEM, ErrorSeverity.HIGH, {
        ...context,
        metadata: {
            ...context?.metadata,
            componentStack: errorInfo.componentStack,
            reactError: true,
        },
    }, 'A component error occurred. Please refresh the page.');
};
exports.createReactError = createReactError;
// Export singleton instance
exports.errorManager = ErrorManager.getInstance();
//# sourceMappingURL=errorManager.js.map