import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { log, performanceTimer } from '../utils/logger';
import { captureAPIError, addBreadcrumb } from '../utils/sentry';

// Extend Request interface to include logging context
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      userId?: string;
    }
  }
}

// Request ID middleware - assigns unique ID to each request
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.requestId = uuidv4();
  if (!req.startTime) {
    req.startTime = Date.now();
  }
  
  // Add request ID to response headers for debugging
  res.setHeader('X-Request-ID', req.requestId);
  
  next();
};

// Request logging middleware
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const timer = performanceTimer(`${req.method} ${req.path}`);
  
  // Extract user ID from session if available
  req.userId = (req.session as any)?.user?.id || (req.user as any)?.id;
  
  // Log incoming request
  log.api.request(
    req.method,
    req.path,
    req.userId,
    {
      requestId: req.requestId,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      queryParams: Object.keys(req.query).length > 0 ? req.query : undefined,
      bodySize: req.get('Content-Length') ? parseInt(req.get('Content-Length')!) : undefined
    }
  );
  
  // Add breadcrumb for Sentry
  addBreadcrumb(
    `${req.method} ${req.path}`,
    'http',
    'info',
    {
      requestId: req.requestId,
      userId: req.userId
    }
  );
  
  // Override res.json to capture response data
  const originalJson = res.json;
  res.json = function(body: any) {
    const duration = timer.end({
      requestId: req.requestId,
      statusCode: res.statusCode,
      responseSize: Buffer.byteLength(JSON.stringify(body))
    });
    
    // Log response
    log.api.response(
      req.method,
      req.path,
      res.statusCode,
      duration,
      {
        requestId: req.requestId,
        userId: req.userId,
        responseSize: Buffer.byteLength(JSON.stringify(body))
      }
    );
    
    return originalJson.call(this, body);
  };
  
  // Override res.send to capture non-JSON responses
  const originalSend = res.send;
  res.send = function(body: any) {
    if (!res.headersSent) {
      const duration = timer.end({
        requestId: req.requestId,
        statusCode: res.statusCode,
        responseSize: body ? Buffer.byteLength(body.toString()) : 0
      });
      
      log.api.response(
        req.method,
        req.path,
        res.statusCode,
        duration,
        {
          requestId: req.requestId,
          userId: req.userId,
          responseSize: body ? Buffer.byteLength(body.toString()) : 0
        }
      );
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};

// Error logging middleware
export const errorLoggingMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log the error
  log.api.error(
    req.method,
    req.path,
    err,
    {
      requestId: req.requestId,
      userId: req.userId,
      stack: err.stack,
      body: req.body,
      params: req.params,
      query: req.query
    }
  );
  
  // Capture in Sentry
  captureAPIError(err, {
    method: req.method,
    path: req.path,
    userId: req.userId,
    requestId: req.requestId,
    body: req.body
  });
  
  // Don't call next() here - let the error handler deal with the response
  next(err);
};

// Rate limiting logging middleware
export const rateLimitLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const originalEnd = res.end.bind(res);
  
  (res as any).end = function(chunk?: any, encoding?: BufferEncoding): any {
    // Check if this was a rate limit response
    if (res.statusCode === 429) {
      log.security.rateLimitExceeded(
        req.userId || 'anonymous',
        req.path,
        parseInt(res.get('X-RateLimit-Limit') || '0')
      );
    }
    
    // Call original end function with proper parameters
    if (chunk !== undefined && encoding !== undefined) {
      return originalEnd.call(this, chunk, encoding);
    } else if (chunk !== undefined) {
      return originalEnd.call(this, chunk);
    } else {
      return originalEnd.call(this);
    }
  };
  
  next();
};

// Security event logging middleware
export const securityLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//g, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /eval\(/i, // Code injection
    /javascript:/i // Javascript protocol
  ];
  
  const checkString = `${req.url} ${JSON.stringify(req.body)} ${JSON.stringify(req.query)}`;
  
  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(checkString)) {
      log.security.suspiciousActivity(
        req.userId || 'anonymous',
        `Suspicious pattern detected: ${pattern.source}`,
        {
          requestId: req.requestId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method
        }
      );
    }
  });
  
  next();
};

// Health check middleware (lighter logging for health endpoints)
export const healthCheckLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.path.includes('/health') || req.path.includes('/ping')) {
    // Minimal logging for health checks to avoid noise
    const timer = performanceTimer(`Health Check: ${req.path}`);
    
    const originalJson = res.json;
    res.json = function(body: any) {
      timer.end();
      return originalJson.call(this, body);
    };
  }
  
  next();
};

// User context middleware (for logging user info)
export const userContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const sessionUser = (req.session as any)?.user;
  const authUser = req.user as any;
  
  if (sessionUser || authUser) {
    req.userId = sessionUser?.id || authUser?.id || authUser?.claims?.sub;
    
    // Add user context to logs
    addBreadcrumb(
      'User context set',
      'auth',
      'info',
      {
        userId: req.userId,
        email: sessionUser?.email || authUser?.email || authUser?.claims?.email
      }
    );
  }
  
  next();
};

// Performance monitoring middleware
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log slow requests (>1 second)
    if (duration > 1000) {
      log.warn(`Slow request detected: ${req.method} ${req.path}`, {
        duration,
        requestId: req.requestId,
        userId: req.userId,
        statusCode: res.statusCode
      });
    }
    
    // Log very slow requests (>5 seconds) as errors
    if (duration > 5000) {
      log.error(`Very slow request: ${req.method} ${req.path}`, {
        duration,
        requestId: req.requestId,
        userId: req.userId,
        statusCode: res.statusCode
      });
    }
  });
  
  next();
};

export default {
  requestId: requestIdMiddleware,
  requestLogging: requestLoggingMiddleware,
  errorLogging: errorLoggingMiddleware,
  rateLimitLogging: rateLimitLoggingMiddleware,
  securityLogging: securityLoggingMiddleware,
  healthCheckLogging: healthCheckLoggingMiddleware,
  userContext: userContextMiddleware,
  performance: performanceMiddleware
};