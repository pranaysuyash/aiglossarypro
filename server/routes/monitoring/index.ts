import { Request, Response, Router } from 'express';
import { checkDatabaseHealth, getPoolMetrics } from '../../db-monitored';
import logger from '../../utils/logger';
import { adminAuth } from '../../middleware/adminAuth';

const router = Router();

// Pool metrics endpoint (admin only)
router.get('/pool', adminAuth, async (req: Request, res: Response) => {
  try {
    const metrics = getPoolMetrics();
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get pool metrics', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pool metrics'
    });
  }
});

// Database health endpoint (admin only) 
router.get('/database', adminAuth, async (req: Request, res: Response) => {
  try {
    const health = await checkDatabaseHealth();
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 503 : 500;
    
    res.status(statusCode).json({
      success: health.status !== 'critical',
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to check database health', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check database health'
    });
  }
});

// Combined system metrics
router.get('/system', adminAuth, async (req: Request, res: Response) => {
  try {
    const [poolMetrics, dbHealth] = await Promise.all([
      getPoolMetrics(),
      checkDatabaseHealth()
    ]);
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    
    // CPU usage (approximate)
    const cpuUsage = process.cpuUsage();
    
    res.json({
      success: true,
      data: {
        database: {
          pool: poolMetrics,
          health: dbHealth
        },
        system: {
          memory: {
            rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
            external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
          },
          cpu: {
            user: Math.round(cpuUsage.user / 1000) + ' ms',
            system: Math.round(cpuUsage.system / 1000) + ' ms'
          },
          uptime: Math.round(process.uptime()) + ' seconds',
          nodeVersion: process.version,
          platform: process.platform
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Failed to get system metrics', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system metrics'
    });
  }
});

// Real-time pool monitoring via SSE (Server-Sent Events)
router.get('/pool/stream', adminAuth, (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Send initial data
  res.write(`data: ${JSON.stringify(getPoolMetrics())}\n\n`);
  
  // Send updates every 5 seconds
  const interval = setInterval(() => {
    try {
      const metrics = getPoolMetrics();
      res.write(`data: ${JSON.stringify(metrics)}\n\n`);
    } catch (error) {
      logger.error('Error sending pool metrics', error);
    }
  }, 5000);
  
  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
});

export default router;