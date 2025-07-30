import type { ErrorInfo } from 'react';
export declare enum ErrorType {
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    VALIDATION = "validation",
    DATABASE = "database",
    NETWORK = "network",
    API = "api",
    BUSINESS_LOGIC = "business_logic",
    SYSTEM = "system",
    UNKNOWN = "unknown"
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
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
export interface EnhancedError extends Error {
    type: ErrorType;
    severity: ErrorSeverity;
    context: ErrorContext;
    userMessage: string;
    code?: string;
    retryable?: boolean;
    originalError?: Error;
}
export type ErrorHandler = (error: EnhancedError) => void | Promise<void>;
export interface ErrorRecoveryStrategy {
    canRecover: (error: EnhancedError) => boolean;
    recover: (error: EnhancedError) => Promise<void>;
}
/**
 * Centralized Error Manager for handling all application errors
 */
export declare class ErrorManager {
    private static instance;
    private errorHandlers;
    private recoveryStrategies;
    private errorCounts;
    private isInitialized;
    private constructor();
    static getInstance(): ErrorManager;
    /**
     * Initialize the error manager with default configurations
     */
    initialize(): void;
    /**
     * Create an enhanced error from a regular error
     */
    createError(error: Error | string, type?: ErrorType, severity?: ErrorSeverity, context?: Partial<ErrorContext>, userMessage?: string): EnhancedError;
    /**
     * Handle an error through the centralized system
     */
    handleError(error: Error | EnhancedError, type?: ErrorType, severity?: ErrorSeverity, context?: Partial<ErrorContext>): Promise<void>;
    /**
     * Register an error handler for a specific error type
     */
    registerHandler(type: ErrorType, handler: ErrorHandler): void;
    /**
     * Register a recovery strategy
     */
    registerRecoveryStrategy(strategy: ErrorRecoveryStrategy): void;
    /**
     * Get error statistics
     */
    getErrorStats(): Record<string, number>;
    /**
     * Clear error statistics
     */
    clearErrorStats(): void;
    private initializeDefaultHandlers;
    private isEnhancedError;
    private generateUserMessage;
    private trackErrorFrequency;
    private attemptRecovery;
    private executeHandlers;
    private handleGlobalError;
    private handleUnhandledRejection;
    private handleUncaughtException;
}
export declare const createAuthError: (message: string, context?: Partial<ErrorContext>) => EnhancedError;
export declare const createValidationError: (message: string, context?: Partial<ErrorContext>) => EnhancedError;
export declare const createDatabaseError: (message: string, context?: Partial<ErrorContext>) => EnhancedError;
export declare const createNetworkError: (message: string, context?: Partial<ErrorContext>) => EnhancedError;
export interface ReactErrorContext extends ErrorContext {
    componentStack?: string;
    errorBoundary?: string;
}
export declare const createReactError: (error: Error, errorInfo: ErrorInfo, context?: Partial<ReactErrorContext>) => EnhancedError;
export declare const errorManager: ErrorManager;
