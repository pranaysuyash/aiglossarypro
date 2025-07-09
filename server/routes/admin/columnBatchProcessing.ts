/**
 * Column Batch Processing API Routes - Phase 2 Enhanced Content Generation System
 *
 * Comprehensive API endpoints for managing column-wise batch processing operations
 * with advanced monitoring, cost management, and safety controls.
 */

import { type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { JobPriority, JobType, jobQueueManager } from '../../jobs/queue';
import { requireAdmin } from '../../middleware/adminAuth';
import { validateRequest } from '../../middleware/validateRequest';
import { batchProgressTrackingService } from '../../services/batchProgressTrackingService';
import { batchSafetyControlsService } from '../../services/batchSafetyControlsService';
import { columnBatchProcessorService } from '../../services/columnBatchProcessorService';
import { costManagementService } from '../../services/costManagementService';
import { log as logger } from '../../utils/logger';

const router = Router();

// Validation schemas
const columnBatchRequestSchema = z.object({
  sectionName: z.string().min(1, 'Section name is required'),
  termIds: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  filterOptions: z
    .object({
      hasContent: z.boolean().optional(),
      isAiGenerated: z.boolean().optional(),
      verificationStatus: z.enum(['verified', 'unverified', 'needs_review']).optional(),
      lastUpdatedBefore: z
        .string()
        .transform((str) => new Date(str))
        .optional(),
      lastUpdatedAfter: z
        .string()
        .transform((str) => new Date(str))
        .optional(),
    })
    .optional(),
  processingOptions: z.object({
    batchSize: z.number().int().min(1).max(200),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().int().min(1).max(4000).optional(),
    regenerateExisting: z.boolean().default(false),
    pauseOnError: z.boolean().default(false),
    maxConcurrentBatches: z.number().int().min(1).max(5).default(2),
  }),
  costLimits: z
    .object({
      maxTotalCost: z.number().positive().optional(),
      maxCostPerTerm: z.number().positive().optional(),
      warningThreshold: z.number().min(0).max(100).optional(),
    })
    .optional(),
  notificationOptions: z
    .object({
      emailOnCompletion: z.boolean().default(false),
      webhookUrl: z.string().url().optional(),
      notifyOnMilestones: z.array(z.number().min(0).max(100)).optional(),
    })
    .optional(),
});

const costEstimationRequestSchema = z.object({
  sectionName: z.string().min(1, 'Section name is required'),
  termIds: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  filterOptions: z
    .object({
      hasContent: z.boolean().optional(),
      isAiGenerated: z.boolean().optional(),
      verificationStatus: z.enum(['verified', 'unverified', 'needs_review']).optional(),
      lastUpdatedBefore: z
        .string()
        .transform((str) => new Date(str))
        .optional(),
      lastUpdatedAfter: z
        .string()
        .transform((str) => new Date(str))
        .optional(),
    })
    .optional(),
  model: z.string().default('gpt-3.5-turbo'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).max(4000).default(1000),
});

// Apply admin authentication to all routes
router.use(requireAdmin);

/**
 * POST /api/admin/column-batch/estimate
 * Estimate cost and time for a batch operation
 */
router.post(
  '/estimate',
  validateRequest(costEstimationRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.uid || 'unknown';

      logger.info(`Cost estimation requested by ${userId}:`, {
        sectionName: req.body.sectionName,
        model: req.body.model,
      });

      // Create estimation job
      const jobId = await jobQueueManager.addJob(
        JobType.COLUMN_BATCH_ESTIMATION,
        {
          ...req.body,
          userId,
          requestId: `est-${Date.now()}`,
        },
        {
          priority: JobPriority.NORMAL,
          attempts: 3,
          timeout: 300000, // 5 minutes
        }
      );

      res.status(202).json({
        success: true,
        message: 'Cost estimation job started',
        jobId,
        estimatedCompletionTime: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
      });
    } catch (error) {
      logger.error('Error starting cost estimation:', {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        success: false,
        error: 'Failed to start cost estimation',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/admin/column-batch/estimate/:jobId
 * Get estimation job results
 */
router.get('/estimate/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const jobStatus = await jobQueueManager.getJobStatus(JobType.COLUMN_BATCH_ESTIMATION, jobId);

    if (!jobStatus) {
      return res.status(404).json({
        success: false,
        error: 'Estimation job not found',
      });
    }

    if (jobStatus.state === 'completed') {
      res.json({
        success: true,
        status: 'completed',
        result: jobStatus.result,
        completedAt: jobStatus.finishedOn,
      });
    } else if (jobStatus.state === 'failed') {
      res.status(500).json({
        success: false,
        status: 'failed',
        error: jobStatus.failedReason || 'Estimation failed',
        failedAt: jobStatus.finishedOn,
      });
    } else {
      res.json({
        success: true,
        status: jobStatus.state,
        progress: jobStatus.progress,
        startedAt: jobStatus.processedOn,
      });
    }
  } catch (error) {
    logger.error('Error getting estimation status:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get estimation status',
    });
  }
});

/**
 * POST /api/admin/column-batch/start
 * Start a new column batch operation
 */
router.post(
  '/start',
  validateRequest(columnBatchRequestSchema),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user?.uid || 'unknown';
      const request = {
        ...req.body,
        metadata: {
          initiatedBy: userId,
          reason: req.body.reason || 'Admin batch operation',
          tags: req.body.tags || [],
        },
      };

      logger.info(`Batch operation start requested by ${userId}:`, {
        sectionName: request.sectionName,
        batchSize: request.processingOptions.batchSize,
      });

      // Check safety permissions
      const permissionCheck = await batchSafetyControlsService.checkOperationPermission(userId, {
        sectionName: request.sectionName,
        termCount: 1000, // Estimate - will be refined during actual processing
        estimatedCost: 50, // Estimate - will be refined during actual processing
        estimatedDuration: 60, // Estimate - will be refined during actual processing
      });

      if (!permissionCheck.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Operation not permitted',
          reason: permissionCheck.reason,
          waitTime: permissionCheck.waitTime,
        });
      }

      // Start the batch operation
      const operationId = await columnBatchProcessorService.startBatchOperation(request);

      res.status(202).json({
        success: true,
        message: 'Batch operation started successfully',
        operationId,
        status: 'pending',
        startedAt: new Date(),
      });
    } catch (error) {
      logger.error('Error starting batch operation:', {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({
        success: false,
        error: 'Failed to start batch operation',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/admin/column-batch/operations
 * Get list of batch operations
 */
router.get('/operations', async (req: Request, res: Response) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query;

    let operations = columnBatchProcessorService.getOperationHistory(
      parseInt(limit as string) + parseInt(offset as string)
    );

    // Filter by status if provided
    if (status && typeof status === 'string') {
      operations = operations.filter((op) => op.status === status);
    }

    // Apply pagination
    const paginatedOps = operations.slice(
      parseInt(offset as string),
      parseInt(offset as string) + parseInt(limit as string)
    );

    res.json({
      success: true,
      operations: paginatedOps,
      pagination: {
        total: operations.length,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: operations.length > parseInt(offset as string) + parseInt(limit as string),
      },
    });
  } catch (error) {
    logger.error('Error getting operations list:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get operations list',
    });
  }
});

/**
 * GET /api/admin/column-batch/operations/active
 * Get active batch operations
 */
router.get('/operations/active', async (_req: Request, res: Response) => {
  try {
    const activeOperations = columnBatchProcessorService.getActiveOperations();

    // Enhance with current progress data
    const enhancedOperations = activeOperations.map((op) => {
      const currentProgress = batchProgressTrackingService.getCurrentProgress(op.id);
      return {
        ...op,
        currentProgress,
        health: currentProgress ? 'healthy' : 'unknown', // Simplified health check
      };
    });

    res.json({
      success: true,
      activeOperations: enhancedOperations,
      count: enhancedOperations.length,
    });
  } catch (error) {
    logger.error('Error getting active operations:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get active operations',
    });
  }
});

/**
 * GET /api/admin/column-batch/operations/:operationId
 * Get detailed operation status
 */
router.get('/operations/:operationId', async (req: Request, res: Response) => {
  try {
    const { operationId } = req.params;

    const operation = columnBatchProcessorService.getOperationStatus(operationId);

    if (!operation) {
      return res.status(404).json({
        success: false,
        error: 'Operation not found',
      });
    }

    // Get enhanced progress data
    const currentProgress = batchProgressTrackingService.getCurrentProgress(operationId);
    const progressHistory = batchProgressTrackingService.getProgressHistory(operationId, 100);
    const statusReports = batchProgressTrackingService.getStatusReports(operationId);
    const detailedMetrics = await batchProgressTrackingService.getDetailedMetrics(operationId);

    res.json({
      success: true,
      operation,
      currentProgress,
      progressHistory,
      statusReports,
      detailedMetrics,
    });
  } catch (error) {
    logger.error('Error getting operation details:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get operation details',
    });
  }
});

