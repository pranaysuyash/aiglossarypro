/**
 * Job Management API Routes
 * Provides endpoints for managing and monitoring background jobs
 */

import type { Express, Request, Response } from "express";
import { mockIsAuthenticated } from "../middleware/dev/mockAuth";
import { requireAdmin } from "../middleware/adminAuth";
import { jobQueueManager, jobQueue, JobType } from "../jobs/queue";
import { JobPriority } from "../jobs/types";
import { log as logger } from "../utils/logger";

export function registerJobRoutes(app: Express): void {
  const authMiddleware = mockIsAuthenticated;

  /**
   * Get job status by ID and type
   */
  app.get('/api/jobs/:type/:jobId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { type, jobId } = req.params;
      
      if (!Object.values(JobType).includes(type as JobType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid job type',
        });
      }

      const jobStatus = await jobQueueManager.getJobStatus(type as JobType, jobId);
      
      if (!jobStatus) {
        return res.status(404).json({
          success: false,
          error: 'Job not found',
        });
      }

      res.json({
        success: true,
        data: jobStatus,
      });
    } catch (error) {
      logger.error('Error fetching job status:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch job status',
      });
    }
  });

  /**
   * Get queue statistics
   */
  app.get('/api/jobs/queues/stats', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await jobQueueManager.getAllQueueStats();
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching queue stats:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch queue statistics',
      });
    }
  });

  /**
   * Get specific queue statistics
   */
  app.get('/api/jobs/queues/:type/stats', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      
      if (!Object.values(JobType).includes(type as JobType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid job type',
        });
      }

      const stats = await jobQueueManager.getQueueStats(type as JobType);
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error fetching queue stats:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to fetch queue statistics',
      });
    }
  });

  /**
   * Create a new Excel import job
   */
  app.post('/api/jobs/excel-import', authMiddleware, async (req: Request, res: Response) => {
    try {
      const {
        fileBuffer,
        fileName,
        fileSize,
        importOptions,
        priority = JobPriority.NORMAL,
      } = req.body;

      if (!fileBuffer || !fileName) {
        return res.status(400).json({
          success: false,
          error: 'File buffer and name are required',
        });
      }

      const jobId = await jobQueue.addExcelImportJob({
        fileBuffer: Buffer.from(fileBuffer, 'base64'),
        fileName,
        fileSize: fileSize || Buffer.from(fileBuffer, 'base64').length,
        importOptions: importOptions || {
          mode: 'advanced',
          enableAI: false,
          checkpointEnabled: true,
        },
        userId: req.user?.id,
        requestId: req.headers['x-request-id'] as string,
      }, {
        priority,
      });

      res.json({
        success: true,
        data: {
          jobId,
          type: JobType.EXCEL_IMPORT,
          message: 'Excel import job created successfully',
        },
      });
    } catch (error) {
      logger.error('Error creating Excel import job:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to create Excel import job',
      });
    }
  });

  /**
   * Create a new AI content generation job
   */
  app.post('/api/jobs/ai-content', authMiddleware, async (req: Request, res: Response) => {
    try {
      const {
        termId,
        termName,
        sections,
        model,
        temperature,
        priority = JobPriority.NORMAL,
      } = req.body;

      if (!termId || !termName || !sections) {
        return res.status(400).json({
          success: false,
          error: 'Term ID, name, and sections are required',
        });
      }

      const jobId = await jobQueue.addAIContentJob({
        termId,
        termName,
        sections,
        model,
        temperature,
        userId: req.user?.id,
        requestId: req.headers['x-request-id'] as string,
      }, {
        priority,
      });

      res.json({
        success: true,
        data: {
          jobId,
          type: JobType.AI_CONTENT_GENERATION,
          message: 'AI content generation job created successfully',
        },
      });
    } catch (error) {
      logger.error('Error creating AI content job:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to create AI content generation job',
      });
    }
  });

  /**
   * Create a cache warm job
   */
  app.post('/api/jobs/cache-warm', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const {
        keys,
        ttl,
        priority = JobPriority.LOW,
      } = req.body;

      if (!keys || !Array.isArray(keys)) {
        return res.status(400).json({
          success: false,
          error: 'Keys array is required',
        });
      }

      const jobId = await jobQueue.addCacheWarmJob({
        keys,
        ttl,
        priority: priority === JobPriority.HIGH ? 'high' : 'normal',
        userId: req.user?.id,
        requestId: req.headers['x-request-id'] as string,
      }, {
        priority,
      });

      res.json({
        success: true,
        data: {
          jobId,
          type: JobType.CACHE_WARM,
          message: 'Cache warm job created successfully',
        },
      });
    } catch (error) {
      logger.error('Error creating cache warm job:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to create cache warm job',
      });
    }
  });

  /**
   * Create an email send job
   */
  app.post('/api/jobs/email-send', authMiddleware, async (req: Request, res: Response) => {
    try {
      const {
        to,
        subject,
        template,
        data,
        attachments,
        priority = JobPriority.NORMAL,
      } = req.body;

      if (!to || !template) {
        return res.status(400).json({
          success: false,
          error: 'Recipient and template are required',
        });
      }

      const jobId = await jobQueue.addEmailJob({
        to,
        subject,
        template,
        data: data || {},
        attachments,
        userId: req.user?.id,
        requestId: req.headers['x-request-id'] as string,
      }, {
        priority,
      });

      res.json({
        success: true,
        data: {
          jobId,
          type: JobType.EMAIL_SEND,
          message: 'Email job created successfully',
        },
      });
    } catch (error) {
      logger.error('Error creating email job:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to create email job',
      });
    }
  });

  /**
   * Cancel a job
   */
  app.delete('/api/jobs/:type/:jobId', authMiddleware, async (req: Request, res: Response) => {
    try {
      const { type, jobId } = req.params;
      
      if (!Object.values(JobType).includes(type as JobType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid job type',
        });
      }

      const cancelled = await jobQueueManager.cancelJob(type as JobType, jobId);
      
      if (!cancelled) {
        return res.status(404).json({
          success: false,
          error: 'Job not found or already completed',
        });
      }

      res.json({
        success: true,
        message: 'Job cancelled successfully',
      });
    } catch (error) {
      logger.error('Error cancelling job:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to cancel job',
      });
    }
  });

  /**
   * Pause a queue
   */
  app.post('/api/jobs/queues/:type/pause', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      
      if (!Object.values(JobType).includes(type as JobType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid job type',
        });
      }

      await jobQueueManager.pauseQueue(type as JobType);
      
      res.json({
        success: true,
        message: `Queue ${type} paused successfully`,
      });
    } catch (error) {
      logger.error('Error pausing queue:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to pause queue',
      });
    }
  });

  /**
   * Resume a queue
   */
  app.post('/api/jobs/queues/:type/resume', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      
      if (!Object.values(JobType).includes(type as JobType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid job type',
        });
      }

      await jobQueueManager.resumeQueue(type as JobType);
      
      res.json({
        success: true,
        message: `Queue ${type} resumed successfully`,
      });
    } catch (error) {
      logger.error('Error resuming queue:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to resume queue',
      });
    }
  });

  /**
   * Clean old jobs from a queue
   */
  app.post('/api/jobs/queues/:type/clean', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      const { grace = 3600000, limit = 1000, status = 'completed' } = req.body;
      
      if (!Object.values(JobType).includes(type as JobType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid job type',
        });
      }

      const cleanedJobs = await jobQueueManager.cleanQueue(
        type as JobType,
        grace,
        limit,
        status
      );
      
      res.json({
        success: true,
        data: {
          cleanedJobs: cleanedJobs.length,
          jobIds: cleanedJobs,
        },
        message: `Cleaned ${cleanedJobs.length} jobs from queue ${type}`,
      });
    } catch (error) {
      logger.error('Error cleaning queue:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to clean queue',
      });
    }
  });

  /**
   * Create a batch AI processing job
   */
  app.post('/api/jobs/ai-batch', authMiddleware, async (req: Request, res: Response) => {
    try {
      const {
        termIds,
        sections,
        batchSize = 10,
        costLimit,
        priority = JobPriority.NORMAL,
      } = req.body;

      if (!termIds || !Array.isArray(termIds) || !sections) {
        return res.status(400).json({
          success: false,
          error: 'Term IDs array and sections are required',
        });
      }

      // Convert term IDs to term objects (simplified for demo)
      const terms = termIds.map((id: string) => ({ id, name: `Term ${id}` }));

      const jobId = await jobQueueManager.addJob(JobType.AI_BATCH_PROCESSING, {
        terms,
        sections,
        batchSize,
        costLimit,
        userId: req.user?.id,
        requestId: req.headers['x-request-id'] as string,
      }, {
        priority,
      });

      res.json({
        success: true,
        data: {
          jobId,
          type: JobType.AI_BATCH_PROCESSING,
          message: 'AI batch processing job created successfully',
        },
      });
    } catch (error) {
      logger.error('Error creating AI batch job:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to create AI batch processing job',
      });
    }
  });

  /**
   * Create a database batch insert job
   */
  app.post('/api/jobs/db-batch', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
    try {
      const {
        table,
        records,
        conflictResolution = 'ignore',
        batchSize = 1000,
        priority = JobPriority.NORMAL,
      } = req.body;

      if (!table || !records || !Array.isArray(records)) {
        return res.status(400).json({
          success: false,
          error: 'Table name and records array are required',
        });
      }

      const jobId = await jobQueue.addDBBatchJob({
        table,
        records,
        conflictResolution,
        batchSize,
        userId: req.user?.id,
        requestId: req.headers['x-request-id'] as string,
      }, {
        priority,
      });

      res.json({
        success: true,
        data: {
          jobId,
          type: JobType.DB_BATCH_INSERT,
          message: 'Database batch insert job created successfully',
        },
      });
    } catch (error) {
      logger.error('Error creating DB batch job:', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        error: 'Failed to create database batch insert job',
      });
    }
  });

  logger.info('Job management routes registered');
}