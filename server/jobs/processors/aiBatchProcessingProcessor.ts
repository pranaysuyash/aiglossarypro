/**
 * AI Batch Processing Job Processor
 * Handles batch AI processing for multiple terms
 */

import { Job } from 'bullmq';
import { AIBatchProcessingJobData } from '../types';
import { jobQueueManager, JobType } from '../queue';
import { log as logger } from '../../utils/logger';

interface AIBatchProcessingJobResult {
  totalTerms: number;
  processedTerms: number;
  failedTerms: number;
  subJobIds: string[];
  totalTokensUsed: number;
  totalCost: number;
  duration: number;
  [key: string]: unknown;
}

export async function aiBatchProcessingProcessor(
  job: Job<AIBatchProcessingJobData>
): Promise<AIBatchProcessingJobResult> {
  const startTime = Date.now();
  const { terms, sections, batchSize, costLimit = Infinity, userId } = job.data;

  logger.info(`Starting AI batch processing job ${job.id} for ${terms.length} terms`);

  const result: AIBatchProcessingJobResult = {
    totalTerms: terms.length,
    processedTerms: 0,
    failedTerms: 0,
    subJobIds: [],
    totalTokensUsed: 0,
    totalCost: 0,
    duration: 0,
  };

  try {
    // Create sub-jobs for each batch
    const batches = [];
    for (let i = 0; i < terms.length; i += batchSize) {
      batches.push(terms.slice(i, i + batchSize));
    }

    await job.updateProgress({
      progress: 5,
      message: `Created ${batches.length} batches for processing`,
      stage: 'initialization',
      details: {
        totalBatches: batches.length,
        termsPerBatch: batchSize,
      },
    });

    // Process batches with cost monitoring
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      // Check cost limit
      if (result.totalCost >= costLimit) {
        logger.warn(`Cost limit reached: ${result.totalCost} >= ${costLimit}`);
        break;
      }

      await job.updateProgress({
        progress: 5 + (batchIndex / batches.length) * 90,
        message: `Processing batch ${batchIndex + 1}/${batches.length}`,
        stage: 'processing',
        details: {
          currentBatch: batchIndex + 1,
          totalBatches: batches.length,
          processedTerms: result.processedTerms,
          currentCost: result.totalCost,
        },
      });

      // Create individual AI generation jobs for each term in the batch
      const jobPromises = batch.map(async (term) => {
        try {
          const jobId = await jobQueueManager.addJob(
            JobType.AI_CONTENT_GENERATION,
            {
              termId: term.id,
              termName: term.name,
              sections,
              userId,
              metadata: {
                batchJobId: job.id,
                batchIndex,
              },
            },
            {
              priority: 3, // Normal priority
              attempts: 2,
            }
          );

          result.subJobIds.push(jobId);
          return jobId;
        } catch (error) {
          logger.error(`Failed to create AI job for term ${term.id}:`, { error: error instanceof Error ? error.message : String(error) });
          result.failedTerms++;
          return null;
        }
      });

      const createdJobIds = (await Promise.all(jobPromises)).filter(id => id !== null);

      // Wait for batch completion with timeout
      const batchTimeout = 300000; // 5 minutes per batch
      const batchStartTime = Date.now();

      while (Date.now() - batchStartTime < batchTimeout) {
        const jobStatuses = await Promise.all(
          createdJobIds.map(id => jobQueueManager.getJobStatus(JobType.AI_CONTENT_GENERATION, id!))
        );

        const completed = jobStatuses.filter(status => 
          status && (status.state === 'completed' || status.state === 'failed')
        );

        if (completed.length === createdJobIds.length) {
          // All jobs in batch completed
          break;
        }

        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Collect results from completed jobs
      const batchResults = await Promise.all(
        createdJobIds.map(async (jobId) => {
          if (!jobId) return null;
          
          const status = await jobQueueManager.getJobStatus(JobType.AI_CONTENT_GENERATION, jobId);
          if (status?.state === 'completed' && status.result) {
            result.processedTerms++;
            result.totalTokensUsed += status.result.tokensUsed || 0;
            result.totalCost += status.result.cost || 0;
            return status.result;
          } else if (status?.state === 'failed') {
            result.failedTerms++;
          }
          return null;
        })
      );

      logger.info(`Batch ${batchIndex + 1} completed:`, {
        processed: batchResults.filter(r => r !== null).length,
        failed: batch.length - batchResults.filter(r => r !== null).length,
        totalCost: result.totalCost,
      });
    }

    // Final progress update
    await job.updateProgress({
      progress: 95,
      message: 'Finalizing batch processing',
      stage: 'finalization',
    });

    result.duration = Date.now() - startTime;

    await job.updateProgress({
      progress: 100,
      message: 'Batch processing completed',
      stage: 'completed',
      details: {
        totalTerms: result.totalTerms,
        processedTerms: result.processedTerms,
        failedTerms: result.failedTerms,
        totalCost: result.totalCost,
        duration: result.duration,
      },
    });

    logger.info(`AI batch processing job ${job.id} completed`, result);
    return result;

  } catch (error) {
    logger.error(`AI batch processing job ${job.id} failed:`, { error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}