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
import { features } from "./config";
import { setupMultiAuth } from "./middleware/multiAuth";
import { initS3Client } from "./s3Service";
import { setupMockAuth } from "./middleware/dev/mockAuth";
import { registerSimpleAuthRoutes } from "./routes/simpleAuth";
import { registerFirebaseAuthRoutes } from "./routes/firebaseAuth";
import { securityHeaders, sanitizeRequest, securityMonitoring, apiRateLimit, corsMiddleware } from "./middleware/security";
import { errorHandler, notFoundHandler, gracefulShutdown } from "./middleware/errorHandler";
import { 
  performanceTrackingMiddleware, 
  pageViewTrackingMiddleware, 
  searchTrackingMiddleware,
  systemHealthMiddleware,
  initializeAnalytics 
} from "./middleware/analyticsMiddleware";
import loggingMiddleware from "./middleware/loggingMiddleware";
import { responseLoggingMiddleware } from "./middleware/responseLogging";
import { log as logger } from "./utils/logger";
import { performanceMiddleware } from "./middleware/compression";
import { setupCacheMonitoring } from "./monitoring/cacheMonitoring";
import { cacheStatsMiddleware } from "./middleware/queryCache";
import { cdnCacheMiddleware } from "./middleware/cdnCache";

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
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(sanitizeRequest);
app.use(securityMonitoring);
app.use('/api/', apiRateLimit);

// Apply analytics middleware
app.use(performanceTrackingMiddleware());
app.use(pageViewTrackingMiddleware());
app.use(searchTrackingMiddleware());
app.use(systemHealthMiddleware());

// Apply compression and performance middleware
app.use(performanceMiddleware());

// Apply CDN cache middleware for static assets
app.use(cdnCacheMiddleware);

// Apply cache stats middleware
app.use(cacheStatsMiddleware);

// Apply response logging middleware
app.use(responseLoggingMiddleware);

(async () => {
  // Load and validate configuration
  logConfigStatus();
  
  // Setup authentication based on configuration priority
  try {
    if (features.firebaseAuthEnabled) {
      // Firebase auth takes priority - provides Google, GitHub, email/password
      registerFirebaseAuthRoutes(app);
      logger.info("✅ Firebase authentication setup complete (Google, GitHub, Email/Password)");
    } else if (features.simpleAuthEnabled) {
      // Fallback to simple JWT + OAuth
      await setupMultiAuth(app);
      registerSimpleAuthRoutes(app);
      logger.info("✅ Simple JWT + OAuth authentication setup complete");
    } else {
      // Development mock auth
      setupMockAuth(app);
      logger.info("✅ Mock authentication setup complete (development mode)");
    }
  } catch (error) {
    logger.error("❌ Error setting up authentication", { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
  
  // Initialize S3 client if credentials are present
  if (features.s3Enabled) {
    initS3Client();
    logger.info("✅ S3 client initialized");
  }
  
  await registerRoutes(app);

  // Get server configuration
  const serverConfig = getServerConfig();

  // Use configurable port
  const port = serverConfig.port;
  
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

  
  // Initialize job queue system
  try {
    const { jobQueueManager } = await import("./jobs/queue");
    await jobQueueManager.initialize();
    logger.info("✅ Job queue system initialized");
  } catch (error) {
    logger.error("❌ Error initializing job queue system", { error: error instanceof Error ? error.message : String(error) });
    // Don't exit on job queue failure - app can still function without it
    logger.warn("⚠️ Continuing without job queue system");
  }
  
  // Initialize analytics system
  await initializeAnalytics();
  
  // Initialize cache monitoring
  setupCacheMonitoring(app);
  logger.info("✅ Cache monitoring system initialized");
  
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
