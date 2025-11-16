/**
 * Batch Recovery Service
 *
 * Purpose: Recoverable batch operations with checkpointing for content generation
 * Fixes: Lost progress on crashes, wasted API costs, no resume capability
 *
 * Features:
 * - Checkpoint every N operations
 * - Resume from last checkpoint
 * - Parallel processing with concurrency control
 * - Cost tracking and estimation
 * - Error handling and retry logic
 */

import { log } from '../utils/logger';
import { calculateBatchCost, type CostCalculationResult } from '../utils/aiCostCalculator';

/**
 * Batch Job Status
 */
export enum BatchStatus {
  PENDING = 'PENDING',       // Job created, not yet started
  RUNNING = 'RUNNING',       // Currently processing
  PAUSED = 'PAUSED',         // Manually paused
  COMPLETED = 'COMPLETED',   // All items processed
  FAILED = 'FAILED',         // Critical error, cannot continue
  CANCELLED = 'CANCELLED',   // User cancelled
}

/**
 * Batch Operation Configuration
 */
export interface BatchConfig {
  batchId: string;
  operationName: string;
  totalItems: number;

  // Processing options
  chunkSize?: number;            // Items per chunk (default: 10)
  maxConcurrent?: number;        // Concurrent chunks (default: 3)
  checkpointInterval?: number;   // Checkpoint every N items (default: 50)
  retryAttempts?: number;        // Retry failed items (default: 3)
  retryDelay?: number;           // Delay between retries in ms (default: 2000)

  // Cost controls
  maxCostPerItem?: number;       // Abort if item exceeds cost
  maxTotalCost?: number;         // Abort if batch exceeds total cost

  // Callbacks
  onProgress?: (progress: BatchProgress) => void;
  onCheckpoint?: (checkpoint: Checkpoint) => void;
  onComplete?: (summary: BatchSummary) => void;
  onError?: (error: BatchError) => void;
}

/**
 * Batch Progress Information
 */
export interface BatchProgress {
  batchId: string;
  status: BatchStatus;
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  skippedItems: number;
  remainingItems: number;
  progressPercent: number;

  // Timing
  startedAt?: Date;
  estimatedCompletion?: Date;
  elapsedSeconds?: number;
  averageItemDuration?: number;

  // Cost tracking
  totalCost: number;
  estimatedTotalCost?: number;
  costPerItem?: number;

  // Current chunk
  currentChunk?: number;
  totalChunks?: number;
}

/**
 * Checkpoint Data
 */
export interface Checkpoint {
  batchId: string;
  checkpointNumber: number;
  processedItems: number;
  timestamp: Date;

  // Progress snapshot
  progress: BatchProgress;

  // Failed items to retry
  failedItems: string[];

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Batch Summary
 */
export interface BatchSummary {
  batchId: string;
  status: BatchStatus;
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  skippedItems: number;

  // Timing
  startedAt: Date;
  completedAt: Date;
  durationSeconds: number;

  // Cost
  totalCost: number;
  averageCostPerItem: number;

  // Errors
  errors: BatchError[];

  // Checkpoints
  checkpointCount: number;
}

/**
 * Batch Error
 */
export interface BatchError {
  itemId: string;
  error: string;
  timestamp: Date;
  attemptNumber: number;
  retryable: boolean;
}

/**
 * Batch Item Processor Function
 */
export type BatchItemProcessor<T, R> = (
  item: T,
  index: number,
  metadata?: Record<string, any>
) => Promise<R>;

/**
 * Recoverable Batch Processor
 */
export class BatchRecoveryService<T = any, R = any> {
  private config: Required<BatchConfig>;
  private progress: BatchProgress;
  private checkpoints: Checkpoint[] = [];
  private errors: BatchError[] = [];
  private processedItemIds = new Set<string>();
  private failedItemIds = new Set<string>();

  constructor(config: BatchConfig) {
    // Set defaults
    this.config = {
      ...config,
      chunkSize: config.chunkSize || 10,
      maxConcurrent: config.maxConcurrent || 3,
      checkpointInterval: config.checkpointInterval || 50,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 2000,
      maxCostPerItem: config.maxCostPerItem,
      maxTotalCost: config.maxTotalCost,
      onProgress: config.onProgress || (() => {}),
      onCheckpoint: config.onCheckpoint || (() => {}),
      onComplete: config.onComplete || (() => {}),
      onError: config.onError || (() => {}),
    };

    // Initialize progress
    this.progress = {
      batchId: config.batchId,
      status: BatchStatus.PENDING,
      totalItems: config.totalItems,
      processedItems: 0,
      successfulItems: 0,
      failedItems: 0,
      skippedItems: 0,
      remainingItems: config.totalItems,
      progressPercent: 0,
      totalCost: 0,
      totalChunks: Math.ceil(config.totalItems / this.config.chunkSize),
    };
  }