/**
 * POST /api/admin/column-batch/operations/:operationId/pause
 * Pause a batch operation
 */
router.post('/operations/:operationId/pause', async (req: Request, res: Response) => {
  try {
    const { operationId } = req.params;
    const userId = req.user?.uid || 'unknown';

    const success = await columnBatchProcessorService.pauseBatchOperation(operationId);

    if (success) {
      logger.info(`Operation ${operationId} paused by ${userId}`);
      res.json({
        success: true,
        message: 'Operation paused successfully',
        pausedAt: new Date(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to pause operation',
      });
    }
  } catch (error) {
    logger.error('Error pausing operation:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to pause operation',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/admin/column-batch/operations/:operationId/resume
 * Resume a paused batch operation
 */
router.post('/operations/:operationId/resume', async (req: Request, res: Response) => {
  try {
    const { operationId } = req.params;
    const userId = req.user?.uid || 'unknown';

    const success = await columnBatchProcessorService.resumeBatchOperation(operationId);

    if (success) {
      logger.info(`Operation ${operationId} resumed by ${userId}`);
      res.json({
        success: true,
        message: 'Operation resumed successfully',
        resumedAt: new Date(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to resume operation',
      });
    }
  } catch (error) {
    logger.error('Error resuming operation:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to resume operation',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/admin/column-batch/operations/:operationId/cancel
 * Cancel a batch operation
 */
router.post('/operations/:operationId/cancel', async (req: Request, res: Response) => {
  try {
    const { operationId } = req.params;
    const userId = req.user?.uid || 'unknown';

    const success = await columnBatchProcessorService.cancelBatchOperation(operationId);

    if (success) {
      logger.info(`Operation ${operationId} cancelled by ${userId}`);
      res.json({
        success: true,
        message: 'Operation cancelled successfully',
        cancelledAt: new Date(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to cancel operation',
      });
    }
  } catch (error) {
    logger.error('Error cancelling operation:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to cancel operation',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/admin/column-batch/dashboard
 * Get dashboard data for batch operations
 */
router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const dashboardData = await batchProgressTrackingService.getDashboardData();
    const safetyStatus = await batchSafetyControlsService.getSafetyStatus();
    const costSummary = await costManagementService.getCostSummary();

    res.json({
      success: true,
      dashboard: dashboardData,
      safety: safetyStatus,
      costs: costSummary,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('Error getting dashboard data:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard data',
    });
  }
});

/**
 * GET /api/admin/column-batch/analytics
 * Get analytics data for batch operations
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, operation, model, userId } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await costManagementService.getCostAnalytics(start, end, {
      operation: operation as string,
      model: model as string,
      userId: userId as string,
    });

    res.json({
      success: true,
      analytics,
      period: { start, end },
    });
  } catch (error) {
    logger.error('Error getting analytics:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get analytics data',
    });
  }
});

/**
 * GET /api/admin/column-batch/safety/status
 * Get safety controls status
 */
router.get('/safety/status', async (_req: Request, res: Response) => {
  try {
    const safetyStatus = await batchSafetyControlsService.getSafetyStatus();

    res.json({
      success: true,
      safetyStatus,
    });
  } catch (error) {
    logger.error('Error getting safety status:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get safety status',
    });
  }
});

/**
 * POST /api/admin/column-batch/safety/emergency-stop
 * Activate emergency stop
 */
router.post('/safety/emergency-stop', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    const userId = req.user?.uid || 'unknown';

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required for emergency stop',
      });
    }

    await batchSafetyControlsService.activateEmergencyStop(reason, userId);

    logger.critical(`Emergency stop activated by ${userId}: ${reason}`);

    res.json({
      success: true,
      message: 'Emergency stop activated',
      activatedBy: userId,
      reason,
      activatedAt: new Date(),
    });
  } catch (error) {
    logger.error('Error activating emergency stop:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to activate emergency stop',
    });
  }
});

/**
 * POST /api/admin/column-batch/safety/emergency-stop/deactivate
 * Deactivate emergency stop
 */
router.post('/safety/emergency-stop/deactivate', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid || 'unknown';

    await batchSafetyControlsService.deactivateEmergencyStop(userId);

    logger.info(`Emergency stop deactivated by ${userId}`);

    res.json({
      success: true,
      message: 'Emergency stop deactivated',
      deactivatedBy: userId,
      deactivatedAt: new Date(),
    });
  } catch (error) {
    logger.error('Error deactivating emergency stop:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to deactivate emergency stop',
    });
  }
});

/**
 * GET /api/admin/column-batch/costs/budgets
 * Get cost budgets
 */
router.get('/costs/budgets', async (_req: Request, res: Response) => {
  try {
    const budgets = costManagementService.getBudgets();
    const alerts = costManagementService.getCostAlerts();

    res.json({
      success: true,
      budgets,
      alerts: alerts.slice(0, 10), // Latest 10 alerts
    });
  } catch (error) {
    logger.error('Error getting cost budgets:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get cost budgets',
    });
  }
});

/**
 * POST /api/admin/column-batch/costs/budgets
 * Create a new cost budget
 */
router.post('/costs/budgets', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid || 'unknown';
    const budgetData = {
      ...req.body,
      createdBy: userId,
    };

    const budgetId = await costManagementService.createBudget(budgetData);

    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      budgetId,
    });
  } catch (error) {
    logger.error('Error creating budget:', {
      error: error instanceof Error ? error.message : String(error),
    });

    res.status(500).json({
      success: false,
      error: 'Failed to create budget',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
