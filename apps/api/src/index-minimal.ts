// Minimal server that starts without any imports that could crash
import express from 'express';

console.log('[MINIMAL] Starting minimal server...');

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

const port = parseInt(process.env.PORT || '8080', 10);
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

const server = app.listen(port, host, async () => {
  console.log(`[HTTP] Server listening on ${host}:${port}`);
  
  // After server is up, start initialization
  setTimeout(async () => {
    console.log('[INIT] Starting deferred initialization...');
    
    try {
      // Dynamic imports to avoid early initialization
      const { initDatabase } = await import('@aiglossarypro/database');
      const { validateEnvironment, printValidationResult } = await import('@aiglossarypro/config');
      const { log } = await import('./utils/logger');
      
      // Validate environment
      const envValidation = validateEnvironment();
      printValidationResult(envValidation);
      
      // Initialize database
      if (process.env.DATABASE_URL) {
        await initDatabase();
        log.info('✅ Database initialized');
      }
      
      // Register routes
      const { registerRoutes } = await import('./routes/index');
      await registerRoutes(app);
      
      log.info('✅ All services initialized');
    } catch (error: any) {
      console.error('[INIT] Initialization error:', error);
    }
  }, 1000); // Wait 1 second after server starts
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    process.exit(0);
  });
});