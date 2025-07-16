import { type Request, type Response, Router } from 'express';
import { safetyService } from '../../services/safetyService';
import { log as logger } from '../../utils/logger';

const router = Router();

// Get system status
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = safetyService.getSystemStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error getting system status:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// Get safety metrics
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = safetyService.getSafetyMetrics();
    res.json(metrics);
  } catch (error) {
    logger.error('Error getting safety metrics:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get safety metrics' });
  }
});

// Get safety limits
router.get('/limits', async (_req: Request, res: Response) => {
  try {
    const limits = safetyService.getSafetyLimits();
    res.json(limits);
  } catch (error) {
    logger.error('Error getting safety limits:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get safety limits' });
  }
});

// Update safety limits
router.put('/limits', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const limits = req.body;

    // Remove userId from limits object
    delete limits.userId;

    await safetyService.updateLimits(limits);

    logger.info('Safety limits updated', { userId, limits });
    res.json({ message: 'Safety limits updated successfully' });
  } catch (error) {
    logger.error('Error updating safety limits:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to update safety limits' });
  }
});

// Get active alerts
router.get('/alerts', async (_req: Request, res: Response) => {
  try {
    const alerts = safetyService.getActiveAlerts();
    res.json(alerts);
  } catch (error) {
    logger.error('Error getting alerts:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// Get all alerts
router.get('/alerts/all', async (_req: Request, res: Response) => {
  try {
    const alerts = safetyService.getAllAlerts();
    res.json(alerts);
  } catch (error) {
    logger.error('Error getting all alerts:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to get all alerts' });
  }
});

// Acknowledge alert
router.post('/alerts/:alertId/acknowledge', async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { userId } = req.body;

    await safetyService.acknowledgeAlert(alertId, userId);

    logger.info('Alert acknowledged', { alertId, userId });
    res.json({ message: 'Alert acknowledged successfully' });
  } catch (error) {
    logger.error('Error acknowledging alert:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Activate emergency stop
router.post('/emergency-stop', async (req: Request, res: Response) => {
  try {
    const { reason, userId } = req.body;

    if (!reason?.trim()) {
      return res.status(400).json({ error: 'Reason is required for emergency stop' });
    }

    await safetyService.activateEmergencyStop(reason, userId);

    logger.warn('Emergency stop activated via API', { reason, userId });
    res.json({ message: 'Emergency stop activated successfully' });
  } catch (error) {
    logger.error('Error activating emergency stop:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to activate emergency stop' });
  }
});

// Deactivate emergency stop
router.post('/emergency-stop/deactivate', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    await safetyService.deactivateEmergencyStop(userId);

    logger.info('Emergency stop deactivated via API', { userId });
    res.json({ message: 'Emergency stop deactivated successfully' });
  } catch (error) {
    logger.error('Error deactivating emergency stop:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to deactivate emergency stop' });
  }
});

// Check if operation can start
router.post('/operations/check', async (req: Request, res: Response) => {
  try {
    const { operationId, estimatedCost = 0 } = req.body;

    const result = await safetyService.canStartOperation(operationId, estimatedCost);

    res.json(result);
  } catch (error) {
    logger.error('Error checking operation permission:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to check operation permission' });
  }
});

// Start operation
router.post('/operations/start', async (req: Request, res: Response) => {
  try {
    const { operationId, estimatedCost = 0 } = req.body;

    await safetyService.startOperation(operationId, estimatedCost);

    logger.info('Operation started via API', { operationId, estimatedCost });
    res.json({ message: 'Operation started successfully' });
  } catch (error) {
    logger.error('Error starting operation:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res
      .status(500)
      .json({ error: error instanceof Error ? error.message : 'Failed to start operation' });
  }
});

// Stop operation
router.post('/operations/stop', async (req: Request, res: Response) => {
  try {
    const { operationId, reason = 'Manual stop' } = req.body;

    await safetyService.stopOperation(operationId, reason);

    logger.info('Operation stopped via API', { operationId, reason });
    res.json({ message: 'Operation stopped successfully' });
  } catch (error) {
    logger.error('Error stopping operation:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to stop operation' });
  }
});

// Track cost
router.post('/tracking/cost', async (req: Request, res: Response) => {
  try {
    const { operationId, cost } = req.body;

    if (!operationId || typeof cost !== 'number') {
      return res.status(400).json({ error: 'Operation ID and cost are required' });
    }

    await safetyService.trackCost(operationId, cost);

    res.json({ message: 'Cost tracked successfully' });
  } catch (error) {
    logger.error('Error tracking cost:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to track cost' });
  }
});

// Track quality
router.post('/tracking/quality', async (req: Request, res: Response) => {
  try {
    const { operationId, qualityScore } = req.body;

    if (!operationId || typeof qualityScore !== 'number') {
      return res.status(400).json({ error: 'Operation ID and quality score are required' });
    }

    await safetyService.trackQuality(operationId, qualityScore);

    res.json({ message: 'Quality tracked successfully' });
  } catch (error) {
    logger.error('Error tracking quality:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to track quality' });
  }
});

// Track failure
router.post('/tracking/failure', async (req: Request, res: Response) => {
  try {
    const { operationId, error } = req.body;

    if (!operationId || !error) {
      return res.status(400).json({ error: 'Operation ID and error are required' });
    }

    await safetyService.trackFailure(operationId, error);

    res.json({ message: 'Failure tracked successfully' });
  } catch (error) {
    logger.error('Error tracking failure:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to track failure' });
  }
});

// Reset daily metrics (for cron job)
router.post('/reset/daily', async (_req: Request, res: Response) => {
  try {
    safetyService.resetDailyMetrics();
    logger.info('Daily metrics reset via API');
    res.json({ message: 'Daily metrics reset successfully' });
  } catch (error) {
    logger.error('Error resetting daily metrics:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to reset daily metrics' });
  }
});

// Reset monthly metrics (for cron job)
router.post('/reset/monthly', async (_req: Request, res: Response) => {
  try {
    safetyService.resetMonthlyMetrics();
    logger.info('Monthly metrics reset via API');
    res.json({ message: 'Monthly metrics reset successfully' });
  } catch (error) {
    logger.error('Error resetting monthly metrics:', {
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Failed to reset monthly metrics' });
  }
});

export default router;
