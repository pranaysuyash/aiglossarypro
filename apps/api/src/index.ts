// Load environment variables first - must be before any other imports
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Try multiple locations for .env file in monorepo structure
const envPaths = [
  path.resolve(__dirname, '../../../.env'),  // From dist/ to project root
  path.resolve(process.cwd(), '.env'),        // From current working directory
  path.resolve(__dirname, '../../.env'),      // Alternative path
];

let envLoaded = false;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    console.log(`📁 Loading environment from: ${envPath}`);
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️  No .env file found, using process environment variables');
}

console.log('🚀 [DEBUG] Server index.ts loaded - very first line');

import { log } from './utils/logger';

console.log('🚀 [DEBUG] Server index.ts started - after imports');

log.info('FIREBASE_PROJECT_ID:', { value: process.env.FIREBASE_PROJECT_ID });
log.info('FIREBASE_CLIENT_EMAIL:', { value: process.env.FIREBASE_CLIENT_EMAIL });
log.info(
  'FIREBASE_PRIVATE_KEY_BASE64:',
  { value: process.env.FIREBASE_PRIVATE_KEY_BASE64 ? 'set' : 'not set' }
);

// Debug: Check Firebase environment variables at server startup
log.info('🔍 Server Startup - Firebase Environment Check:');
log.info('- FIREBASE_PROJECT_ID:', { status: process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing' });
log.info(
  '- FIREBASE_CLIENT_EMAIL:',
  { status: process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing' }
);
log.info(
  '- FIREBASE_PRIVATE_KEY_BASE64:',
  { status: process.env.FIREBASE_PRIVATE_KEY_BASE64 ? '✅ Set' : '❌ Missing' }
);
const firebaseEnabled = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY_BASE64)
);
log.info('- Firebase Auth Enabled:', { enabled: firebaseEnabled ? '✅ TRUE' : '❌ FALSE' });

// Initialize error monitoring first
import {
  initSentry,
  sentryErrorHandler,
  sentryRequestHandler,
  sentryTracingHandler,
} from './utils/sentry';

// Only initialize Sentry in production to avoid native module issues
if (process.env.NODE_ENV === 'production') {
  initSentry();
}

import express from 'express';
import expressWs from 'express-ws';
// import { smartLoadExcelData } from "./smartExcelLoader";
import { features, getServerConfig, logConfigStatus } from '@aiglossarypro/config';
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

import { responseLoggingMiddleware } from './middleware/responseLogging';
import {
  apiRateLimit,
  corsMiddleware,
  sanitizeRequest,
  securityHeaders,
  securityMonitoring,
} from './middleware/security';

import { registerFirebaseAuthRoutes } from './routes/firebaseAuth';
import { registerRoutes } from './routes/index';
import { registerSimpleAuthRoutes } from './routes/simpleAuth';
import { registerLocationRoutes } from './routes/location';
import { initS3Client } from './s3Service';
import { setupSwagger } from './swagger/setup';
import { serveStatic, setupVite } from './vite';

const app = express();
const wsInstance = expressWs(app);

// Export app for testing
export { app };

log.info('Express app created successfully');

// Sentry request handling (must be first)
if (process.env.NODE_ENV === 'production') {
  app.use(sentryRequestHandler());
  app.use(sentryTracingHandler());
}

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


// Apply response logging middleware
// Commented out to prevent duplicate logging - loggingMiddleware already handles this
// app.use(responseLoggingMiddleware);

console.log('🚀 [DEBUG] About to enter async IIFE');
(async () => {
  console.log('🚀 [DEBUG] Inside async IIFE');
  // Load and validate configuration
  logConfigStatus();
  console.log('🚀 [DEBUG] Config logged');

  // Setup authentication based on configuration priority
  try {
    if (features.firebaseAuthEnabled) {
      // Firebase auth takes priority - provides Google, GitHub, email/password
      registerFirebaseAuthRoutes(app);
      log.info('✅ Firebase authentication setup complete (Google, GitHub, Email/Password)');
    } else if (features.simpleAuthEnabled) {
      // Fallback to simple JWT + OAuth
      await setupMultiAuth(app);
      registerSimpleAuthRoutes(app);
      log.info('✅ Simple JWT + OAuth authentication setup complete');
    } else {
      // SECURITY: No fallback to mock authentication
      log.error('❌ CRITICAL SECURITY ERROR: No valid authentication method configured');
      log.error('❌ Configure Firebase Auth or Simple Auth before starting server');
      log.error('❌ Mock authentication has been disabled for security');
      throw new Error(
        'No valid authentication method configured. Server startup aborted for security.'
      );
    }
  } catch (error) {
    log.error('❌ Error setting up authentication', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  // Initialize S3 client if credentials are present
  if (features.s3Enabled) {
    initS3Client();
    log.info('✅ S3 client initialized');
  }

  // Add health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime()
    });
  });
  log.info('✅ Health check endpoint registered at /health');

  // Register location routes (needed for country pricing)
  registerLocationRoutes(app);
  log.info('✅ Location routes registered');

  await registerRoutes(app);
  log.info('✅ API routes registered');

  // Setup Swagger API documentation
  setupSwagger(app);
  log.info('✅ Swagger API documentation available at /api/docs');

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
        log.info('✅ HTTP/2 server with TLS enabled');
      } else {
        // Fallback to HTTP/1.1 if no SSL certificates
        const { createServer } = await import('node:http');
        server = createServer(app);
        log.warn('⚠️ SSL certificates not found, falling back to HTTP/1.1');
        log.info(
          '💡 To enable HTTP/2, set SSL_KEY_PATH and SSL_CERT_PATH environment variables'
        );
      }
    } catch (error) {
      // Fallback to HTTP/1.1 if HTTP/2 setup fails
      const { createServer } = await import('node:http');
      server = createServer(app);
      log.warn('⚠️ HTTP/2 setup failed, falling back to HTTP/1.1', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  } else {
    // Use HTTP/1.1 in development for better debugging
    const { createServer } = await import('node:http');
    server = createServer(app);
    log.info('🔧 HTTP/1.1 server for development (better debugging)');
  }

  // Setup Vite dev server in development (only if not using separate frontend server), static files in production
  if (serverConfig.nodeEnv === 'development' && !process.env.SEPARATE_FRONTEND_SERVER) {
    // Skip Vite setup in monorepo - frontend runs separately
    log.info('🔧 Development mode: Backend serves API only, frontend runs on separate Vite server');
  } else if (serverConfig.nodeEnv === 'production') {
    log.info('📦 Setting up static file serving for production...');
    try {
      serveStatic(app);
      log.info('✅ Static file serving setup complete');
    } catch (error) {
      log.error('❌ Error setting up static file serving', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      process.exit(1);
    }
  }

  // Add logging error handler
  app.use(loggingMiddleware.errorLogging);

  // Add Sentry error handler
  if (process.env.NODE_ENV === 'production') {
    app.use(sentryErrorHandler());
  }

  // Add 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Add comprehensive error handling middleware
  app.use(errorHandler);

  // Initialize job queue system
  try {
    const { jobQueueManager } = await import('./jobs/queue');
    await jobQueueManager.initialize();
    log.info('✅ Job queue system initialized');
  } catch (error) {
    log.error('❌ Error initializing job queue system', {
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't exit on job queue failure - app can still function without it
    log.warn('⚠️ Continuing without job queue system');
  }

  // Initialize analytics system
  await initializeAnalytics();

  // Initialize cache monitoring
  

  // Start listening - use 0.0.0.0 in production for external access
  const host = serverConfig.nodeEnv === 'production' ? '0.0.0.0' : '127.0.0.1';

  log.info(`Attempting to start server on ${host}:${port}...`);
  
  server.listen(port, host, () => {
    log.info(`🚀 Server running on http://${host}:${port} in ${serverConfig.nodeEnv} mode`);
    log.info(`🔍 Server address: ${JSON.stringify(server.address())}`);
    log.info(`🛡️  Error handling and monitoring enabled`);
  });
  
  // Add error handlers to prevent crash
  process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Setup graceful shutdown
  gracefulShutdown(server);

  server.on('error', (err: Error) => {
    log.error('❌ Server error', { error: err.message, stack: err.stack });
  });

  // TODO: Implement automatic Excel data loading if needed
  // For now, use the admin endpoint /api/admin/import/force-reprocess
  log.info('🚀 Server ready. Use admin endpoint for Excel data processing.');
})();
