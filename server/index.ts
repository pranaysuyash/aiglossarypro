import dotenv from "dotenv";
dotenv.config();

// Initialize error monitoring first
import { initSentry, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from "./utils/sentry";
initSentry();

import express, { type Request, Response, NextFunction } from "express";
import expressWs from "express-ws";
import { registerRoutes } from "./routes/index";
import { setupVite, serveStatic } from "./vite";
import { smartLoadExcelData } from "./smartExcelLoader";
import { getServerConfig, logConfigStatus } from "./config";
import { setupMultiAuth } from "./middleware/multiAuth";
import { securityHeaders, sanitizeRequest, securityMonitoring, apiRateLimit } from "./middleware/security";
import { errorHandler, notFoundHandler, gracefulShutdown } from "./middleware/errorHandler";
import { 
  performanceTrackingMiddleware, 
  pageViewTrackingMiddleware, 
  searchTrackingMiddleware,
  systemHealthMiddleware,
  initializeAnalytics 
} from "./middleware/analyticsMiddleware";
import loggingMiddleware from "./middleware/loggingMiddleware";
import { log as logger } from "./utils/logger";

const app = express();
const wsInstance = expressWs(app);

// Sentry request handling (must be first)
app.use(sentryRequestHandler());
app.use(sentryTracingHandler());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Apply logging middleware early
app.use(loggingMiddleware.requestId);
app.use(loggingMiddleware.userContext);
app.use(loggingMiddleware.healthCheckLogging);
app.use(loggingMiddleware.requestLogging);
app.use(loggingMiddleware.securityLogging);
app.use(loggingMiddleware.performance);

// Apply security middleware
app.use(securityHeaders);
app.use(sanitizeRequest);
app.use(securityMonitoring);
app.use('/api/', apiRateLimit);

// Apply analytics middleware
app.use(performanceTrackingMiddleware());
app.use(pageViewTrackingMiddleware());
app.use(searchTrackingMiddleware());
app.use(systemHealthMiddleware());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      logger.info(logLine);
    }
  });

  next();
});

(async () => {
  // Load and validate configuration
  logConfigStatus();
  
  // Setup multi-provider authentication
  await setupMultiAuth(app);
  
  await registerRoutes(app);

  // Get server configuration
  const serverConfig = getServerConfig();

  // Use configurable port (fallback to 5000 for Replit compatibility)
  const port = process.env.REPLIT_ENVIRONMENT ? 5000 : serverConfig.port;
  
  // Create HTTP server instance
  const { createServer } = await import('http');
  const server = createServer(app);
  
  // Setup Vite dev server in development, static files in production
  if (serverConfig.nodeEnv === "development") {
    logger.info("🔧 Setting up Vite dev server for development...");
    try {
      await setupVite(app, server);
      logger.info("✅ Vite dev server setup complete");
    } catch (error) {
      logger.error("❌ Error setting up Vite dev server", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      process.exit(1);
    }
  } else {
    logger.info("📦 Setting up static file serving for production...");
    try {
      serveStatic(app);
      logger.info("✅ Static file serving setup complete");
    } catch (error) {
      logger.error("❌ Error setting up static file serving", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      process.exit(1);
    }
  }
  
  // Add logging error handler
  app.use(loggingMiddleware.errorLogging);

  // Add Sentry error handler
  app.use(sentryErrorHandler());

  // Add 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Add comprehensive error handling middleware
  app.use(errorHandler);

  
  // Initialize analytics system
  await initializeAnalytics();
  
  // Start listening - use 0.0.0.0 in production for external access
  const host = serverConfig.nodeEnv === 'production' ? '0.0.0.0' : '127.0.0.1';
  
  server.listen(port, host, () => {
    logger.info(`🚀 Server running on http://${host}:${port} in ${serverConfig.nodeEnv} mode`);
    logger.info(`🔍 Server address: ${JSON.stringify(server.address())}`);
    logger.info(`🛡️  Error handling and monitoring enabled`);
  });

  // Setup graceful shutdown
  gracefulShutdown(server);

  server.on('error', (err) => {
    logger.error('❌ Server error', { error: err.message, stack: err.stack });
  });
    
  // TODO: Implement automatic Excel data loading if needed
  // For now, use the admin endpoint /api/admin/import/force-reprocess
  logger.info("🚀 Server ready. Use admin endpoint for Excel data processing.");
})();
