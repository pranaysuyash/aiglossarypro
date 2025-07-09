/**
 * Column Batch Monitoring Job Processor
 * Monitors active batch operations and triggers alerts
 */

import type { Job } from 'bullmq';
import { columnBatchProcessorService } from '../../services/columnBatchProcessorService';
import { log as logger } from '../../utils/logger';
import type { ColumnBatchMonitoringJobData, ColumnBatchMonitoringJobResult } from '../types';

export async function columnBatchMonitoringProcessor(
  job: Job<ColumnBatchMonitoringJobData>
): Promise<ColumnBatchMonitoringJobResult> {
  const _startTime = Date.now();
  const {
    operationIds,
    checkInterval = 30000, // 30 seconds default
    alertThresholds = {
      staleTimeMinutes: 30,
      costWarningThreshold: 0.8, // 80%
      errorRateThreshold: 0.2, // 20%
    },
    userId,
  } = job.data;

  logger.info(
    `Starting column batch monitoring job ${job.id} for ${operationIds.length} operations`
  );

  const result: ColumnBatchMonitoringJobResult = {
    monitoredOperations: operationIds.length,
    activeOperations: 0,
    completedOperations: 0,
    failedOperations: 0,
    alertsTriggered: 0,
    systemHealth: 'healthy',
    recommendations: [],
  };

  try {
    await job.updateProgress({
      progress: 10,
      message: `Starting monitoring of ${operationIds.length} operations`,
      stage: 'initialization',
      details: {
        operationIds: operationIds.length,
        checkInterval,
        alertThresholds,
      },
    });

    const monitoringResults = {
      staleOperations: [] as string[],
      costWarnings: [] as string[],
      highErrorRates: [] as string[],
      systemIssues: [] as string[],
    };

    // Monitor each operation
    for (let i = 0; i < operationIds.length; i++) {
      const operationId = operationIds[i];

      await job.updateProgress({
        progress: 10 + (i / operationIds.length) * 70,
        message: `Monitoring operation ${i + 1}/${operationIds.length}`,
        stage: 'monitoring',
        details: {
          currentOperation: operationId,
          processed: i,
          total: operationIds.length,
        },
      });

      try {
        const operation = columnBatchProcessorService.getOperationStatus(operationId);

        if (!operation) {
          logger.warn(`Operation ${operationId} not found during monitoring`);
          continue;
        }

        // Count operation status
        switch (operation.status) {
          case 'running':
          case 'pending':
          case 'paused':
            result.activeOperations++;
            break;
          case 'completed':
            result.completedOperations++;
            break;
          case 'failed':
          case 'cancelled':
            result.failedOperations++;
            break;
        }

        // Check for stale operations
        if (operation.timing.lastActivity) {
          const lastActivityMinutes =
            (Date.now() - operation.timing.lastActivity.getTime()) / (1000 * 60);
          if (
            lastActivityMinutes > alertThresholds.staleTimeMinutes &&
            (operation.status === 'running' || operation.status === 'pending')
          ) {
            monitoringResults.staleOperations.push(operationId);
            result.alertsTriggered++;

            logger.warn(
              `Stale operation detected: ${operationId} (${lastActivityMinutes.toFixed(1)} minutes inactive)`
            );
          }
        }

        // Check cost warnings
        if (operation.costs.budgetUsed >= alertThresholds.costWarningThreshold * 100) {
          monitoringResults.costWarnings.push(operationId);
          result.alertsTriggered++;

          logger.warn(
            `Cost warning for operation ${operationId}: ${operation.costs.budgetUsed.toFixed(1)}% of budget used`
          );
        }

        // Check error rates
        const totalProcessed = operation.progress.processedTerms + operation.progress.failedTerms;
        if (totalProcessed > 10) {
          // Only check if we have meaningful data
          const errorRate = operation.progress.failedTerms / totalProcessed;
          if (errorRate >= alertThresholds.errorRateThreshold) {
            monitoringResults.highErrorRates.push(operationId);
            result.alertsTriggered++;

            logger.warn(
              `High error rate for operation ${operationId}: ${(errorRate * 100).toFixed(1)}%`
            );
          }
        }
      } catch (error) {
        logger.error(`Error monitoring operation ${operationId}:`, {
          error: error instanceof Error ? error.message : String(error),
        });
        monitoringResults.systemIssues.push(operationId);
      }
    }

    await job.updateProgress({
      progress: 85,
      message: 'Analyzing system health',
      stage: 'health_analysis',
    });

    // Determine system health
    const totalIssues =
      monitoringResults.staleOperations.length +
      monitoringResults.costWarnings.length +
      monitoringResults.highErrorRates.length +
      monitoringResults.systemIssues.length;

    if (totalIssues === 0) {
      result.systemHealth = 'healthy';
    } else if (totalIssues <= 2 || totalIssues < operationIds.length * 0.2) {
      result.systemHealth = 'warning';
    } else {
      result.systemHealth = 'critical';
    }

    // Generate recommendations
    if (monitoringResults.staleOperations.length > 0) {
      result.recommendations.push(
        `${monitoringResults.staleOperations.length} operations appear stale - consider investigating or restarting them`
      );
    }

    if (monitoringResults.costWarnings.length > 0) {
      result.recommendations.push(
        `${monitoringResults.costWarnings.length} operations approaching budget limits - review cost controls`
      );
    }

    if (monitoringResults.highErrorRates.length > 0) {
      result.recommendations.push(
        `${monitoringResults.highErrorRates.length} operations have high error rates - check data quality and processing parameters`
      );
    }

    if (monitoringResults.systemIssues.length > 0) {
      result.recommendations.push(
        `${monitoringResults.systemIssues.length} operations had monitoring issues - check system health`
      );
    }

    // Add general recommendations based on system state
    if (result.activeOperations > 5) {
      result.recommendations.push(
        'High number of active operations - consider resource monitoring'
      );
    }

    if (result.failedOperations > result.completedOperations && result.failedOperations > 0) {
      result.recommendations.push(
        'More operations are failing than completing - review system configuration'
      );
    }

    await job.updateProgress({
      progress: 95,
      message: 'Generating monitoring report',
      stage: 'reporting',
    });

    // Log monitoring summary
    logger.info(`Monitoring completed for ${operationIds.length} operations:`, {
      active: result.activeOperations,
      completed: result.completedOperations,
      failed: result.failedOperations,
      alertsTriggered: result.alertsTriggered,
      systemHealth: result.systemHealth,
    });

    await job.updateProgress({
      progress: 100,
      message: 'Monitoring completed',
      stage: 'completed',
      details: {
        monitoredOperations: result.monitoredOperations,
        alertsTriggered: result.alertsTriggered,
        systemHealth: result.systemHealth,
        recommendationCount: result.recommendations.length,
      },
    });

    return result;
  } catch (error) {
    logger.error(`Column batch monitoring job ${job.id} failed:`, {
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}
