import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';
import { log } from '../utils/logger';
import { addBreadcrumb } from '../utils/sentry';

// Input validation schemas
export const termIdSchema = z.string().uuid('Invalid term ID format');
export const userIdSchema = z.string().min(1, 'User ID is required');
export const searchQuerySchema = z.string().max(500, 'Search query too long').optional();
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).max(1000).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Enhanced rate limiting with different tiers
export const createRateLimit = (options: {
  windowMs: number;
  max: number;
  message: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: 'Too many requests',
      message: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000),
    },
    keyGenerator:
      options.keyGenerator ||
      ((req) => {
        // Use user ID if authenticated, otherwise IP
        const user = req.user as any;
        return user?.id || user?.claims?.sub || req.ip;
      }),
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    handler: (req, res) => {
      const user = req.user as any;
      const identifier = user?.id || user?.claims?.sub || req.ip;

      log.warn('Rate limit exceeded', {
        identifier,
        path: req.path,
        method: req.method,
        userAgent: req.headers['user-agent'],
      });

      addBreadcrumb('Rate limit exceeded', 'security', 'warning', {
        identifier,
        path: req.path,
        method: req.method,
      });

      res.status(429).json({
        error: 'Too many requests',
        message: options.message,
        retryAfter: Math.ceil(options.windowMs / 1000),
      });
    },
  });
};

// Different rate limits for different endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later',
});

export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // 10000 requests per 15 minutes (increased for development)
  message: 'Too many API requests, please slow down',
});

export const searchRateLimit = createRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: 'Too many search requests, please wait before searching again',
  skipSuccessfulRequests: true,
});

export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many file uploads, please wait before uploading again',
});

// Legacy rate limit config for backward compatibility
export const rateLimitConfig = {
  api: { windowMs: 15 * 60 * 1000, max: 1000 },
  search: { windowMs: 1 * 60 * 1000, max: 30 },
  auth: { windowMs: 15 * 60 * 1000, max: 5 },
};

// CORS configuration for production security
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite dev server
      'https://localhost:3000',
      'https://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL,
      process.env.PRODUCTION_URL,
      process.env.STAGING_URL,
    ].filter(Boolean); // Remove undefined values

    // In production, be more restrictive
    if (process.env.NODE_ENV === 'production') {
      const productionOrigins = [
        process.env.FRONTEND_URL,
        process.env.PRODUCTION_URL,
        process.env.STAGING_URL,
      ].filter(Boolean);

      if (productionOrigins.length === 0) {
        log.error('No production origins configured for CORS');
        return callback(new Error('CORS configuration error'), false);
      }

      if (productionOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        log.warn('CORS blocked origin in production', {
          origin,
          allowedOrigins: productionOrigins,
        });
        return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    }

    // In development, allow localhost and 127.0.0.1 variants
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }

    log.warn('CORS blocked origin', { origin, allowedOrigins });
    callback(new Error(`Origin ${origin} not allowed by CORS`), false);
  },

  credentials: true, // Allow cookies and auth headers

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
    'X-Request-ID',
    'X-API-Key',
  ],

  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],

  maxAge: 86400, // 24 hours preflight cache

  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
});

// Enhanced security headers with Helmet
export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Vite dev server
        "'unsafe-eval'", // Required for Vite dev server
        'https://js.sentry-cdn.com',
        'https://browser.sentry-cdn.com',
        'https://cdn.jsdelivr.net', // For charts/components
        'https://unpkg.com', // For mermaid diagrams
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for dynamic styles
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net',
      ],
      imgSrc: [
        "'self'",
        'data:', // For base64 images
        'https:', // Allow HTTPS images
        'blob:', // For generated images
      ],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      connectSrc: [
        "'self'",
        'https://api.openai.com', // For AI features
        'https://o4506996519346176.ingest.sentry.io', // Sentry
        'wss://localhost:*', // WebSocket for dev
        'ws://localhost:*', // WebSocket for dev
      ],
      mediaSrc: ["'self'", 'blob:', 'data:'],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },

  // Prevent clickjacking
  frameguard: {
    action: 'deny',
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Prevent MIME type sniffing
  noSniff: true,

  // Enable HSTS in production
  hsts:
    process.env.NODE_ENV === 'production'
      ? {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true,
        }
      : false,

  // Referrer policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // Cross-Origin policies
  crossOriginEmbedderPolicy: false, // Disabled for external resources
  crossOriginResourcePolicy: {
    policy: 'cross-origin',
  },
});

