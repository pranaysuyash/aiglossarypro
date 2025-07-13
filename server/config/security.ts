/**
 * Security Configuration for Production
 * Implements security headers, rate limiting, and security best practices
 */

import type { Express, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { log as logger } from '../utils/logger';

interface SecurityConfig {
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    standardHeaders: boolean;
    legacyHeaders: boolean;
  };
  helmet: {
    contentSecurityPolicy: {
      directives: Record<string, string[]>;
    };
    crossOriginEmbedderPolicy: boolean;
    crossOriginOpenerPolicy: { policy: string };
    crossOriginResourcePolicy: { policy: string };
    hsts: {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
  };
  cors: {
    origin: string | string[] | boolean;
    credentials: boolean;
    optionsSuccessStatus: number;
  };
}

/**
 * Get security configuration based on environment
 */
function getSecurityConfig(): SecurityConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const corsOrigin = process.env.CORS_ORIGIN || baseUrl;

  return {
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
      skipSuccessfulRequests: false,
      standardHeaders: true,
      legacyHeaders: false,
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: [
            "'self'",
            "'unsafe-inline'",
            "https://fonts.googleapis.com",
            "https://cdn.jsdelivr.net",
          ],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for some React functionality
            "https://www.googletagmanager.com",
            "https://www.google-analytics.com",
            "https://gumroad.com",
            "https://assets.gumroad.com",
          ],
          imgSrc: [
            "'self'",
            "data:",
            "https:",
            "blob:",
          ],
          fontSrc: [
            "'self'",
            "https://fonts.gstatic.com",
            "data:",
          ],
          connectSrc: [
            "'self'",
            "https://api.openai.com",
            "https://www.google-analytics.com",
            "https://analytics.google.com",
            "https://app.posthog.com",
            "https://o4504609969086464.ingest.sentry.io",
            "wss://aiglossary.pro",
            "ws://localhost:*", // Development WebSocket
          ],
          frameSrc: [
            "'self'",
            "https://gumroad.com",
            "https://www.youtube.com",
            "https://player.vimeo.com",
          ],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: isProduction ? [] : undefined,
        },
      },
      crossOriginEmbedderPolicy: false, // Disabled for compatibility
      crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
    },
    cors: {
      origin: corsOrigin,
      credentials: true,
      optionsSuccessStatus: 200,
    },
  };
}

/**
 * Configure security middleware
 */
export function configureSecurityMiddleware(app: Express): void {
  const config = getSecurityConfig();
  const isProduction = process.env.NODE_ENV === 'production';

  logger.info('Configuring security middleware', {
    environment: process.env.NODE_ENV,
    corsOrigin: config.cors.origin,
    rateLimitWindow: config.rateLimit.windowMs,
    rateLimitMax: config.rateLimit.maxRequests,
  });

  // Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? config.helmet.contentSecurityPolicy : false,
      crossOriginEmbedderPolicy: config.helmet.crossOriginEmbedderPolicy,
      crossOriginOpenerPolicy: config.helmet.crossOriginOpenerPolicy,
      crossOriginResourcePolicy: config.helmet.crossOriginResourcePolicy,
      hsts: isProduction ? config.helmet.hsts : false,
      // Disable noSniff in development for better debugging
      noSniff: isProduction,
    })
  );

  // Additional security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // Enable XSS filtering
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Permissions policy (formerly Feature Policy)
    res.setHeader('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=()');

    next();
  });
}

/**
 * Configure rate limiting
 */
export function configureRateLimiting(app: Express): void {
  const config = getSecurityConfig();

  // General rate limiting
  const generalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      error: 'Too many requests',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
    },
    standardHeaders: config.rateLimit.standardHeaders,
    legacyHeaders: config.rateLimit.legacyHeaders,
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path.startsWith('/health') || req.path.startsWith('/api/health');
    },
    keyGenerator: (req: Request): string => {
      // Use X-Forwarded-For header if behind proxy, otherwise use remoteAddress
      return req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
    },
    onLimitReached: (req: Request) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });
    },
  });

  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
      error: 'Too many authentication attempts',
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: 900, // 15 minutes
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful auth attempts
    onLimitReached: (req: Request) => {
      logger.warn('Auth rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
    },
  });

  // API-specific rate limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Higher limit for API endpoints
    message: {
      error: 'API rate limit exceeded',
      message: 'Too many API requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      // Skip for health checks and webhooks
      return req.path.startsWith('/health') || 
             req.path.startsWith('/api/health') ||
             req.path.startsWith('/api/webhooks');
    },
  });

  // Search rate limiting (prevent abuse)
  const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 searches per minute
    message: {
      error: 'Search rate limit exceeded',
      message: 'Too many search requests, please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting
  app.use(generalLimiter);
  app.use('/api/auth', authLimiter);
  app.use('/auth', authLimiter);
  app.use('/api', apiLimiter);
  app.use('/api/search', searchLimiter);
  app.use('/api/terms/search', searchLimiter);

  logger.info('Rate limiting configured', {
    generalLimit: config.rateLimit.maxRequests,
    authLimit: 5,
    apiLimit: 1000,
    searchLimit: 60,
  });
}

