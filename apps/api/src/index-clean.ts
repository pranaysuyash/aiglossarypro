import express from 'express';
import { log } from './utils/logger';
import { bootstrap } from './bootstrap';

// Create express app
const app = express();

// Basic middleware
app.use(express.json());

// Health check - available immediately
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  });
});

// Start server first
const port = parseInt(process.env.PORT || '8080', 10);
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

const server = app.listen(port, host, async () => {
  console.log(`[HTTP] Server listening on ${host}:${port}`);
  log.info(`🚀 Server running on http://${host}:${port}`);
  
  // Now bootstrap all services
  try {
    await bootstrap();
    
    // Import and register routes after initialization
    const { registerRoutes } = await import('./routes/index');
    await registerRoutes(app);
    
    log.info('✅ All services initialized and routes registered');
  } catch (error: any) {
    log.error('Failed to bootstrap application:', error);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    log.info('Server closed');
    process.exit(0);
  });
});
