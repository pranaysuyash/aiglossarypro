/**
 * Main Job Queue Setup
 * Configures BullMQ queues, workers, and event listeners
 */

import { Queue, Worker, QueueEvents, Job, ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';
import { log as logger } from '../utils/logger';
import { JobType, JobOptions, JobProgressUpdate, RetryPolicy, JobPriority } from './types';

// Re-export types for convenience
export { JobType, JobPriority };
import { EventEmitter } from 'events';

// Redis connection configuration
const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '1'), // Use DB 1 for job queues
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

// Create Redis connections for different BullMQ components
const createRedisConnection = () => new Redis(redisConnection);

// Queue configuration
export interface QueueConfig {
  name: string;
  defaultJobOptions?: JobOptions;
  concurrency?: number;
  limiter?: {
    max: number;
    duration: number;
  };
}

// Job Queue Manager
export class JobQueueManager extends EventEmitter {
  private queues: Map<JobType, Queue> = new Map();
  private workers: Map<JobType, Worker> = new Map();
  private queueEvents: Map<JobType, QueueEvents> = new Map();
  private redisConnection: Redis;
  private isInitialized: boolean = false;

  constructor() {
    super();
    this.redisConnection = createRedisConnection();
  }

  /**
   * Initialize all job queues
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Job queue manager already initialized');
      return;
    }

    try {
      // Test Redis connection
      await this.redisConnection.ping();
      logger.info('Redis connection established for job queues');

      // Initialize queues for each job type
      await this.initializeQueues();
      
      // Initialize workers
      await this.initializeWorkers();
      
      // Initialize queue event listeners
      await this.initializeQueueEvents();

      this.isInitialized = true;
      logger.info('Job queue manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize job queue manager:', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Initialize all queues
   */
  private async initializeQueues(): Promise<void> {
    const queueConfigs: Array<{ type: JobType; config: QueueConfig }> = [
      // AI Processing Queues
      {
        type: JobType.AI_CONTENT_GENERATION,
        config: {
          name: 'ai-content-generation',
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 10000 },
            timeout: 60000, // 1 minute per request
          },
          concurrency: 10, // Limit based on OpenAI rate limits
          limiter: {
            max: 50,
            duration: 60000, // 50 requests per minute
          },
        },
      },
      {
        type: JobType.AI_BATCH_PROCESSING,
        config: {
          name: 'ai-batch-processing',
          defaultJobOptions: {
            attempts: 2,
            backoff: { type: 'exponential', delay: 30000 },
            timeout: 600000, // 10 minutes
          },
          concurrency: 2,
        },
      },
      // Database Queues
      {
        type: JobType.DB_BATCH_INSERT,
        config: {
          name: 'db-batch-insert',
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'fixed', delay: 5000 },
            timeout: 60000,
          },
          concurrency: 5,
        },
      },
      // Email Queues
      {
        type: JobType.EMAIL_SEND,
        config: {
          name: 'email-send',
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            timeout: 30000,
          },
          concurrency: 10,
          limiter: {
            max: 100,
            duration: 60000, // 100 emails per minute
          },
        },
      },
      // Cache Queues
      {
        type: JobType.CACHE_WARM,
        config: {
          name: 'cache-warm',
          defaultJobOptions: {
            attempts: 2,
            backoff: { type: 'fixed', delay: 2000 },
            timeout: 30000,
          },
          concurrency: 20,
        },
      },
      {
        type: JobType.CACHE_PRECOMPUTE,
        config: {
          name: 'cache-precompute',
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 10000 },
            timeout: 120000,
          },
          concurrency: 5,
        },
      },
      // Analytics Queues
      {
        type: JobType.ANALYTICS_AGGREGATE,
        config: {
          name: 'analytics-aggregate',
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 10000 },
            timeout: 180000, // 3 minutes
          },
          concurrency: 3,
        },
      },
    ];

    for (const { type, config } of queueConfigs) {
      const queue = new Queue(config.name, {
        connection: createRedisConnection(),
        defaultJobOptions: config.defaultJobOptions,
      });

      this.queues.set(type, queue);
      logger.info(`Queue initialized: ${config.name}`);
    }
  }

  /**
   * Initialize workers for processing jobs
   */
  private async initializeWorkers(): Promise<void> {
    // Import processors
    const processors = await import('./processors');

    // Map job types to their processors
    const processorMap = new Map([
      [JobType.AI_CONTENT_GENERATION, processors.aiContentGenerationProcessor],
      [JobType.AI_BATCH_PROCESSING, processors.aiBatchProcessingProcessor],
      [JobType.DB_BATCH_INSERT, processors.dbBatchInsertProcessor],
      [JobType.EMAIL_SEND, processors.emailSendProcessor],
      [JobType.CACHE_WARM, processors.cacheWarmProcessor],
      [JobType.CACHE_PRECOMPUTE, processors.cachePrecomputeProcessor],
      [JobType.ANALYTICS_AGGREGATE, processors.analyticsAggregateProcessor],
    ]);

    // Create workers for each job type
    for (const [jobType, processor] of processorMap) {
      const queue = this.queues.get(jobType);
      if (!queue) continue;

      const worker = new Worker(
        queue.name,
        async (job: Job) => {
          logger.info(`Processing job ${job.id} of type ${jobType}`);
          try {
            const result = await processor(job);
            logger.info(`Job ${job.id} completed successfully`);
            return result;
          } catch (error) {
            logger.error(`Job ${job.id} failed:`, { error: error instanceof Error ? error.message : String(error) });
            throw error;
          }
        },
        {
          connection: createRedisConnection(),
          concurrency: this.getWorkerConcurrency(jobType),
          limiter: this.getWorkerLimiter(jobType),
        }
      );

      // Add worker event listeners
      worker.on('completed', (job) => {
        this.emit('job:completed', { jobType, jobId: job.id, result: job.returnvalue });
      });

      worker.on('failed', (job, error) => {
        this.emit('job:failed', { jobType, jobId: job?.id, error });
      });

      worker.on('progress', (job, progress) => {
        this.emit('job:progress', { jobType, jobId: job.id, progress });
      });

      this.workers.set(jobType, worker);
      logger.info(`Worker initialized for: ${queue.name}`);
    }
  }

  /**
   * Initialize queue event listeners
   */
  private async initializeQueueEvents(): Promise<void> {
    for (const [jobType, queue] of this.queues) {
      const queueEvents = new QueueEvents(queue.name, {
        connection: createRedisConnection(),
      });

      queueEvents.on('waiting', ({ jobId }) => {
        this.emit('job:waiting', { jobType, jobId });
      });

      queueEvents.on('active', ({ jobId }) => {
        this.emit('job:active', { jobType, jobId });
      });

      queueEvents.on('stalled', ({ jobId }) => {
        this.emit('job:stalled', { jobType, jobId });
      });

      queueEvents.on('removed', ({ jobId }) => {
        this.emit('job:removed', { jobType, jobId });
      });

      this.queueEvents.set(jobType, queueEvents);
    }
  }

  /**
   * Add a job to the queue
   */
  async addJob<T = any>(
    type: JobType,
    data: T,
    options?: JobOptions
  ): Promise<string> {
    const queue = this.queues.get(type);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`);
    }

    const job = await queue.add(type, data, {
      ...options,
      jobId: options?.jobId || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });

    logger.info(`Job ${job.id} added to queue ${queue.name}`);
    return job.id!;
  }

  /**
   * Add multiple jobs to the queue
   */
  async addBulkJobs<T = any>(
    type: JobType,
    jobs: Array<{ data: T; options?: JobOptions }>
  ): Promise<string[]> {
    const queue = this.queues.get(type);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`);
    }

    const bulkJobs = jobs.map((job, index) => ({
      name: type,
      data: job.data,
      opts: {
        ...job.options,
        jobId: job.options?.jobId || `${type}-bulk-${Date.now()}-${index}`,
      },
    }));

    const addedJobs = await queue.addBulk(bulkJobs);
    const jobIds = addedJobs.map(job => job.id!);

    logger.info(`Added ${jobIds.length} jobs to queue ${queue.name}`);
    return jobIds;
  }

  /**
   * Get job status
   */
  async getJobStatus(type: JobType, jobId: string): Promise<any> {
    const queue = this.queues.get(type);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      id: job.id,
      type,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };
  }

  /**
   * Update job progress
   */
  async updateJobProgress(
    type: JobType,
    jobId: string,
    progress: JobProgressUpdate
  ): Promise<void> {
    const queue = this.queues.get(type);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`);
    }

    const job = await queue.getJob(jobId);
    if (job) {
      await job.updateProgress(progress);
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(type: JobType, jobId: string): Promise<boolean> {
    const queue = this.queues.get(type);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      return false;
    }

    await job.remove();
    return true;
  }

  /**
   * Get a specific queue by type
   */
  getQueue(type: JobType): Queue | undefined {
    return this.queues.get(type);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(type: JobType): Promise<any> {
    const queue = this.queues.get(type);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`);
    }

    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
      queue.getPausedCount(),
    ]);

    return {
      name: queue.name,
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      total: waiting + active + completed + failed + delayed + paused,
    };
  }

  /**
   * Get all queue statistics
   */
  async getAllQueueStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const [type, queue] of this.queues) {
      stats[type] = await this.getQueueStats(type);
    }

    return stats;
  }

  /**
   * Pause a queue
   */
  async pauseQueue(type: JobType): Promise<void> {
    const queue = this.queues.get(type);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`);
    }

    await queue.pause();
    logger.info(`Queue ${queue.name} paused`);
  }

  /**
   * Resume a queue
   */
  async resumeQueue(type: JobType): Promise<void> {
    const queue = this.queues.get(type);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`);
    }

    await queue.resume();
    logger.info(`Queue ${queue.name} resumed`);
  }

  /**
   * Clean old jobs from a queue
   */
  async cleanQueue(
    type: JobType,
    grace: number = 3600000, // 1 hour default
    limit: number = 1000,
    status: 'completed' | 'failed' = 'completed'
  ): Promise<string[]> {
    const queue = this.queues.get(type);
    if (!queue) {
      throw new Error(`Queue not found for job type: ${type}`);
    }

    const jobs = await queue.clean(grace, limit, status);
    logger.info(`Cleaned ${jobs.length} ${status} jobs from queue ${queue.name}`);
    return jobs;
  }

  /**
   * Shutdown the job queue manager
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down job queue manager...');

    // Close all workers
    for (const [type, worker] of this.workers) {
      await worker.close();
      logger.info(`Worker for ${type} closed`);
    }

    // Close all queue events
    for (const [type, queueEvents] of this.queueEvents) {
      await queueEvents.close();
      logger.info(`Queue events for ${type} closed`);
    }

    // Close all queues
    for (const [type, queue] of this.queues) {
      await queue.close();
      logger.info(`Queue ${type} closed`);
    }

    // Close Redis connection
    this.redisConnection.disconnect();

    this.isInitialized = false;
    logger.info('Job queue manager shutdown complete');
  }

  /**
   * Get worker concurrency for a job type
   */
  private getWorkerConcurrency(type: JobType): number {
    const concurrencyMap: Record<JobType, number> = {
      [JobType.AI_CONTENT_GENERATION]: 10,
      [JobType.AI_BATCH_PROCESSING]: 2,
      [JobType.DB_BATCH_INSERT]: 5,
      [JobType.EMAIL_SEND]: 10,
      [JobType.CACHE_WARM]: 20,
      [JobType.CACHE_PRECOMPUTE]: 5,
      [JobType.ANALYTICS_AGGREGATE]: 3,
      [JobType.AI_CONTENT_PARSING]: 5,
      [JobType.DB_BATCH_UPDATE]: 5,
      [JobType.DB_CLEANUP]: 1,
      [JobType.DB_INDEX_OPTIMIZATION]: 1,
      [JobType.EMAIL_BATCH_SEND]: 5,
      [JobType.EMAIL_NEWSLETTER]: 2,
      [JobType.CACHE_INVALIDATE]: 10,
      [JobType.ANALYTICS_REPORT]: 2,
      [JobType.SYSTEM_CLEANUP]: 1,
      [JobType.SYSTEM_BACKUP]: 1,
    };

    return concurrencyMap[type] || 5;
  }

  /**
   * Get worker rate limiter for a job type
   */
  private getWorkerLimiter(type: JobType): any {
    const limiterMap: Record<JobType, any> = {
      [JobType.AI_CONTENT_GENERATION]: {
        max: 50,
        duration: 60000, // 50 requests per minute
      },
      [JobType.EMAIL_SEND]: {
        max: 100,
        duration: 60000, // 100 emails per minute
      },
    };

    return limiterMap[type];
  }
}

// Export singleton instance
export const jobQueueManager = new JobQueueManager();

// Helper functions for easy job creation
export const jobQueue = {
  /**
   * Add an AI content generation job
   */
  async addAIContentJob(data: any, options?: JobOptions): Promise<string> {
    return jobQueueManager.addJob(JobType.AI_CONTENT_GENERATION, data, options);
  },

  /**
   * Add a database batch insert job
   */
  async addDBBatchJob(data: any, options?: JobOptions): Promise<string> {
    return jobQueueManager.addJob(JobType.DB_BATCH_INSERT, data, options);
  },

  /**
   * Add an email send job
   */
  async addEmailJob(data: any, options?: JobOptions): Promise<string> {
    return jobQueueManager.addJob(JobType.EMAIL_SEND, data, options);
  },

  /**
   * Add a cache warm job
   */
  async addCacheWarmJob(data: any, options?: JobOptions): Promise<string> {
    return jobQueueManager.addJob(JobType.CACHE_WARM, data, options);
  },
};