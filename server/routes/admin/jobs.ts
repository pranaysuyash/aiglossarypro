import type { Express, Request, Response } from "express";
import type { Job } from "bullmq";
import { jobQueue, jobQueueManager } from "../../jobs/queue";
import { authenticateFirebaseToken, requireFirebaseAdmin } from "../../middleware/firebaseAuth";
import { log as logger } from "../../utils/logger";
import { JobType } from "../../jobs/types";

/**
 * Admin job management routes
 */
export function registerAdminJobRoutes(app: Express): void {
  
  // Get all import jobs
  app.get('/api/admin/jobs/imports', authenticateFirebaseToken, requireFirebaseAdmin, async (req: Request, res: Response) => {
    try {
      // Get active and recent jobs
      const excelQueue = jobQueueManager.getQueue(JobType.EXCEL_IMPORT);
      if (!excelQueue) {
        return res.json({
          success: true,
          data: []
        });
      }

      // Get jobs in different states
      const [waiting, active, completed, failed] = await Promise.all([
        excelQueue.getWaiting(),
        excelQueue.getActive(),
        excelQueue.getCompleted(0, 10),
        excelQueue.getFailed(0, 10)
      ]);

      // Format jobs for response
      const formatJob = (job: Job, status: string) => {
        const progress = job.progress || 0;
        const data = job.data || {};
        const returnValue = job.returnvalue || {};
        
        return {
          id: job.id,
          type: JobType.EXCEL_IMPORT,
          status,
          progress,
          fileName: data.fileName || 'Unknown',
          termsProcessed: returnValue.termsImported || 0,
          totalTerms: returnValue.totalTerms || data.estimatedTerms || 0,
          startedAt: job.timestamp ? new Date(job.timestamp).toISOString() : new Date().toISOString(),
          completedAt: job.finishedOn ? new Date(job.finishedOn).toISOString() : undefined,
          error: job.failedReason
        };
      };

      const allJobs = [
        ...waiting.map((job: Job) => formatJob(job, 'pending')),
        ...active.map((job: Job) => formatJob(job, 'processing')),
        ...completed.map((job: Job) => formatJob(job, 'completed')),
        ...failed.map((job: Job) => formatJob(job, 'failed'))
      ];

      // Sort by startedAt descending
      allJobs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

      res.json({
        success: true,
        data: allJobs
      });
    } catch (error) {
      logger.error("Error fetching import jobs", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: "Failed to fetch import jobs"
      });
    }
  });

  // Get job details
  app.get('/api/admin/jobs/:jobId', authenticateFirebaseToken, requireFirebaseAdmin, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      
      // Try to find the job in any queue
      const queues = [
        JobType.EXCEL_IMPORT,
        JobType.AI_CONTENT_GENERATION,
        JobType.BULK_TERM_UPDATE,
        JobType.DATA_EXPORT,
        JobType.CACHE_CLEANUP
      ];

      let jobDetails = null;
      let jobType = null;

      for (const type of queues) {
        const queue = jobQueueManager.getQueue(type);
        if (queue) {
          const job = await queue.getJob(jobId);
          if (job) {
            jobDetails = job;
            jobType = type;
            break;
          }
        }
      }

      if (!jobDetails) {
        return res.status(404).json({
          success: false,
          message: "Job not found"
        });
      }

      const state = await jobDetails.getState();
      const progress = jobDetails.progress || 0;
      const logs = await jobDetails.getChildrenValues();

      res.json({
        success: true,
        data: {
          id: jobDetails.id,
          type: jobType,
          state,
          progress,
          data: jobDetails.data,
          result: jobDetails.returnvalue,
          error: jobDetails.failedReason,
          logs: Object.values(logs),
          createdAt: jobDetails.timestamp ? new Date(jobDetails.timestamp).toISOString() : undefined,
          processedOn: jobDetails.processedOn ? new Date(jobDetails.processedOn).toISOString() : undefined,
          finishedOn: jobDetails.finishedOn ? new Date(jobDetails.finishedOn).toISOString() : undefined
        }
      });
    } catch (error) {
      logger.error("Error fetching job details", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: "Failed to fetch job details"
      });
    }
  });

  // Cancel a job
  app.post('/api/admin/jobs/:jobId/cancel', authenticateFirebaseToken, requireFirebaseAdmin, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      
      // Try to find and cancel the job
      const queues = [
        JobType.EXCEL_IMPORT,
        JobType.AI_CONTENT_GENERATION,
        JobType.BULK_TERM_UPDATE,
        JobType.DATA_EXPORT,
        JobType.CACHE_CLEANUP
      ];

      let cancelled = false;

      for (const type of queues) {
        const queue = jobQueueManager.getQueue(type);
        if (queue) {
          const job = await queue.getJob(jobId);
          if (job) {
            await job.remove();
            cancelled = true;
            logger.info(`Cancelled job ${jobId} of type ${type}`);
            break;
          }
        }
      }

      if (!cancelled) {
        return res.status(404).json({
          success: false,
          message: "Job not found or already completed"
        });
      }

      res.json({
        success: true,
        message: "Job cancelled successfully"
      });
    } catch (error) {
      logger.error("Error cancelling job", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: "Failed to cancel job"
      });
    }
  });

  // Retry a failed job
  app.post('/api/admin/jobs/:jobId/retry', authenticateFirebaseToken, requireFirebaseAdmin, async (req: Request, res: Response) => {
    try {
      const { jobId } = req.params;
      
      // Try to find and retry the job
      const queues = [
        JobType.EXCEL_IMPORT,
        JobType.AI_CONTENT_GENERATION,
        JobType.BULK_TERM_UPDATE,
        JobType.DATA_EXPORT,
        JobType.CACHE_CLEANUP
      ];

      let retried = false;

      for (const type of queues) {
        const queue = jobQueueManager.getQueue(type);
        if (queue) {
          const job = await queue.getJob(jobId);
          if (job) {
            const state = await job.getState();
            if (state === 'failed') {
              await job.retry();
              retried = true;
              logger.info(`Retried job ${jobId} of type ${type}`);
            }
            break;
          }
        }
      }

      if (!retried) {
        return res.status(404).json({
          success: false,
          message: "Job not found or not in failed state"
        });
      }

      res.json({
        success: true,
        message: "Job retry initiated"
      });
    } catch (error) {
      logger.error("Error retrying job", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: "Failed to retry job"
      });
    }
  });

  // Get queue statistics
  app.get('/api/admin/jobs/stats', authenticateFirebaseToken, requireFirebaseAdmin, async (req: Request, res: Response) => {
    try {
      const stats: any = {};
      
      const queues = [
        { type: JobType.EXCEL_IMPORT, name: 'Excel Import' },
        { type: JobType.AI_CONTENT_GENERATION, name: 'AI Content Generation' },
        { type: JobType.BULK_TERM_UPDATE, name: 'Bulk Term Update' },
        { type: JobType.DATA_EXPORT, name: 'Data Export' },
        { type: JobType.CACHE_CLEANUP, name: 'Cache Cleanup' }
      ];

      for (const { type, name } of queues) {
        const queue = jobQueueManager.getQueue(type);
        if (queue) {
          const counts = await queue.getJobCounts();
          stats[type] = {
            name,
            ...counts
          };
        }
      }

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error("Error fetching job statistics", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({
        success: false,
        message: "Failed to fetch job statistics"
      });
    }
  });

  logger.info('📊 Admin job management routes registered');
}