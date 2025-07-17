import dotenv from 'dotenv';

dotenv.config();

console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log(
  'FIREBASE_PRIVATE_KEY_BASE64:',
  process.env.FIREBASE_PRIVATE_KEY_BASE64 ? 'set' : 'not set'
);

// Debug: Check Firebase environment variables at server startup
console.log('🔍 Server Startup - Firebase Environment Check:');
console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log(
  '- FIREBASE_CLIENT_EMAIL:',
  process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing'
);
console.log(
  '- FIREBASE_PRIVATE_KEY_BASE64:',
  process.env.FIREBASE_PRIVATE_KEY_BASE64 ? '✅ Set' : '❌ Missing'
);
const firebaseEnabled = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY_BASE64)
);
console.log('- Firebase Auth Enabled:', firebaseEnabled ? '✅ TRUE' : '❌ FALSE');

// Initialize error monitoring first
import {
  initSentry,
  sentryErrorHandler,
  sentryRequestHandler,
  sentryTracingHandler,
} from './utils/sentry';

initSentry();

import express from 'express';
import expressWs from 'express-ws';
// import { smartLoadExcelData } from "./smartExcelLoader";
import { features, getServerConfig, logConfigStatus } from './config';
import {
  initializeAnalytics,
  pageViewTrackingMiddleware,
  performanceTrackingMiddleware,
  searchTrackingMiddleware,
  systemHealthMiddleware,
} from './middleware/analyticsMiddleware';
import { cdnCacheMiddleware } from './middleware/cdnCache';
import { performanceMiddleware } from './middleware/compression';
// SECURITY: Mock authentication import removed for production safety
import { errorHandler, gracefulShutdown, notFoundHandler } from './middleware/errorHandler';
import loggingMiddleware from './middleware/loggingMiddleware';
import { setupMultiAuth } from './middleware/multiAuth';
import { cacheStatsMiddleware } from './middleware/queryCache';
import { responseLoggingMiddleware } from './middleware/responseLogging';
import {
  apiRateLimit,
  corsMiddleware,
  sanitizeRequest,
  securityHeaders,
  securityMonitoring,
} from './middleware/security';
import { setupCacheMonitoring } from './monitoring/cacheMonitoring';
import { registerFirebaseAuthRoutes } from './routes/firebaseAuth';
import { registerRoutes } from './routes/index';
import { registerSimpleAuthRoutes } from './routes/simpleAuth';
import { initS3Client } from './s3Service';
import { setupSwagger } from './swagger/setup';
import { log as logger } from './utils/logger';
import { serveStatic, setupVite } from './vite';

const app = express();
const wsInstance = expressWs(app);