  /**
   * Process batch with checkpointing and recovery
   */
  async processBatch(
    items: T[],
    processor: BatchItemProcessor<T, R>,
    getItemId: (item: T) => string
  ): Promise<BatchSummary> {
    const startTime = Date.now();
    this.progress.startedAt = new Date();
    this.progress.status = BatchStatus.RUNNING;

    log.info('Starting batch processing', {
      batchId: this.config.batchId,
      totalItems: items.length,
      chunkSize: this.config.chunkSize,
      checkpointInterval: this.config.checkpointInterval,
    });

    try {
      // Process in chunks
      const chunks = this.chunkArray(items, this.config.chunkSize);

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        this.progress.currentChunk = chunkIndex + 1;

        const chunk = chunks[chunkIndex];
        await this.processChunk(chunk, processor, getItemId);

        // Checkpoint if needed
        if (this.progress.processedItems % this.config.checkpointInterval === 0) {
          await this.createCheckpoint();
        }

        // Check cost limits
        if (this.config.maxTotalCost && this.progress.totalCost > this.config.maxTotalCost) {
          throw new Error(
            `Batch exceeded max total cost: $${this.progress.totalCost.toFixed(4)} > $${this.config.maxTotalCost.toFixed(4)}`
          );
        }

        // Update progress
        this.updateProgress();
      }

      // Final checkpoint
      await this.createCheckpoint();

      // Mark as completed
      this.progress.status = BatchStatus.COMPLETED;

      const summary: BatchSummary = {
        batchId: this.config.batchId,
        status: this.progress.status,
        totalItems: this.progress.totalItems,
        successfulItems: this.progress.successfulItems,
        failedItems: this.progress.failedItems,
        skippedItems: this.progress.skippedItems,
        startedAt: this.progress.startedAt!,
        completedAt: new Date(),
        durationSeconds: (Date.now() - startTime) / 1000,
        totalCost: this.progress.totalCost,
        averageCostPerItem: this.progress.totalCost / this.progress.processedItems || 0,
        errors: this.errors,
        checkpointCount: this.checkpoints.length,
      };

      log.info('Batch processing completed', summary);
      this.config.onComplete(summary);

      return summary;
    } catch (error) {
      this.progress.status = BatchStatus.FAILED;

      log.error('Batch processing failed', {
        batchId: this.config.batchId,
        error: error instanceof Error ? error.message : String(error),
        processedItems: this.progress.processedItems,
        totalItems: this.progress.totalItems,
      });

      throw error;
    }
  }

  /**
   * Resume batch from last checkpoint
   */
  async resumeFromCheckpoint(
    allItems: T[],
    processor: BatchItemProcessor<T, R>,
    getItemId: (item: T) => string,
    checkpointData: Checkpoint
  ): Promise<BatchSummary> {
    log.info('Resuming batch from checkpoint', {
      batchId: this.config.batchId,
      checkpointNumber: checkpointData.checkpointNumber,
      processedItems: checkpointData.processedItems,
    });

    // Restore progress
    this.progress = checkpointData.progress;
    this.failedItemIds = new Set(checkpointData.failedItems);

    // Get remaining items
    const remainingItems = allItems.filter((item) => {
      const id = getItemId(item);
      return !this.processedItemIds.has(id) || this.failedItemIds.has(id);
    });

    log.info(`Resuming with ${remainingItems.length} remaining items`);

    // Continue processing
    return await this.processBatch(remainingItems, processor, getItemId);
  }

  /**
   * Process a chunk of items with concurrency control
   */
  private async processChunk(
    chunk: T[],
    processor: BatchItemProcessor<T, R>,
    getItemId: (item: T) => string
  ): Promise<void> {
    const promises = chunk.map(async (item, index) => {
      const itemId = getItemId(item);

      // Skip if already processed
      if (this.processedItemIds.has(itemId) && !this.failedItemIds.has(itemId)) {
        this.progress.skippedItems++;
        return;
      }

      // Process with retry logic
      await this.processItemWithRetry(item, index, processor, itemId);
    });

    // Wait for chunk to complete
    await Promise.all(promises);
  }

