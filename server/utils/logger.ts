import winston from 'winston';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Custom format for better readability
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\nStack: ${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create Winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { 
    service: 'ai-glossary-pro',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // Console output (only in development)
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ] : [])
  ],
  
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Export logging functions
export const log = {
  error: (message: string, meta?: Record<string, unknown>) => logger.error(message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => logger.warn(message, meta),
  info: (message: string, meta?: Record<string, unknown>) => logger.info(message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => logger.debug(message, meta),
  
  // Specific logging functions for different components
  api: {
    request: (method: string, path: string, userId?: string, meta?: Record<string, unknown>) => 
      logger.info(`API Request: ${method} ${path}`, { 
        method, 
        path, 
        userId, 
        type: 'api_request',
        ...meta 
      }),
    
    response: (method: string, path: string, statusCode: number, duration: number, meta?: Record<string, unknown>) =>
      logger.info(`API Response: ${method} ${path} ${statusCode} (${duration}ms)`, {
        method,
        path,
        statusCode,
        duration,
        type: 'api_response',
        ...meta
      }),
    
    error: (method: string, path: string, error: Error, meta?: Record<string, unknown>) =>
      logger.error(`API Error: ${method} ${path}`, {
        method,
        path,
        error: error.message,
        stack: error.stack,
        type: 'api_error',
        ...meta
      })
  },
  
  auth: {
    login: (userId: string, email?: string, provider?: string) =>
      logger.info('User login', { 
        userId, 
        email, 
        provider, 
        type: 'auth_login' 
      }),
    
    logout: (userId: string) =>
      logger.info('User logout', { 
        userId, 
        type: 'auth_logout' 
      }),
    
    failed: (email?: string, reason?: string) =>
      logger.warn('Authentication failed', { 
        email, 
        reason, 
        type: 'auth_failed' 
      })
  },
  
  database: {
    query: (query: string, duration: number, meta?: Record<string, unknown>) =>
      logger.debug('Database query', {
        query: query.substring(0, 200), // Truncate long queries
        duration,
        type: 'db_query',
        ...meta
      }),
    
    error: (query: string, error: Error, meta?: Record<string, unknown>) =>
      logger.error('Database error', {
        query: query.substring(0, 200),
        error: error.message,
        stack: error.stack,
        type: 'db_error',
        ...meta
      }),
    
    connection: (event: 'connect' | 'disconnect' | 'error', meta?: Record<string, unknown>) =>
      logger.info(`Database ${event}`, {
        event,
        type: 'db_connection',
        ...meta
      })
  },
  
  security: {
    rateLimitExceeded: (userId: string, endpoint: string, limit: number) =>
      logger.warn('Rate limit exceeded', {
        userId,
        endpoint,
        limit,
        type: 'security_rate_limit'
      }),
    
    suspiciousActivity: (userId: string, activity: string, meta?: Record<string, unknown>) =>
      logger.warn('Suspicious activity detected', {
        userId,
        activity,
        type: 'security_suspicious',
        ...meta
      }),
    
    unauthorizedAccess: (endpoint: string, userId?: string, ip?: string) =>
      logger.warn('Unauthorized access attempt', {
        endpoint,
        userId,
        ip,
        type: 'security_unauthorized'
      })
  }
};

// Performance monitoring helper
export const performanceTimer = (label: string) => {
  const start = Date.now();
  return {
    end: (meta?: Record<string, unknown>) => {
      const duration = Date.now() - start;
      logger.info(`Performance: ${label}`, {
        duration,
        type: 'performance',
        label,
        ...meta
      });
      return duration;
    }
  };
};

// Health check logging
export const logHealthCheck = (component: string, status: 'healthy' | 'unhealthy', details?: Record<string, unknown>) => {
  const level = status === 'healthy' ? 'info' : 'error';
  logger.log(level, `Health check: ${component} is ${status}`, {
    component,
    status,
    type: 'health_check',
    ...details
  });
};

export default logger;