// Input sanitization
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential script tags and dangerous characters
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }

  if (input && typeof input === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }

  return input;
}

// Request sanitization middleware
export function sanitizeRequest(req: Request, _res: Response, next: NextFunction) {
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  req.params = sanitizeInput(req.params);
  next();
}

// Validation middleware factory
export function validateInput<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

// Query parameter validation
export function validateQuery<T>(schema: z.ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.query);
      req.query = result as any;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
}

// CSRF protection for state-changing operations
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET requests
  if (req.method === 'GET') {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = ((req as any).session as any)?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token',
    });
  }

  next();
}

// SQL injection prevention (additional layer)
export function preventSqlInjection(req: Request, res: Response, next: NextFunction) {
  const suspiciousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/gi,
    /(--|\*|\/\*|\*\/|xp_|sp_)/gi,
    /(\bOR\b.*=.*\bOR\b)/gi,
    /(\bAND\b.*=.*\bAND\b)/gi,
  ];

  const checkForSqlInjection = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return suspiciousPatterns.some((pattern) => pattern.test(obj));
    }

    if (Array.isArray(obj)) {
      return obj.some(checkForSqlInjection);
    }

    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkForSqlInjection);
    }

    return false;
  };

  if (checkForSqlInjection(req.body) || checkForSqlInjection(req.query)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected',
    });
  }

  next();
}

// Enhanced security monitoring middleware
export const securityMonitoring = (req: Request, _res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /(\/\/|\*|;|\||&|`|\$\(|\$\{)/, // Command injection patterns
    /(union|select|insert|delete|update|drop|create|alter)\s/i, // SQL injection patterns
    /<script|javascript:|vbscript:|onload=|onerror=/i, // XSS patterns
    /\.\.\/|\.\.\\/i, // Path traversal patterns
    /(eval|exec|system|shell_exec|passthru)\s*\(/i, // Code execution patterns
  ];

  const checkForSuspiciousActivity = (data: any, source: string) => {
    const dataStr = JSON.stringify(data).toLowerCase();

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(dataStr)) {
        log.warn('Suspicious activity detected', {
          source,
          pattern: pattern.toString(),
          data: dataStr.substring(0, 200),
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          user: (req.user as any)?.id || 'anonymous',
        });

        addBreadcrumb('Suspicious activity detected', 'security', 'warning', {
          source,
          pattern: pattern.toString(),
        });

        break;
      }
    }
  };

  // Check request body, query, and params for suspicious patterns
  if (req.body) checkForSuspiciousActivity(req.body, 'body');
  if (req.query) checkForSuspiciousActivity(req.query, 'query');
  if (req.params) checkForSuspiciousActivity(req.params, 'params');

  next();
};

// Legacy security audit log function
export function securityAuditLog(req: Request, _res: Response, next: NextFunction) {
  const logData = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    method: req.method,
    path: req.path,
    userId: (req.user as any)?.claims?.sub || (req.user as any)?.id,
    suspicious: false,
  };

  log.info('Security audit log', logData);
  next();
}

// File upload security validation
export const validateFileUpload = (
  file: Express.Multer.File
): { valid: boolean; error?: string } => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/json',
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} is not allowed`,
    };
  }

  if (file.size > maxFileSize) {
    return {
      valid: false,
      error: `File size ${file.size} exceeds maximum allowed size of ${maxFileSize} bytes`,
    };
  }

  // Check for malicious file extensions
  const maliciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar'];
  const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

  if (maliciousExtensions.includes(fileExt)) {
    return {
      valid: false,
      error: `File extension ${fileExt} is not allowed`,
    };
  }

  return { valid: true };
};

// Environment variable validation
export const validateEnvironmentVariables = (): { valid: boolean; errors: string[] } => {
  const required = ['DATABASE_URL', 'SESSION_SECRET'];
  const errors: string[] = [];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`);
    }
  }

  // Check for insecure configurations
  if (process.env.NODE_ENV === 'production') {
    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
      errors.push('SESSION_SECRET should be at least 32 characters in production');
    }

    if (!process.env.HTTPS && !process.env.SSL_CERT) {
      errors.push('HTTPS should be enabled in production');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export default {
  corsMiddleware,
  securityHeaders,
  sanitizeRequest,
  validateInput,
  validateQuery,
  csrfProtection,
  preventSqlInjection,
  securityAuditLog,
  securityMonitoring,
  rateLimitConfig,
  authRateLimit,
  apiRateLimit,
  searchRateLimit,
  uploadRateLimit,
  validateFileUpload,
  validateEnvironmentVariables,
};
