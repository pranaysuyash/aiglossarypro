/**
 * Column Batch Processing Job Processor
 * Handles comprehensive column-wise batch processing operations
 */

import type { Job } from 'bullmq';
import { columnBatchProcessorService } from '../../services/columnBatchProcessorService';
import { costManagementService } from '../../services/costManagementService';
import { log as logger } from '../../utils/logger';
import type { ColumnBatchProcessingJobData, ColumnBatchProcessingJobResult } from '../types';

export async function columnBatchProcessingProcessor(
  job: Job<ColumnBatchProcessingJobData>
): Promise<ColumnBatchProcessingJobResult> {
  const startTime = Date.now();
  const {
    operationId,
    sectionName,
    termIds,
    batchConfiguration,
    costLimits,
    notificationOptions,
    userId,
  } = job.data;

  logger.info(`Starting column batch processing job ${job.id} for operation ${operationId}`);

  const result: ColumnBatchProcessingJobResult = {
    operationId,
    sectionName,
    totalTerms: termIds.length,
    processedTerms: 0,
    failedTerms: 0,
    skippedTerms: 0,
    totalCost: 0,
    totalTokens: 0,
    processingTime: 0,
    subJobIds: [],
    costBreakdown: {},
    errors: [],
  };

  try {
    // Update job progress - initialization
    await job.updateProgress({
      progress: 5,
      message: `Initializing batch processing for ${termIds.length} terms`,
      stage: 'initialization',
      details: {
        operationId,
        sectionName,
        totalTerms: termIds.length,
        batchSize: batchConfiguration.batchSize,
      },
    });

    // Check if operation exists in the service
    const operation = columnBatchProcessorService.getOperationStatus(operationId);
    if (!operation) {
      throw new Error(`Operation ${operationId} not found in batch processor service`);
    }

    // Monitor operation progress
    const progressInterval = setInterval(async () => {
      const currentOperation = columnBatchProcessorService.getOperationStatus(operationId);
      if (currentOperation) {
        await job.updateProgress({
          progress: Math.max(10, currentOperation.progress.completionPercentage * 0.9), // Reserve 10% for finalization
          message: `Processing batch ${currentOperation.progress.currentBatch || 0}/${currentOperation.progress.totalBatches}`,
          stage: 'processing',
          details: {
            operationId,
            processedTerms: currentOperation.progress.processedTerms,
            failedTerms: currentOperation.progress.failedTerms,
            currentCost: currentOperation.costs.actualCost,
            budgetUsed: currentOperation.costs.budgetUsed,
          },
        });

        // Update result with current data
        result.processedTerms = currentOperation.progress.processedTerms;
        result.failedTerms = currentOperation.progress.failedTerms;
        result.skippedTerms = currentOperation.progress.skippedTerms;
        result.totalCost = currentOperation.costs.actualCost;
        result.costBreakdown = currentOperation.costs.costBreakdown;
        result.errors = currentOperation.errors;
        result.subJobIds = currentOperation.subJobs;
      }
    }, 5000); // Update every 5 seconds

    try {
      // Wait for operation completion
      await new Promise<void>((resolve, reject) => {
        const checkInterval = setInterval(() => {
          const currentOperation = columnBatchProcessorService.getOperationStatus(operationId);

          if (!currentOperation) {
            clearInterval(checkInterval);
            reject(new Error(`Operation ${operationId} disappeared during processing`));
            return;
          }

          // Check for completion states
          if (currentOperation.status === 'completed') {
            clearInterval(checkInterval);

            // Update final result
            result.processedTerms = currentOperation.progress.processedTerms;
            result.failedTerms = currentOperation.progress.failedTerms;
            result.skippedTerms = currentOperation.progress.skippedTerms;
            result.totalCost = currentOperation.costs.actualCost;
            result.costBreakdown = currentOperation.costs.costBreakdown;
            result.errors = currentOperation.errors;
            result.subJobIds = currentOperation.subJobs;

            if (currentOperation.result) {
              result.totalTokens = currentOperation.result.totalTokensUsed || 0;
              result.qualityMetrics = currentOperation.result.qualityMetrics;
            }

            resolve();
          } else if (
            currentOperation.status === 'failed' ||
            currentOperation.status === 'cancelled'
          ) {
            clearInterval(checkInterval);
            reject(new Error(`Operation ${operationId} ${currentOperation.status}`));
          }

          // Check for timeout (24 hours max)
          if (Date.now() - startTime > 24 * 60 * 60 * 1000) {
            clearInterval(checkInterval);
            reject(new Error(`Operation ${operationId} timed out after 24 hours`));
          }
        }, 2000); // Check every 2 seconds
      });
    } finally {
      clearInterval(progressInterval);
    }

    // Record cost usage
    if (result.totalCost > 0) {
      await costManagementService.recordCostUsage(
        'column_batch_processing',
        batchConfiguration.model || 'gpt-3.5-turbo',
        0, // Input tokens will be tracked by individual jobs
        0, // Output tokens will be tracked by individual jobs
        userId,
        undefined,
        {
          operationId,
          sectionName,
          termCount: result.totalTerms,
          batchSize: batchConfiguration.batchSize,
        }
      );
    }

    // Send notifications if configured
    if (notificationOptions?.emailOnCompletion) {
      // TODO: Implement email notification
      logger.info(`Email notification should be sent for completed operation ${operationId}`);
    }

    if (notificationOptions?.webhookUrl) {
      // TODO: Implement webhook notification
      logger.info(
        `Webhook notification should be sent to ${notificationOptions.webhookUrl} for operation ${operationId}`
      );
    }

    // Final progress update
    await job.updateProgress({
      progress: 100,
      message: 'Column batch processing completed successfully',
      stage: 'completed',
      details: {
        operationId,
        processedTerms: result.processedTerms,
        failedTerms: result.failedTerms,
        totalCost: result.totalCost,
        processingTime: Date.now() - startTime,
      },
    });

    result.processingTime = Date.now() - startTime;

    logger.info(`Column batch processing job ${job.id} completed:`, {
      operationId,
      processedTerms: result.processedTerms,
      failedTerms: result.failedTerms,
      totalCost: result.totalCost,
      processingTime: result.processingTime,
    });

    return result;
  } catch (error) {
    logger.error(`Column batch processing job ${job.id} failed:`, {
      error: error instanceof Error ? error.message : String(error),
      operationId,
    });

    // Try to get final state even if failed
    const finalOperation = columnBatchProcessorService.getOperationStatus(operationId);
    if (finalOperation) {
      result.processedTerms = finalOperation.progress.processedTerms;
      result.failedTerms = finalOperation.progress.failedTerms;
      result.skippedTerms = finalOperation.progress.skippedTerms;
      result.totalCost = finalOperation.costs.actualCost;
      result.errors = finalOperation.errors;
    }

    result.processingTime = Date.now() - startTime;

    throw error;
  }
}