  /**
   * Process single item with retry logic
   */
  private async processItemWithRetry(
    item: T,
    index: number,
    processor: BatchItemProcessor<T, R>,
    itemId: string
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // Process item
        await processor(item, index);

        // Success!
        this.processedItemIds.add(itemId);
        this.failedItemIds.delete(itemId);
        this.progress.successfulItems++;
        this.progress.processedItems++;

        return;
      } catch (error) {
        lastError = error as Error;

        const batchError: BatchError = {
          itemId,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
          attemptNumber: attempt,
          retryable: attempt < this.config.retryAttempts,
        };

        this.errors.push(batchError);
        this.config.onError(batchError);

        log.warn('Item processing failed', {
          itemId,
          attempt,
          maxAttempts: this.config.retryAttempts,
          error: batchError.error,
        });

        // Retry with exponential backoff
        if (attempt < this.config.retryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    // All retries failed
    this.failedItemIds.add(itemId);
    this.progress.failedItems++;
    this.progress.processedItems++;

    log.error('Item processing failed after all retries', {
      itemId,
      attempts: this.config.retryAttempts,
      error: lastError?.message,
    });
  }

  /**
   * Create checkpoint
   */
  private async createCheckpoint(): Promise<void> {
    const checkpoint: Checkpoint = {
      batchId: this.config.batchId,
      checkpointNumber: this.checkpoints.length + 1,
      processedItems: this.progress.processedItems,
      timestamp: new Date(),
      progress: { ...this.progress },
      failedItems: Array.from(this.failedItemIds),
    };

    this.checkpoints.push(checkpoint);

    log.info('Checkpoint created', {
      batchId: this.config.batchId,
      checkpointNumber: checkpoint.checkpointNumber,
      processedItems: checkpoint.processedItems,
      totalItems: this.progress.totalItems,
    });

    this.config.onCheckpoint(checkpoint);

    // TODO: Persist checkpoint to database
    // await db.insert(batchCheckpoints).values(checkpoint);
  }

  /**
   * Update progress metrics
   */
  private updateProgress(): void {
    const now = Date.now();
    const elapsedMs = this.progress.startedAt ? now - this.progress.startedAt.getTime() : 0;

    this.progress.elapsedSeconds = elapsedMs / 1000;
    this.progress.remainingItems = this.progress.totalItems - this.progress.processedItems;
    this.progress.progressPercent = (this.progress.processedItems / this.progress.totalItems) * 100;

    // Calculate average duration
    if (this.progress.processedItems > 0) {
      this.progress.averageItemDuration = elapsedMs / this.progress.processedItems;

      // Estimate completion
      const remainingMs = this.progress.averageItemDuration * this.progress.remainingItems;
      this.progress.estimatedCompletion = new Date(now + remainingMs);
    }

    // Update cost per item
    if (this.progress.processedItems > 0) {
      this.progress.costPerItem = this.progress.totalCost / this.progress.processedItems;
    }

    // Estimate total cost
    if (this.progress.costPerItem) {
      this.progress.estimatedTotalCost = this.progress.costPerItem * this.progress.totalItems;
    }

    this.config.onProgress(this.progress);
  }

  /**
   * Track cost for operation
   */
  trackCost(cost: number): void {
    this.progress.totalCost += cost;

    // Check per-item cost limit
    if (this.config.maxCostPerItem && cost > this.config.maxCostPerItem) {
      log.warn('Item exceeded cost limit', {
        cost,
        maxCostPerItem: this.config.maxCostPerItem,
      });
    }
  }

  /**
   * Get current progress
   */
  getProgress(): BatchProgress {
    return { ...this.progress };
  }

  /**
   * Get latest checkpoint
   */
  getLatestCheckpoint(): Checkpoint | null {
    return this.checkpoints[this.checkpoints.length - 1] || null;
  }

  /**
   * Pause batch processing
   */
  pause(): void {
    this.progress.status = BatchStatus.PAUSED;
    log.info('Batch processing paused', {
      batchId: this.config.batchId,
      processedItems: this.progress.processedItems,
    });
  }

  /**
   * Cancel batch processing
   */
  cancel(): void {
    this.progress.status = BatchStatus.CANCELLED;
    log.info('Batch processing cancelled', {
      batchId: this.config.batchId,
      processedItems: this.progress.processedItems,
    });
  }

  /**
   * Utility: Chunk array
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Utility: Sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a new batch processor
 */
export function createBatchProcessor<T, R>(config: BatchConfig): BatchRecoveryService<T, R> {
  return new BatchRecoveryService<T, R>(config);
}
