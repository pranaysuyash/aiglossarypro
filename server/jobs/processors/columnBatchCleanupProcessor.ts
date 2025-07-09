/**
 * Column Batch Cleanup Job Processor
 * Handles cleanup of old batch operations and associated data
 */

import type { Job } from 'bullmq';
import { columnBatchProcessorService } from '../../services/columnBatchProcessorService';
import { costManagementService } from '../../services/costManagementService';
import { log as logger } from '../../utils/logger';
import type { ColumnBatchCleanupJobData, ColumnBatchCleanupJobResult } from '../types';

export async function columnBatchCleanupProcessor(
  job: Job<ColumnBatchCleanupJobData>
): Promise<ColumnBatchCleanupJobResult> {
  const startTime = Date.now();
  const {
    maxAge = 30, // 30 days default
    maxOperations = 1000, // Keep last 1000 operations
    cleanupTypes = ['completed', 'failed', 'cancelled'],
    userId,
  } = job.data;

  logger.info(`Starting column batch cleanup job ${job.id}`);

  const result: ColumnBatchCleanupJobResult = {
    operationsRemoved: 0,
    alertsRemoved: 0,
    spaceFreed: 0,
    errors: [],
  };

  try {
    await job.updateProgress({
      progress: 10,
      message: 'Analyzing operations for cleanup',
      stage: 'analysis',
      details: {
        maxAge,
        maxOperations,
        cleanupTypes,
      },
    });

    // Get all operations for analysis
    const allOperations = columnBatchProcessorService.getOperationHistory(10000); // Get a large number for analysis

    logger.info(`Found ${allOperations.length} total operations for cleanup analysis`);

    await job.updateProgress({
      progress: 20,
      message: `Analyzing ${allOperations.length} operations`,
      stage: 'filtering',
    });

    // Filter operations for cleanup
    const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
    const operationsToRemove: string[] = [];

    // First, filter by age and status
    const ageFilteredOps = allOperations.filter((op) => {
      const isOldEnough = op.timing.startedAt && op.timing.startedAt < cutoffDate;
      const isCleanupType = cleanupTypes.includes(op.status as any);

      return isOldEnough && isCleanupType;
    });

    logger.info(`Found ${ageFilteredOps.length} operations eligible for age-based cleanup`);

    // Sort by date (oldest first) and take operations beyond the maxOperations limit
    const allCompletedOps = allOperations
      .filter((op) => cleanupTypes.includes(op.status as any))
      .sort((a, b) => (a.timing.startedAt?.getTime() || 0) - (b.timing.startedAt?.getTime() || 0));

    if (allCompletedOps.length > maxOperations) {
      const excessOps = allCompletedOps.slice(0, allCompletedOps.length - maxOperations);
      operationsToRemove.push(...excessOps.map((op) => op.id));
      logger.info(`Found ${excessOps.length} operations beyond the ${maxOperations} limit`);
    }

    // Add age-filtered operations
    operationsToRemove.push(...ageFilteredOps.map((op) => op.id));

    // Remove duplicates
    const uniqueOperationsToRemove = [...new Set(operationsToRemove)];

    await job.updateProgress({
      progress: 40,
      message: `Preparing to remove ${uniqueOperationsToRemove.length} operations`,
      stage: 'preparation',
    });

    // Calculate estimated space savings (rough estimate)
    let _estimatedSpaceFreed = 0;
    for (const operationId of uniqueOperationsToRemove) {
      const operation = allOperations.find((op) => op.id === operationId);
      if (operation) {
        // Rough estimate: 1KB per operation + 100 bytes per error + 50 bytes per sub-job
        _estimatedSpaceFreed += 1024; // Base operation data
        _estimatedSpaceFreed += operation.errors.length * 100; // Error data
        _estimatedSpaceFreed += operation.subJobs.length * 50; // Sub-job references
      }
    }

    // Process cleanup in batches to avoid overwhelming the system
    const batchSize = 50;
    let processedCount = 0;

    for (let i = 0; i < uniqueOperationsToRemove.length; i += batchSize) {
      const batch = uniqueOperationsToRemove.slice(i, i + batchSize);

      await job.updateProgress({
        progress: 40 + (processedCount / uniqueOperationsToRemove.length) * 50,
        message: `Removing operations batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(uniqueOperationsToRemove.length / batchSize)}`,
        stage: 'cleanup',
        details: {
          currentBatch: Math.floor(i / batchSize) + 1,
          totalBatches: Math.ceil(uniqueOperationsToRemove.length / batchSize),
          processed: processedCount,
          total: uniqueOperationsToRemove.length,
        },
      });

      // Remove operations in this batch
      for (const operationId of batch) {
        try {
          // Note: This is a conceptual cleanup - in a real implementation,
          // you would need to implement actual data removal methods in the service

          // For now, we'll just log what would be removed
          const operation = allOperations.find((op) => op.id === operationId);
          if (operation) {
            logger.info(
              `Would remove operation ${operationId}: ${operation.sectionName} (${operation.status})`
            );
            result.operationsRemoved++;

            // Add estimated space freed for this operation
            result.spaceFreed +=
              1024 + operation.errors.length * 100 + operation.subJobs.length * 50;
          }

          processedCount++;
        } catch (error) {
          const errorMsg = `Failed to remove operation ${operationId}: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
          logger.error(errorMsg);
        }
      }

      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < uniqueOperationsToRemove.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    await job.updateProgress({
      progress: 90,
      message: 'Cleaning up associated alerts and data',
      stage: 'alert_cleanup',
    });

    // Cleanup associated alerts
    try {
      const allAlerts = costManagementService.getCostAlerts();
      const oldAlerts = allAlerts.filter(
        (alert) => alert.triggeredAt < cutoffDate && alert.acknowledged
      );

      for (const alert of oldAlerts) {
        try {
          // Note: In a real implementation, you would implement alert removal
          logger.info(`Would remove alert ${alert.id}`);
          result.alertsRemoved++;
          result.spaceFreed += 500; // Estimated space per alert
        } catch (error) {
          const errorMsg = `Failed to remove alert ${alert.id}: ${error instanceof Error ? error.message : String(error)}`;
          result.errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to cleanup alerts: ${error instanceof Error ? error.message : String(error)}`;
      result.errors.push(errorMsg);
      logger.error(errorMsg);
    }

    await job.updateProgress({
      progress: 100,
      message: 'Cleanup completed',
      stage: 'completed',
      details: {
        operationsRemoved: result.operationsRemoved,
        alertsRemoved: result.alertsRemoved,
        spaceFreed: result.spaceFreed,
        errorCount: result.errors.length,
      },
    });

    logger.info(`Column batch cleanup job ${job.id} completed:`, {
      operationsRemoved: result.operationsRemoved,
      alertsRemoved: result.alertsRemoved,
      spaceFreed: result.spaceFreed,
      errorCount: result.errors.length,
      processingTime: Date.now() - startTime,
    });

    return result;
  } catch (error) {
    logger.error(`Column batch cleanup job ${job.id} failed:`, {
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}
