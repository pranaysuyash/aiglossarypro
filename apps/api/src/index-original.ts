import { log } from './utils/logger';
import { validateEnvironment, printValidationResult } from '@aiglossarypro/config';

// Add process error handlers first
process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Add startup timestamp
console.log(`[STARTUP] ${new Date().toISOString()} - Node.js process started`);
console.log(`[STARTUP] Node version: ${process.version}`);
console.log(`[STARTUP] Platform: ${process.platform}`);
console.log(`[STARTUP] Current directory: ${process.cwd()}`);

// Import database module early (won't crash now)
import { pool, initializeDatabase as initDB } from '@aiglossarypro/database';

// Defer all initialization until after server starts
let isInitialized = false;

async function initializeServices() {
  if (isInitialized) return;
  
  console.log(`[INIT] ${new Date().toISOString()} - Starting deferred initialization...`);
  
  // Validate environment
  const envValidation = validateEnvironment();
  printValidationResult(envValidation);
  
  if (!envValidation.isValid) {
    log.warn('Environment validation failed:', envValidation.errors);
  }
  
  // Initialize and test database
  try {
    if (process.env.DATABASE_URL) {
      console.log(`[DB] Initializing database connection...`);
      initDB(); // Initialize the real database instances
      
      await pool.connect();
      console.log(`[DB] ${new Date().toISOString()} - Database connected successfully`);
    } else {
      console.warn('[DB] DATABASE_URL not set, skipping database connection');
    }
  } catch (error: any) {
    console.error('[DB] Database initialization failed:', error);
  }
  
  isInitialized = true;
  console.log(`[INIT] ${new Date().toISOString()} - Deferred initialization complete`);
}

// Only log Firebase config status in development (never log actual values)
if (process.env.NODE_ENV !== 'production') {
  log.info('🔍 Development - Firebase Environment Check:');
  log.info('- FIREBASE_PROJECT_ID:', { status: process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing' });
  log.info(
    '- FIREBASE_CLIENT_EMAIL:',
    { status: process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing' }
  );
  log.info(
    '- FIREBASE_PRIVATE_KEY_BASE64:',
    { status: process.env.FIREBASE_PRIVATE_KEY_BASE64 ? '✅ Set' : '❌ Missing' }
  );
}

const firebaseEnabled = !!(
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  (process.env.FIREBASE_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY_BASE64)
);

// Only log status in development
if (process.env.NODE_ENV !== 'production') {
  log.info('- Firebase Auth Enabled:', { enabled: firebaseEnabled ? '✅ TRUE' : '❌ FALSE' });
}

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
import { serveStatic, _setupVite } from './vite-setup';

const app = express();

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

async function startServer() {
  console.log(`[INIT] ${new Date().toISOString()} - Starting server function...`);
  
  // Skip all initialization on startup - will be done after server starts

  // Load and validate configuration
  logConfigStatus();

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
      // In production, allow server to start without auth for health checks
      if (process.env.NODE_ENV === 'production') {
        log.warn('⚠️ WARNING: No authentication method configured in production');
        log.warn('⚠️ Server will start but authentication endpoints will not work');
      } else {
        log.error('❌ CRITICAL SECURITY ERROR: No valid authentication method configured');
        log.error('❌ Configure Firebase Auth or Simple Auth before starting server');
        throw new Error(
          'No valid authentication method configured. Server startup aborted for security.'
        );
      }
    }
  } catch (error: any) {
    if (process.env.NODE_ENV === 'production') {
      log.error('❌ Error setting up authentication in production, continuing...', {
        error: error instanceof Error ? error.message : String(error),
      });
    } else {
      log.error('❌ Error setting up authentication', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
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
    } catch (error: any) {
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
    } catch (error: any) {
      log.warn('⚠️ Static file serving setup failed, continuing with API only', {
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't exit - API can still work without frontend
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
  } catch (error: any) {
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

  console.log(`[INIT] ${new Date().toISOString()} - Starting HTTP server on ${host}:${port}`);
  
  server.listen(port, host, async () => {
    console.log(`[HTTP] ${new Date().toISOString()} - Server listening on ${host}:${port}`);
    log.info(`🚀 Server running on http://${host}:${port} in ${serverConfig.nodeEnv} mode`);
    log.info(`🔍 Server address: ${JSON.stringify(server.address())}`);
    log.info(`🛡️  Error handling and monitoring enabled`);
    
    // Now perform deferred initialization after server is running
    console.log(`[INIT] ${new Date().toISOString()} - Server is up, performing deferred initialization...`);
    await initializeServices();
    console.log(`[INIT] ${new Date().toISOString()} - Server fully initialized and ready`);
  });
  
  // Setup graceful shutdown
  gracefulShutdown(server);

  server.on('error', (err: Error) => {
    log.error('❌ Server error', { error: err.message, stack: err.stack });
  });

  // TODO: Implement automatic Excel data loading if needed
  // For now, use the admin endpoint /api/admin/import/force-reprocess
  log.info('🚀 Server ready. Use admin endpoint for Excel data processing.');
}

// Startup timeout guard
const startupTimeout = setTimeout(() => {
  console.error('[FATAL] Startup timed out after 30 seconds');
  process.exit(1);
}, 30000);

// Start the server
startServer()
  .then(() => {
    clearTimeout(startupTimeout);
    console.log(`[STARTUP] ${new Date().toISOString()} - Server startup completed successfully`);
  })
  .catch((error) => {
    console.error('[FATAL] Failed to start server:', error);
    process.exit(1);
  });
