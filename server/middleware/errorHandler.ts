/**
 * Comprehensive Error Handling and Logging Middleware
 * Provides centralized error handling, logging, and user-friendly error responses
 */

import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// Error types for better categorization
export enum ErrorCategory {
  DATABASE = 'DATABASE',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  EXTERNAL_API = 'EXTERNAL_API',
  FILE_SYSTEM = 'FILE_SYSTEM',
  SEARCH = 'SEARCH',
  AI_SERVICE = 'AI_SERVICE',
  UNKNOWN = 'UNKNOWN'
}

export interface LoggedError {
  id: string;
  timestamp: Date;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context: {
    userId?: string;
    endpoint: string;
    method: string;
    userAgent?: string;
    ip?: string;
    body?: any;
    query?: any;
    params?: any;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

class ErrorLogger {
  private logDirectory: string;
  private errorLog: LoggedError[] = [];
  
  constructor() {
    this.logDirectory = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory() {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  async logError(error: Error | any, req: Request, category: ErrorCategory = ErrorCategory.UNKNOWN, severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<string> {
    const errorId = this.generateErrorId();
    
    const loggedError: LoggedError = {
      id: errorId,
      timestamp: new Date(),
      category,
      message: error.message || String(error),
      stack: error.stack,
      context: {
        userId: (req as any).user?.id,
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('user-agent'),
        ip: req.ip || req.connection.remoteAddress,
        body: this.sanitizeData(req.body),
        query: req.query,
        params: req.params
      },
      severity
    };

    // Add to in-memory log (keep last 1000 errors)
    this.errorLog.unshift(loggedError);
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(0, 1000);
    }

    // Write to file
    await this.writeToFile(loggedError);

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${severity.toUpperCase()}] ${category}: ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
    }

    return errorId;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = JSON.parse(JSON.stringify(data));
    
    const sanitizeObject = (obj: any) => {
      for (const key in obj) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  private async writeToFile(error: LoggedError): Promise<void> {
    try {
      const date = new Date().toISOString().split('T')[0];
      const filename = `errors_${date}.log`;
      const filepath = path.join(this.logDirectory, filename);
      
      const logLine = JSON.stringify(error) + '\n';
      fs.appendFileSync(filepath, logLine);
    } catch (writeError) {
      console.error('Failed to write error log:', writeError);
    }
  }

  getRecentErrors(limit: number = 50): LoggedError[] {
    return this.errorLog.slice(0, limit);
  }

  getErrorsByCategory(category: ErrorCategory, limit: number = 50): LoggedError[] {
    return this.errorLog.filter(err => err.category === category).slice(0, limit);
  }

  getErrorStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    // Count by category
    this.errorLog.forEach(error => {
      const key = `${error.category}_${error.severity}`;
      stats[key] = (stats[key] || 0) + 1;
    });
    
    return stats;
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

/**
 * Async wrapper for route handlers to catch and handle errors
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Database error handler
 */
export const handleDatabaseError = async (error: any, req: Request): Promise<string> => {
  let category = ErrorCategory.DATABASE;
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  
  // Categorize database errors
  if (error.code === '23505') { // Unique constraint violation
    severity = 'low';
  } else if (error.code === '23503') { // Foreign key violation
    severity = 'medium';
  } else if (error.code === 'ECONNREFUSED') { // Connection refused
    severity = 'critical';
  } else if (error.message?.includes('timeout')) {
    severity = 'high';
  }
  
  return await errorLogger.logError(error, req, category, severity);
};

/**
 * AI/External API error handler
 */
export const handleExternalAPIError = async (error: any, req: Request, service: string): Promise<string> => {
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  
  // Categorize by HTTP status or error type
  if (error.status >= 500) {
    severity = 'high';
  } else if (error.status === 429) { // Rate limit
    severity = 'medium';
  } else if (error.status >= 400) {
    severity = 'low';
  }
  
  const enhancedError = new Error(`${service}: ${error.message}`);
  enhancedError.stack = error.stack;
  
  return await errorLogger.logError(enhancedError, req, ErrorCategory.EXTERNAL_API, severity);
};

/**
 * Main error handling middleware
 */
export const errorHandler = async (error: any, req: Request, res: Response, next: NextFunction) => {
  // Default error response
  let statusCode = 500;
  let userMessage = 'An unexpected error occurred. Please try again later.';
  let category = ErrorCategory.UNKNOWN;
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';

  // Categorize and handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    userMessage = 'Invalid input provided.';
    category = ErrorCategory.VALIDATION;
    severity = 'low';
  } else if (error.name === 'UnauthorizedError' || error.status === 401) {
    statusCode = 401;
    userMessage = 'Authentication required.';
    category = ErrorCategory.AUTHENTICATION;
    severity = 'medium';
  } else if (error.name === 'ForbiddenError' || error.status === 403) {
    statusCode = 403;
    userMessage = 'Access denied.';
    category = ErrorCategory.AUTHENTICATION;
    severity = 'medium';
  } else if (error.code?.startsWith('23')) { // PostgreSQL errors
    statusCode = 400;
    userMessage = 'Database operation failed.';
    category = ErrorCategory.DATABASE;
    severity = 'medium';
  } else if (error.message?.includes('ENOENT')) {
    statusCode = 404;
    userMessage = 'Requested resource not found.';
    category = ErrorCategory.FILE_SYSTEM;
    severity = 'low';
  } else if (error.message?.includes('timeout')) {
    statusCode = 504;
    userMessage = 'Operation timed out. Please try again.';
    severity = 'high';
  }

  // Log the error
  const errorId = await errorLogger.logError(error, req, category, severity);

  // Respond with appropriate error message
  const errorResponse: any = {
    success: false,
    message: userMessage,
    errorId,
    timestamp: new Date().toISOString()
  };

  // Include additional details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = {
      message: error.message,
      stack: error.stack,
      category,
      severity
    };
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
};

/**
 * Graceful shutdown handler
 */
export const gracefulShutdown = (server: any) => {
  const shutdown = () => {
    console.log('🔄 Graceful shutdown initiated...');
    
    server.close(() => {
      console.log('✅ HTTP server closed');
      
      // Save final error logs
      console.log('💾 Saving final error logs...');
      
      // Exit process
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  // Listen for termination signals
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('❌ Uncaught Exception:', error);
    await errorLogger.logError(error, {} as Request, ErrorCategory.UNKNOWN, 'critical');
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    const error = new Error(`Unhandled Rejection: ${reason}`);
    await errorLogger.logError(error, {} as Request, ErrorCategory.UNKNOWN, 'critical');
    process.exit(1);
  });
};