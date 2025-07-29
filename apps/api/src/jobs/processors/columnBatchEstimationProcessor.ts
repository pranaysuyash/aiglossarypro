/**
 * Column Batch Estimation Job Processor
 * Handles cost and time estimation for column batch operations
 */

import type { Job } from 'bullmq';
import { columnBatchProcessorService } from '../../services/columnBatchProcessorService';
import { costManagementService } from '../../services/costManagementService';
import { log as logger } from '../../utils/logger';
import type { ColumnBatchEstimationJobData, ColumnBatchEstimationJobResult } from '../types';

export async function columnBatchEstimationProcessor(
  job: Job<ColumnBatchEstimationJobData>
): Promise<ColumnBatchEstimationJobResult> {
  const _startTime = Date.now();
  const {
    sectionName,
    termIds,
    categories,
    filterOptions,
    model = 'gpt-3.5-turbo',
    temperature = 0.7,
    maxTokens = 1000,
    userId,
  } = job.data;

  logger.info(`Starting column batch estimation job ${job.id} for section: ${sectionName}`);

  try {
    // Update job progress
    await job.updateProgress({
      progress: 10,
      message: 'Analyzing eligible terms for batch processing',
      stage: 'analysis',
      details: {
        sectionName,
        model,
        filterCriteria: {
          termIds: termIds?.length,
          categories: categories?.length,
          hasFilterOptions: !!filterOptions,
        },
      },
    });

    // Create a batch request for estimation
    const batchRequest = {
      sectionName,
      termIds,
      categories,
      filterOptions,
      processingOptions: {
        batchSize: 50, // Default for estimation
        model,
        temperature,
        maxTokens,
        regenerateExisting: false,
      },
      metadata: {
        initiatedBy: userId || 'system',
      },
    };

    await job.updateProgress({
      progress: 30,
      message: 'Calculating cost estimates',
      stage: 'cost_calculation',
    });

    // Get cost estimate from the batch processor service
    const costEstimate = await columnBatchProcessorService.estimateBatchCosts(batchRequest);

    await job.updateProgress({
      progress: 60,
      message: 'Analyzing historical performance data',
      stage: 'historical_analysis',
    });

    // Get detailed cost estimation from cost management service
    const detailedEstimate = await costManagementService.estimateCost(
      'generate_content',
      model,
      Math.floor(costEstimate.estimatedTokensPerTerm * 0.3), // Estimated prompt tokens
      Math.floor(costEstimate.estimatedTokensPerTerm * 0.7), // Estimated completion tokens
      true // Use historical data
    );

    await job.updateProgress({
      progress: 80,
      message: 'Generating processing time estimates',
      stage: 'time_estimation',
    });

    // Calculate processing time estimates
    const averageTimePerTerm = 30; // seconds - base estimate
    const batchOverhead = 0.2; // 20% overhead for batch processing
    const queueTime = Math.min(costEstimate.totalTerms * 2, 300); // Max 5 minutes queue time

    const baseProcessingTime = costEstimate.totalTerms * averageTimePerTerm;
    const estimatedProcessingTime = baseProcessingTime * (1 + batchOverhead) + queueTime;

    await job.updateProgress({
      progress: 95,
      message: 'Finalizing estimation report',
      stage: 'finalization',
    });

    // Combine recommendations
    const recommendations = [...costEstimate.recommendations, ...detailedEstimate.recommendations];

    // Add processing-specific recommendations
    if (costEstimate.totalTerms > 1000) {
      recommendations.push(
        'Consider processing in multiple smaller batches for better monitoring and control'
      );
    }

    if (estimatedProcessingTime > 3600) {
      // More than 1 hour
      recommendations.push(
        'This operation will take over 1 hour - consider scheduling during off-peak hours'
      );
    }

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (detailedEstimate.confidence === 'high' && costEstimate.totalTerms < 500) {
      confidence = 'high';
    } else if (costEstimate.totalTerms > 2000 || detailedEstimate.confidence === 'low') {
      confidence = 'low';
    }

    const result: ColumnBatchEstimationJobResult = {
      sectionName,
      totalTerms: costEstimate.totalTerms,
      estimatedCost: costEstimate.totalEstimatedCost,
      estimatedTokens: costEstimate.totalTerms * costEstimate.estimatedTokensPerTerm,
      estimatedProcessingTime,
      costBreakdown: costEstimate.costBreakdown,
      recommendations: [...new Set(recommendations)], // Remove duplicates
      confidence,
      basedOn: `${costEstimate.totalTerms} terms, ${detailedEstimate.basedOn}`,
    };

    await job.updateProgress({
      progress: 100,
      message: 'Estimation completed successfully',
      stage: 'completed',
      details: {
        totalTerms: result.totalTerms,
        estimatedCost: result.estimatedCost,
        estimatedTime: result.estimatedProcessingTime,
        confidence: result.confidence,
      },
    });

    logger.info(`Column batch estimation job ${job.id} completed:`, {
      sectionName,
      totalTerms: result.totalTerms,
      estimatedCost: result.estimatedCost,
      estimatedTime: result.estimatedProcessingTime,
      confidence: result.confidence,
    });

    return result;
  } catch (error) {
    logger.error(`Column batch estimation job ${job.id} failed:`, {
      error: error instanceof Error ? error.message : String(error),
      sectionName,
      model,
    });

    throw error;
  }
}
