import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Log levels with priorities
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colors for console output
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

// Custom format for better readability
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
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
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Error log file with daily rotation
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d', // Keep for 30 days
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      auditFile: path.join(logsDir, 'error-audit.json'),
    }),

    // Combined log file with daily rotation
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d', // Keep for 14 days
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      auditFile: path.join(logsDir, 'combined-audit.json'),
    }),

    // HTTP access log with daily rotation
    new DailyRotateFile({
      filename: path.join(logsDir, 'access-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '7d', // Keep for 7 days
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      auditFile: path.join(logsDir, 'access-audit.json'),
    }),

    // Console output (only in development)
    ...(process.env.NODE_ENV !== 'production'
      ? [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
              return `${timestamp} [${level}]: ${message}${metaStr}`;
            })
          ),
        }),
      ]
      : []),
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
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
        ...meta,
      }),

    response: (
      method: string,
      path: string,
      statusCode: number,
      duration: number,
      meta?: Record<string, unknown>
    ) =>
      logger.info(`API Response: ${method} ${path} ${statusCode} (${duration}ms)`, {
        method,
        path,
        statusCode,
        duration,
        type: 'api_response',
        ...meta,
      }),

    error: (method: string, path: string, error: Error, meta?: Record<string, unknown>) =>
      logger.error(`API Error: ${method} ${path}`, {
        method,
        path,
        error: error.message,
        stack: error.stack,
        type: 'api_error',
        ...meta,
      }),
  },

  auth: {
    login: (userId: string, email?: string, provider?: string) =>
      logger.info('User login', {
        userId,
        email,
        provider,
        type: 'auth_login',
      }),

    logout: (userId: string) =>
      logger.info('User logout', {
        userId,
        type: 'auth_logout',
      }),

    failed: (email?: string, reason?: string) =>
      logger.warn('Authentication failed', {
        email,
        reason,
        type: 'auth_failed',
      }),
  },

  database: {
    query: (query: string, duration: number, meta?: Record<string, unknown>) =>
      logger.debug('Database query', {
        query: query.substring(0, 200), // Truncate long queries
        duration,
        type: 'db_query',
        ...meta,
      }),

    error: (query: string, error: Error, meta?: Record<string, unknown>) =>
      logger.error('Database error', {
        query: query.substring(0, 200),
        error: error.message,
        stack: error.stack,
        type: 'db_error',
        ...meta,
      }),

    connection: (event: 'connect' | 'disconnect' | 'error', meta?: Record<string, unknown>) =>
      logger.info(`Database ${event}`, {
        event,
        type: 'db_connection',
        ...meta,
      }),
  },

  security: {
    rateLimitExceeded: (userId: string, endpoint: string, limit: number) =>
      logger.warn('Rate limit exceeded', {
        userId,
        endpoint,
        limit,
        type: 'security_rate_limit',
      }),

    suspiciousActivity: (userId: string, activity: string, meta?: Record<string, unknown>) =>
      logger.warn('Suspicious activity detected', {
        userId,
        activity,
        type: 'security_suspicious',
        ...meta,
      }),

    unauthorizedAccess: (endpoint: string, userId?: string, ip?: string) =>
      logger.warn('Unauthorized access attempt', {
        endpoint,
        userId,
        ip,
        type: 'security_unauthorized',
      }),
  },
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
        ...meta,
      });
      return duration;
    },
  };
};

// Health check logging
export const logHealthCheck = (
  component: string,
  status: 'healthy' | 'unhealthy',
  details?: Record<string, unknown>
) => {
  const level = status === 'healthy' ? 'info' : 'error';
  logger.log(level, `Health check: ${component} is ${status}`, {
    component,
    status,
    type: 'health_check',
    ...details,
  });
};

export default logger;
