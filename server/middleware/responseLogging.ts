import type { NextFunction, Request, Response } from 'express';
import { log as logger } from '../utils/logger';

/**
 * Response logging middleware that captures JSON responses and logs API requests
 * Extracted from server/index.ts for better modularity
 */
export function responseLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  // Override res.json to capture response data
  const originalResJson = res.json;
  res.json = (bodyJson, ...args) => {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;

    // Only log API requests
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // Truncate long log lines for readability
      if (logLine.length > 80) {
        logLine = `${logLine.slice(0, 79)}…`;
      }

      logger.info(logLine);
    }
  });

  next();
}