// Export app for testing
export { app };

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
      logger.info('✅ Firebase authentication setup complete (Google, GitHub, Email/Password)');
    } else if (features.simpleAuthEnabled) {
      // Fallback to simple JWT + OAuth
      await setupMultiAuth(app);
      registerSimpleAuthRoutes(app);
      logger.info('✅ Simple JWT + OAuth authentication setup complete');
    } else {
      // SECURITY: No fallback to mock authentication
      logger.error('❌ CRITICAL SECURITY ERROR: No valid authentication method configured');
      logger.error('❌ Configure Firebase Auth or Simple Auth before starting server');
      logger.error('❌ Mock authentication has been disabled for security');
      throw new Error(
        'No valid authentication method configured. Server startup aborted for security.'
      );
    }
  } catch (error) {
    logger.error('❌ Error setting up authentication', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  // Initialize S3 client if credentials are present
  if (features.s3Enabled) {
    initS3Client();
    logger.info('✅ S3 client initialized');
  }

  await registerRoutes(app);
  logger.info('✅ API routes registered');

  // Setup Swagger API documentation
  setupSwagger(app);
  logger.info('✅ Swagger API documentation available at /api/docs');

  // Get server configuration
  const serverConfig = getServerConfig();

  // Use configurable port
  const port = serverConfig.port;

  // Create HTTP/2 server in production, HTTP/1.1 in development for better debugging
  let server: any;
  if (serverConfig.nodeEnv === 'production') {
    try {
      const { createSecureServer } = await import('node:http2');
      const fs = await import('node:fs');

      // Check if SSL certificates exist for HTTP/2
      const sslKeyPath = process.env.SSL_KEY_PATH;
      const sslCertPath = process.env.SSL_CERT_PATH;

      if (sslKeyPath && sslCertPath && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
        const options = {
          key: fs.readFileSync(sslKeyPath),
          cert: fs.readFileSync(sslCertPath),
          allowHTTP1: true, // Enable HTTP/1.1 fallback
        };

        server = createSecureServer(options, app as any);
        logger.info('✅ HTTP/2 server with TLS enabled');
      } else {
        // Fallback to HTTP/1.1 if no SSL certificates
        const { createServer } = await import('node:http');
        server = createServer(app);
        logger.warn('⚠️ SSL certificates not found, falling back to HTTP/1.1');
        logger.info(
          '💡 To enable HTTP/2, set SSL_KEY_PATH and SSL_CERT_PATH environment variables'
        );
      }
    } catch (error) {
      // Fallback to HTTP/1.1 if HTTP/2 setup fails
      const { createServer } = await import('node:http');
      server = createServer(app);
      logger.warn('⚠️ HTTP/2 setup failed, falling back to HTTP/1.1', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  } else {
    // Use HTTP/1.1 in development for better debugging
    const { createServer } = await import('node:http');
    server = createServer(app);
    logger.info('🔧 HTTP/1.1 server for development (better debugging)');
  }

  // Setup Vite dev server in development (only if not using separate frontend server), static files in production
  if (serverConfig.nodeEnv === 'development' && !process.env.SEPARATE_FRONTEND_SERVER) {
    logger.info('🔧 Setting up Vite dev server for development...');
    try {
      await setupVite(app, server);
      logger.info('✅ Vite dev server setup complete');
    } catch (error) {
      logger.error('❌ Error setting up Vite dev server', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    }
  } else if (serverConfig.nodeEnv === 'production') {
    logger.info('📦 Setting up static file serving for production...');
    try {
      serveStatic(app);
      logger.info('✅ Static file serving setup complete');
    } catch (error) {
      logger.error('❌ Error setting up static file serving', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    }
  } else {
    logger.info(
      '🔧 Development mode: Backend serves API only, frontend runs on separate Vite server'
    );
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
    const { jobQueueManager } = await import('./jobs/queue');
    await jobQueueManager.initialize();
    logger.info('✅ Job queue system initialized');
  } catch (error) {
    logger.error('❌ Error initializing job queue system', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't exit on job queue failure - app can still function without it
    logger.warn('⚠️ Continuing without job queue system');
  }

  // Initialize analytics system
  await initializeAnalytics();

  // Initialize cache monitoring
  setupCacheMonitoring(app);
  logger.info('✅ Cache monitoring system initialized');

  // Start listening - use 0.0.0.0 in production for external access
  const host = serverConfig.nodeEnv === 'production' ? '0.0.0.0' : '127.0.0.1';

  server.listen(port, host, () => {
    logger.info(`🚀 Server running on http://${host}:${port} in ${serverConfig.nodeEnv} mode`);
    logger.info(`🔍 Server address: ${JSON.stringify(server.address())}`);
    logger.info(`🛡️  Error handling and monitoring enabled`);
  });

  // Setup graceful shutdown
  gracefulShutdown(server);

  server.on('error', (err: Error) => {
    logger.error('❌ Server error', { error: err.message, stack: err.stack });
  });

  // TODO: Implement automatic Excel data loading if needed
  // For now, use the admin endpoint /api/admin/import/force-reprocess
  logger.info('🚀 Server ready. Use admin endpoint for Excel data processing.');
})();