/**
 * Configure CORS
 */
export function configureCORS(app: Express): void {
  const config = getSecurityConfig();

  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    const allowedOrigins = Array.isArray(config.cors.origin) 
      ? config.cors.origin 
      : [config.cors.origin as string];

    // Check if origin is allowed
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (config.cors.origin === true) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    if (config.cors.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(config.cors.optionsSuccessStatus).end();
      return;
    }

    next();
  });

  logger.info('CORS configured', {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  });
}

/**
 * Input validation and sanitization middleware
 */
export function configureInputValidation(app: Express): void {
  // Middleware to limit request body size
  app.use((req: Request, res: Response, next: NextFunction) => {
    const maxSize = parseInt(process.env.MAX_REQUEST_SIZE || '1048576'); // 1MB default
    
    if (req.headers['content-length'] && 
        parseInt(req.headers['content-length']) > maxSize) {
      return res.status(413).json({
        error: 'Request too large',
        message: 'Request body exceeds maximum size limit',
      });
    }
    
    next();
  });

  // Middleware to validate and sanitize common parameters
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Sanitize query parameters
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        // Remove potentially dangerous characters
        req.query[key] = (req.query[key] as string)
          .replace(/[<>'"]/g, '')
          .trim();
      }
    });

    next();
  });

  logger.info('Input validation configured');
}

/**
 * Security monitoring middleware
 */
export function configureSecurityMonitoring(app: Express): void {
  // Log suspicious requests
  app.use((req: Request, res: Response, next: NextFunction) => {
    const suspiciousPatterns = [
      /\.\./,           // Directory traversal
      /<script/i,       // XSS attempts
      /union.*select/i, // SQL injection
      /base64_decode/i, // Code injection
      /eval\(/i,        // Code execution
    ];

    const requestData = JSON.stringify({
      url: req.url,
      query: req.query,
      body: req.body,
      headers: req.headers,
    });

    const isSuspicious = suspiciousPatterns.some(pattern => 
      pattern.test(requestData)
    );

    if (isSuspicious) {
      logger.warn('Suspicious request detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  });

  logger.info('Security monitoring configured');
}

/**
 * Complete security setup for production
 */
export function setupProductionSecurity(app: Express): void {
  logger.info('Setting up production security...');

  // Configure all security middleware
  configureSecurityMiddleware(app);
  configureRateLimiting(app);
  configureCORS(app);
  configureInputValidation(app);
  configureSecurityMonitoring(app);

  logger.info('Production security setup completed');
}

/**
 * Security health check
 */
export function checkSecurityConfiguration(): {
  status: 'secure' | 'warnings' | 'insecure';
  checks: Array<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
  }>;
} {
  const checks = [];
  
  // Check environment
  checks.push({
    name: 'Environment',
    status: process.env.NODE_ENV === 'production' ? 'pass' : 'warn',
    message: process.env.NODE_ENV === 'production' 
      ? 'Running in production mode' 
      : 'Not running in production mode',
  });

  // Check HTTPS
  checks.push({
    name: 'HTTPS',
    status: process.env.BASE_URL?.startsWith('https://') ? 'pass' : 'warn',
    message: process.env.BASE_URL?.startsWith('https://') 
      ? 'HTTPS configured' 
      : 'HTTPS not configured in BASE_URL',
  });

  // Check secrets
  checks.push({
    name: 'Session Secret',
    status: (process.env.SESSION_SECRET?.length || 0) >= 32 ? 'pass' : 'fail',
    message: (process.env.SESSION_SECRET?.length || 0) >= 32 
      ? 'Session secret is secure' 
      : 'Session secret is too short or missing',
  });

  checks.push({
    name: 'JWT Secret',
    status: (process.env.JWT_SECRET?.length || 0) >= 32 ? 'pass' : 'fail',
    message: (process.env.JWT_SECRET?.length || 0) >= 32 
      ? 'JWT secret is secure' 
      : 'JWT secret is too short or missing',
  });

  // Check CORS
  checks.push({
    name: 'CORS Origin',
    status: process.env.CORS_ORIGIN ? 'pass' : 'warn',
    message: process.env.CORS_ORIGIN 
      ? 'CORS origin configured' 
      : 'CORS origin not specifically configured',
  });

  // Determine overall status
  const hasFailures = checks.some(check => check.status === 'fail');
  const hasWarnings = checks.some(check => check.status === 'warn');

  const status = hasFailures ? 'insecure' : hasWarnings ? 'warnings' : 'secure';

  return { status, checks };
}