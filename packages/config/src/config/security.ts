/**
 * Security Configuration for Production
 * Implements security headers, rate limiting, and security best practices
 */

import type { Application, RequestHandler } from 'express';
// Note: express-rate-limit is available at runtime but not at build time
// This module is used by the main app which has the dependency
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
            'https://fonts.googleapis.com',
            'https://cdn.jsdelivr.net',
          ],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // Required for some React functionality
            'https://www.googletagmanager.com',
            'https://www.google-analytics.com',
            'https://gumroad.com',
            'https://assets.gumroad.com',
          ],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          connectSrc: [
            "'self'",
            'https://api.openai.com',
            'https://www.google-analytics.com',
            'https://analytics.google.com',
            'https://app.posthog.com',
            'https://o4504609969086464.ingest.sentry.io',
            'wss://aiglossarypro.com',
            'ws://localhost:*', // Development WebSocket
          ],
          frameSrc: [
            "'self'",
            'https://gumroad.com',
            'https://www.youtube.com',
            'https://player.vimeo.com',
          ],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: isProduction ? [] : undefined as any,
        },
      },
      crossOriginEmbedderPolicy: false, // Disabled for compatibility
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' as const },
      crossOriginResourcePolicy: { policy: 'cross-origin' as const },
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
export function configureSecurityMiddleware(app: Application): void {
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
      crossOriginOpenerPolicy: config.helmet.crossOriginOpenerPolicy as any,
      crossOriginResourcePolicy: config.helmet.crossOriginResourcePolicy as any,
      hsts: isProduction ? config.helmet.hsts : false,
      // Disable noSniff in development for better debugging
      noSniff: isProduction,
    })
  );

  // Additional security headers
  const securityHeadersMiddleware: RequestHandler = (_req, res, next) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // Enable XSS filtering
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy (formerly Feature Policy)
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

    next();
  };
  app.use(securityHeadersMiddleware);
}

/**
 * Configure rate limiting
 * Note: This function requires express-rate-limit to be available at runtime
 */
export function configureRateLimiting(_app: Application): void {
  // This function will be implemented at runtime when express-rate-limit is available
  // The actual implementation is moved to the main app where dependencies are available
  logger.info('Rate limiting configuration deferred to main app');
}

/**
 * Configure CORS
 */
export function configureCORS(app: Application): void {
  const config = getSecurityConfig();

  const corsMiddleware: RequestHandler = (req, res, next) => {
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
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token'
    );
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(config.cors.optionsSuccessStatus).end();
      return;
    }

    next();
  };
  app.use(corsMiddleware);

  logger.info('CORS configured', {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  });
}

/**
 * Input validation and sanitization middleware
 */
export function configureInputValidation(app: Application): void {
  // Middleware to limit request body size
  const bodySizeMiddleware: RequestHandler = (req, res, next) => {
    const maxSize = parseInt(process.env.MAX_REQUEST_SIZE || '1048576'); // 1MB default

    if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
      return res.status(413).json({
        error: 'Request too large',
        message: 'Request body exceeds maximum size limit',
      });
    }

    next();
  };
  app.use(bodySizeMiddleware);

  // Middleware to validate and sanitize common parameters
  const sanitizeMiddleware: RequestHandler = (req, _res, next) => {
    // Sanitize query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string') {
          // Remove potentially dangerous characters
          req.query[key] = (req.query[key] as string).replace(/[<>'"]/g, '').trim();
        }
      });
    }

    next();
  };
  app.use(sanitizeMiddleware);

  logger.info('Input validation configured');
}

/**
 * Security monitoring middleware
 */
export function configureSecurityMonitoring(app: Application): void {
  // Log suspicious requests
  const monitoringMiddleware: RequestHandler = (req, _res, next) => {
    const suspiciousPatterns = [
      /\.\./, // Directory traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /base64_decode/i, // Code injection
      /eval\(/i, // Code execution
    ];

    const requestData = JSON.stringify({
      url: req.url || req.originalUrl,
      query: req.query || {},
      body: (req as any).body || {},
      headers: req.headers || {},
    });

    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));

    if (isSuspicious) {
      logger.warn('Suspicious request detected', {
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.get('User-Agent') || req.headers['user-agent'],
        url: req.url || req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  };
  app.use(monitoringMiddleware);

  logger.info('Security monitoring configured');
}

/**
 * Complete security setup for production
 */
export function setupProductionSecurity(app: Application): void {
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
  const checks: { name: string; status: 'pass' | 'warn' | 'fail'; message: string }[] = [];

  // Check environment
  checks.push({
    name: 'Environment',
    status: process.env.NODE_ENV === 'production' ? 'pass' : 'warn',
    message:
      process.env.NODE_ENV === 'production'
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
    message:
      (process.env.SESSION_SECRET?.length || 0) >= 32
        ? 'Session secret is secure'
        : 'Session secret is too short or missing',
  });

  checks.push({
    name: 'JWT Secret',
    status: (process.env.JWT_SECRET?.length || 0) >= 32 ? 'pass' : 'fail',
    message:
      (process.env.JWT_SECRET?.length || 0) >= 32
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
