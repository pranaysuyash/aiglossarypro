/**
 * Enhanced error handling utilities
 * Provides consistent error responses and categorization
 */

import { Response } from 'express';

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Resource Management
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  
  // Database
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Business Logic
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
}

export interface ApiError {
  success: false;
  error: ErrorCode;
  message: string;
  details?: string;
  timestamp: string;
  requestId?: string;
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode: number;
  details?: string;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: ErrorCode, 
  message: string, 
  details?: string,
  requestId?: string
): ApiError {
  return {
    success: false,
    error,
    message,
    details,
    timestamp: new Date().toISOString(),
    requestId
  };
}

/**
 * Send error response with appropriate HTTP status code
 */
export function sendErrorResponse(
  res: Response, 
  error: ErrorCode, 
  message: string, 
  details?: string,
  requestId?: string
): void {
  const statusCode = getStatusCodeForError(error);
  const response = createErrorResponse(error, message, details, requestId);
  
  res.status(statusCode).json(response);
}

/**
 * Get HTTP status code for error type
 */
export function getStatusCodeForError(error: ErrorCode): number {
  switch (error) {
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.INVALID_TOKEN:
      return 401;
    
    case ErrorCode.FORBIDDEN:
    case ErrorCode.INSUFFICIENT_PERMISSIONS:
      return 403;
    
    case ErrorCode.RESOURCE_NOT_FOUND:
      return 404;
    
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_REQUIRED_FIELD:
      return 400;
    
    case ErrorCode.RESOURCE_ALREADY_EXISTS:
    case ErrorCode.RESOURCE_CONFLICT:
    case ErrorCode.OPERATION_NOT_ALLOWED:
      return 409;
    
    case ErrorCode.QUOTA_EXCEEDED:
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 429;
    
    case ErrorCode.SERVICE_UNAVAILABLE:
      return 503;
    
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.CONSTRAINT_VIOLATION:
    case ErrorCode.DUPLICATE_ENTRY:
    case ErrorCode.INTERNAL_ERROR:
    default:
      return 500;
  }
}

/**
 * Handle database constraint violations
 */
export function handleDatabaseError(error: any): { code: ErrorCode; message: string; details?: string } {
  // PostgreSQL error codes
  if (error.code === '23505') { // unique_violation
    return {
      code: ErrorCode.DUPLICATE_ENTRY,
      message: 'A record with this information already exists',
      details: 'Duplicate key value violates unique constraint'
    };
  }
  
  if (error.code === '23503') { // foreign_key_violation
    return {
      code: ErrorCode.CONSTRAINT_VIOLATION,
      message: 'Referenced record does not exist',
      details: 'Foreign key constraint violation'
    };
  }
  
  if (error.code === '23514') { // check_violation
    return {
      code: ErrorCode.CONSTRAINT_VIOLATION,
      message: 'Data violates business rules',
      details: 'Check constraint violation'
    };
  }
  
  if (error.code === '42P01') { // undefined_table
    return {
      code: ErrorCode.DATABASE_ERROR,
      message: 'Database configuration error',
      details: 'Required table does not exist'
    };
  }
  
  // Generic database error
  return {
    code: ErrorCode.DATABASE_ERROR,
    message: 'Database operation failed',
    details: error.message || 'Unknown database error'
  };
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: string): { code: ErrorCode; message: string } {
  switch (error) {
    case 'TOKEN_EXPIRED':
      return {
        code: ErrorCode.INVALID_TOKEN,
        message: 'Authentication token has expired'
      };
    
    case 'TOKEN_INVALID':
      return {
        code: ErrorCode.INVALID_TOKEN,
        message: 'Authentication token is invalid'
      };
    
    case 'NO_TOKEN':
      return {
        code: ErrorCode.UNAUTHORIZED,
        message: 'Authentication required'
      };
    
    case 'INSUFFICIENT_PERMISSIONS':
      return {
        code: ErrorCode.FORBIDDEN,
        message: 'Insufficient permissions for this operation'
      };
    
    default:
      return {
        code: ErrorCode.UNAUTHORIZED,
        message: 'Authentication failed'
      };
  }
}

/**
 * Enhanced error response for development vs production
 */
export function createDetailedErrorResponse(
  error: any,
  message: string,
  isDevelopment: boolean = process.env.NODE_ENV === 'development'
): ApiError {
  const baseResponse = createErrorResponse(
    ErrorCode.INTERNAL_ERROR,
    message
  );
  
  if (isDevelopment) {
    baseResponse.details = error.stack || error.message || String(error);
  }
  
  return baseResponse;
}

/**
 * Validation for common operations
 */
export const CommonErrors = {
  notFound: (resource: string) => ({
    code: ErrorCode.RESOURCE_NOT_FOUND,
    message: `${resource} not found`
  }),
  
  alreadyExists: (resource: string) => ({
    code: ErrorCode.RESOURCE_ALREADY_EXISTS,
    message: `${resource} already exists`
  }),
  
  unauthorized: () => ({
    code: ErrorCode.UNAUTHORIZED,
    message: 'Authentication required'
  }),
  
  forbidden: (action?: string) => ({
    code: ErrorCode.FORBIDDEN,
    message: action ? `Not authorized to ${action}` : 'Access denied'
  }),
  
  validation: (field: string) => ({
    code: ErrorCode.VALIDATION_ERROR,
    message: `Invalid ${field} provided`
  })
} as const;