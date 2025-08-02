/**
 * Column Batch Processor Service - Phase 2 Enhanced Content Generation System
 *
 * Provides sophisticated batch processing for generating content across multiple terms
 * for specific sections (columns) with comprehensive management and safety features.
 */

import { EventEmitter } from 'node:events';
import { and, eq, inArray, sql } from 'drizzle-orm';
import OpenAI from 'openai';
import {
  aiUsageAnalytics,
  enhancedTerms,
  sectionItems,
  sections,
} from '@aiglossarypro/shared';
import { db } from '@aiglossarypro/database';
import { JobPriority, JobType, jobQueueManager } from '../jobs/queue';
import { log as logger } from '../utils/logger';

// Interfaces for batch processing
export interface ColumnBatchRequest {
  sectionName: string;
  termIds?: string[];
  categories?: string[];
  filterOptions?: {
    hasContent?: boolean;
    isAiGenerated?: boolean;
    verificationStatus?: 'verified' | 'unverified' | 'needs_review';
    lastUpdatedBefore?: Date;
    lastUpdatedAfter?: Date;
  };
  processingOptions: {
    batchSize: number;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    regenerateExisting?: boolean;
    pauseOnError?: boolean;
    maxConcurrentBatches?: number;
  };
  costLimits?: {
    maxTotalCost?: number;
    maxCostPerTerm?: number;
    warningThreshold?: number;
  };
  notificationOptions?: {
    emailOnCompletion?: boolean;
    webhookUrl?: string;
    notifyOnMilestones?: number[]; // Percentage milestones
  };
  metadata?: {
    initiatedBy: string;
    reason?: string;
    tags?: string[];
  };
}

export interface ColumnBatchOperation {
  id: string;
  sectionName: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: {
    totalTerms: number;
    processedTerms: number;
    failedTerms: number;
    skippedTerms: number;
    currentBatch?: number;
    totalBatches: number;
    completionPercentage: number;
  };
  costs: {
    estimatedCost: number;
    actualCost: number;
    costPerTerm: number;
    budgetUsed: number;
    costBreakdown: {
      [model: string]: {
        tokens: number;
        cost: number;
        requests: number;
      };
    };
  };
  timing: {
    startedAt?: Date;
    estimatedCompletion?: Date;
    actualCompletion?: Date;
    pausedAt?: Date;
    lastActivity?: Date;
    averageTimePerTerm?: number;
  };
  errors: Array<{
    termId: string;
    termName: string;
    error: string;
    timestamp: Date;
    retryCount: number;
  }>;
  subJobs: string[];
  configuration: ColumnBatchRequest;
  result?: {
    successCount: number;
    failureCount: number;
    totalTokensUsed: number;
    totalCost: number;
    processingTime: number;
    qualityMetrics?: {
      averageContentLength: number;
      contentQualityScore?: number;
    };
  };
}

export interface BatchCostEstimate {
  totalTerms: number;
  estimatedTokensPerTerm: number;
  estimatedCostPerTerm: number;
  totalEstimatedCost: number;
  worstCaseScenario: number;
  bestCaseScenario: number;
  costBreakdown: {
    [model: string]: {
      tokensPerTerm: number;
      costPerTerm: number;
      totalCost: number;
    };
  };
  recommendations: string[];
}

/**
 * Column Batch Processor Service
 *
 * Main service for handling large-scale batch content generation operations
 * with comprehensive monitoring, cost management, and safety features.
 */
export class ColumnBatchProcessorService extends EventEmitter {
  private operations: Map<string, ColumnBatchOperation> = new Map();
  private openai: OpenAI;
  private readonly MODEL_COSTS = {
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  };

  // Rate limiting and safety configurations
  private readonly RATE_LIMITS = {
    maxOperationsPerHour: 10,
    maxConcurrentOperations: 3,
    defaultBatchSize: 50,
    maxBatchSize: 200,
    minDelayBetweenBatches: 1000, // 1 second
    maxCostPerOperation: 1000, // $1000 default limit
  };

  constructor() {
    super();

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize periodic monitoring
    this.startMonitoring();
  }

  /**
   * Estimate costs for a batch operation before execution
   */
  async estimateBatchCosts(request: ColumnBatchRequest): Promise<BatchCostEstimate> {
    logger.info(`Estimating costs for batch operation: ${request.sectionName}`);

    // Get eligible terms
    const terms = await this.getEligibleTerms(request);
    const totalTerms = terms.length;

    if (totalTerms === 0) {
      throw new Error('No eligible terms found for batch processing');
    }

    // Estimate tokens per term based on section type and historical data
    const estimatedTokensPerTerm = await this.estimateTokensPerTerm(request.sectionName);

    const model = request.processingOptions.model || 'gpt-3.5-turbo';
    const modelCost = this.MODEL_COSTS[model as keyof typeof this.MODEL_COSTS];

    if (!modelCost) {
      throw new Error(`Unknown model: ${model}`);
    }

    // Conservative estimates (assume higher token usage)
    const promptTokens = Math.floor(estimatedTokensPerTerm * 0.3); // 30% for prompt
    const completionTokens = Math.floor(estimatedTokensPerTerm * 0.7); // 70% for completion

    const costPerTerm =
      (promptTokens / 1000) * modelCost.input + (completionTokens / 1000) * modelCost.output;

    const totalEstimatedCost = costPerTerm * totalTerms;
    const worstCaseScenario = totalEstimatedCost * 1.5; // 50% buffer
    const bestCaseScenario = totalEstimatedCost * 0.7; // 30% savings

    const recommendations: string[] = [];

    // Add cost optimization recommendations
    if (totalEstimatedCost > 100) {
      recommendations.push('Consider using gpt-3.5-turbo instead of gpt-4 to reduce costs by ~90%');
    }

    if (totalTerms > 500) {
      recommendations.push(
        'Consider breaking this into multiple smaller batches for better control'
      );
    }

    if (request.processingOptions.batchSize > 100) {
      recommendations.push('Smaller batch sizes provide better error recovery and monitoring');
    }

    const estimate: BatchCostEstimate = {
      totalTerms,
      estimatedTokensPerTerm,
      estimatedCostPerTerm: costPerTerm,
      totalEstimatedCost,
      worstCaseScenario,
      bestCaseScenario,
      costBreakdown: {
        [model]: {
          tokensPerTerm: estimatedTokensPerTerm,
          costPerTerm,
          totalCost: totalEstimatedCost,
        },
      },
      recommendations,
    };

    logger.info(`Cost estimate completed:`, {
      totalTerms,
      estimatedCost: totalEstimatedCost,
      worstCase: worstCaseScenario,
    });

    return estimate;
  }

  /**
   * Start a new column batch operation
   */
  async startBatchOperation(request: ColumnBatchRequest): Promise<string> {
    // Validate request
    await this.validateBatchRequest(request);

    // Check if we've hit rate limits
    await this.checkRateLimits();

    // Generate operation ID
    const operationId = `col-batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get eligible terms
    const terms = await this.getEligibleTerms(request);

    if (terms.length === 0) {
      throw new Error('No eligible terms found for batch processing');
    }

    // Calculate cost estimate
    const costEstimate = await this.estimateBatchCosts(request);

    // Check cost limits
    if (
      request.costLimits?.maxTotalCost &&
      costEstimate.totalEstimatedCost > request.costLimits.maxTotalCost
    ) {
      throw new Error(
        `Estimated cost (${costEstimate.totalEstimatedCost}) exceeds maximum allowed (${request.costLimits.maxTotalCost})`
      );
    }

    // Calculate batches
    const batchSize = Math.min(request.processingOptions.batchSize, this.RATE_LIMITS.maxBatchSize);
    const totalBatches = Math.ceil(terms.length / batchSize);

    // Create operation record
    const operation: ColumnBatchOperation = {
      id: operationId,
      sectionName: request.sectionName,
      status: 'pending',
      progress: {
        totalTerms: terms.length,
        processedTerms: 0,
        failedTerms: 0,
        skippedTerms: 0,
        totalBatches,
        completionPercentage: 0,
      },
      costs: {
        estimatedCost: costEstimate.totalEstimatedCost,
        actualCost: 0,
        costPerTerm: costEstimate.estimatedCostPerTerm,
        budgetUsed: 0,
        costBreakdown: {},
      },
      timing: {
        startedAt: new Date(),
        estimatedCompletion: this.calculateEstimatedCompletion(terms.length, batchSize),
        lastActivity: new Date(),
      },
      errors: [],
      subJobs: [],
      configuration: request,
    };

    // Store operation
    this.operations.set(operationId, operation);

    logger.info(`Starting batch operation ${operationId}:`, {
      sectionName: request.sectionName,
      totalTerms: terms.length,
      estimatedCost: costEstimate.totalEstimatedCost,
      totalBatches,
    });

    // Start processing asynchronously
    this.processBatchOperation(operationId, terms).catch(error => {
      logger.error(`Batch operation ${operationId} failed:`, { error: error.message });
      operation.status = 'failed';
      this.emit('operation:failed', { operationId, error: error.message });
    });

    // Emit event
    this.emit('operation:started', { operationId, operation });

    return operationId;
  }

  /**
   * Pause a running batch operation
   */
  async pauseBatchOperation(operationId: string): Promise<boolean> {
    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }

    if (operation.status !== 'running') {
      throw new Error(`Operation ${operationId} is not running (status: ${operation.status})`);
    }

    operation.status = 'paused';
    operation.timing.pausedAt = new Date();

    // Cancel pending sub-jobs
    for (const subJobId of operation.subJobs) {
      try {
        await jobQueueManager.cancelJob(JobType.AI_CONTENT_GENERATION, subJobId);
      } catch (error) {
        logger.warn(`Failed to cancel sub-job ${subJobId}:`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info(`Batch operation ${operationId} paused`);
    this.emit('operation:paused', { operationId, operation });

    return true;
  }

  /**
   * Resume a paused batch operation
   */
  async resumeBatchOperation(operationId: string): Promise<boolean> {
    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }

    if (operation.status !== 'paused') {
      throw new Error(`Operation ${operationId} is not paused (status: ${operation.status})`);
    }

    operation.status = 'running';
    operation.timing.pausedAt = undefined;
    operation.timing.lastActivity = new Date();

    // Resume processing from where we left off
    const processedTerms = operation.progress.processedTerms + operation.progress.failedTerms;
    const remainingTerms = await this.getEligibleTerms(operation.configuration);
    const termsToProcess = remainingTerms.slice(processedTerms);

    logger.info(
      `Resuming batch operation ${operationId} with ${termsToProcess.length} remaining terms`
    );

    // Continue processing
    this.processBatchOperation(operationId, termsToProcess, true).catch(error => {
      logger.error(`Resumed batch operation ${operationId} failed:`, { error: error.message });
      operation.status = 'failed';
      this.emit('operation:failed', { operationId, error: error.message });
    });

    this.emit('operation:resumed', { operationId, operation });

    return true;
  }

  /**
   * Cancel a batch operation
   */
  async cancelBatchOperation(operationId: string): Promise<boolean> {
    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }

    if (operation.status === 'completed' || operation.status === 'cancelled') {
      return false;
    }

    operation.status = 'cancelled';
    operation.timing.actualCompletion = new Date();

    // Cancel all sub-jobs
    for (const subJobId of operation.subJobs) {
      try {
        await jobQueueManager.cancelJob(JobType.AI_CONTENT_GENERATION, subJobId);
      } catch (error) {
        logger.warn(`Failed to cancel sub-job ${subJobId}:`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info(`Batch operation ${operationId} cancelled`);
    this.emit('operation:cancelled', { operationId, operation });

    return true;
  }

  /**
   * Get operation status and details
   */
  getOperationStatus(operationId: string): ColumnBatchOperation | null {
    return this.operations.get(operationId) || null;
  }

  /**
   * Get all active operations
   */
  getActiveOperations(): ColumnBatchOperation[] {
    return Array.from(this.operations.values()).filter(
      op => op.status === 'running' || op.status === 'paused' || op.status === 'pending'
    );
  }

  /**
   * Get operation history
   */
  getOperationHistory(limit = 50): ColumnBatchOperation[] {
    return Array.from(this.operations.values())
      .sort((a, b) => (b.timing.startedAt?.getTime() || 0) - (a.timing.startedAt?.getTime() || 0))
      .slice(0, limit);
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<{
    activeOperations: number;
    totalOperationsToday: number;
    totalCostToday: number;
    averageOperationTime: number;
    successRate: number;
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const allOperations = Array.from(this.operations.values());
    const todayOperations = allOperations.filter(
      op => op.timing.startedAt && op.timing.startedAt >= todayStart
    );

    const completedOperations = allOperations.filter(op => op.status === 'completed');
    const successfulOperations = completedOperations.filter(
      op => op.result && op.result.successCount > op.result.failureCount
    );

    const averageOperationTime =
      completedOperations.length > 0
        ? completedOperations.reduce((sum, op) => sum + (op.result?.processingTime || 0), 0) /
          completedOperations.length
        : 0;

    return {
      activeOperations: this.getActiveOperations().length,
      totalOperationsToday: todayOperations.length,
      totalCostToday: todayOperations.reduce((sum, op) => sum + op.costs.actualCost, 0),
      averageOperationTime,
      successRate:
        allOperations.length > 0 ? successfulOperations.length / allOperations.length : 0,
    };
  }

  /**
   * Process batch operation (private method)
   */
  private async processBatchOperation(
    operationId: string,
    terms: Array<{ id: string; name: string }>,
    _isResume = false
  ): Promise<void> {
    const operation = this.operations.get(operationId);
    if (!operation) {
      throw new Error(`Operation ${operationId} not found`);
    }

    operation.status = 'running';
    operation.timing.lastActivity = new Date();

    const { batchSize, maxConcurrentBatches = 2 } = operation.configuration.processingOptions;
    const actualBatchSize = Math.min(batchSize, this.RATE_LIMITS.maxBatchSize);

    try {
      // Create batches
      const batches: Array<Array<{ id: string; name: string }>> = [];
      for (let i = 0; i < terms.length; i += actualBatchSize) {
        batches.push(terms.slice(i, i + actualBatchSize));
      }

      logger.info(`Processing ${batches.length} batches for operation ${operationId}`);

      // Process batches with concurrency control
      for (let i = 0; i < batches.length; i += maxConcurrentBatches) {
        const batchGroup = batches.slice(i, i + maxConcurrentBatches);

        // Check if operation is still running
        if (operation.status !== 'running') {
          logger.info(`Operation ${operationId} stopped, status: ${operation.status}`);
          return;
        }

        // Process batch group concurrently
        await Promise.all(
          batchGroup.map((batch, batchIndex) =>
            this.processBatch(operationId, batch, i + batchIndex)
          )
        );

        // Update progress
        const totalProcessed = Math.min((i + maxConcurrentBatches) * actualBatchSize, terms.length);
        operation.progress.completionPercentage = (totalProcessed / terms.length) * 100;
        operation.timing.lastActivity = new Date();

        // Check cost limits
        if (
          operation.configuration.costLimits?.maxTotalCost &&
          operation.costs.actualCost >= operation.configuration.costLimits.maxTotalCost
        ) {
          logger.warn(
            `Cost limit reached for operation ${operationId}: ${operation.costs.actualCost}`
          );
          break;
        }

        // Emit progress event
        this.emit('operation:progress', { operationId, operation });

        // Delay between batch groups
        if (i + maxConcurrentBatches < batches.length) {
          await new Promise(resolve =>
            setTimeout(resolve, this.RATE_LIMITS.minDelayBetweenBatches)
          );
        }
      }

      // Operation completed
      operation.status = 'completed';
      operation.timing.actualCompletion = new Date();
      operation.progress.completionPercentage = 100;

      // Calculate final results
      operation.result = {
        successCount: operation.progress.processedTerms,
        failureCount: operation.progress.failedTerms,
        totalTokensUsed: 0, // Will be calculated from sub-jobs
        totalCost: operation.costs.actualCost,
        processingTime:
          operation.timing.actualCompletion.getTime() -
          (operation.timing.startedAt?.getTime() || 0),
      };

      logger.info(`Batch operation ${operationId} completed:`, operation.result);
      this.emit('operation:completed', { operationId, operation });
    } catch (error) {
      operation.status = 'failed';
      operation.timing.actualCompletion = new Date();

      logger.error(`Batch operation ${operationId} failed:`, {
        error: error instanceof Error ? error.message : String(error),
      });
      this.emit('operation:failed', {
        operationId,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Process a single batch of terms
   */
  private async processBatch(
    operationId: string,
    batch: Array<{ id: string; name: string }>,
    batchIndex: number
  ): Promise<void> {
    const operation = this.operations.get(operationId);
    if (!operation) {return;}

    logger.info(
      `Processing batch ${batchIndex} with ${batch.length} terms for operation ${operationId}`
    );

    const batchStartTime = Date.now();

    // Create sub-jobs for each term in the batch
    const subJobPromises = batch.map(async term => {
      try {
        const jobId = await jobQueueManager.addJob(
          JobType.AI_CONTENT_GENERATION,
          {
            termId: term.id,
            termName: term.name,
            sections: [operation.sectionName],
            model: operation.configuration.processingOptions.model,
            temperature: operation.configuration.processingOptions.temperature,
            maxTokens: operation.configuration.processingOptions.maxTokens,
            regenerate: operation.configuration.processingOptions.regenerateExisting,
            userId: operation.configuration.metadata?.initiatedBy,
            metadata: {
              batchOperationId: operationId,
              batchIndex,
              termIndex: batch.indexOf(term),
            },
          },
          {
            priority: JobPriority.NORMAL,
            attempts: 3,
            timeout: 120000, // 2 minutes per job
          }
        );

        operation.subJobs.push(jobId);
        return jobId;
      } catch (error) {
        logger.error(`Failed to create job for term ${term.id} in operation ${operationId}:`, {
          error: error instanceof Error ? error.message : String(error),
        });

        operation.errors.push({
          termId: term.id,
          termName: term.name,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
          retryCount: 0,
        });

        operation.progress.failedTerms++;
        return null;
      }
    });

    const jobIds = (await Promise.all(subJobPromises)).filter(id => id !== null) as string[];

    // Wait for batch completion with timeout
    const batchTimeout = 600000; // 10 minutes per batch
    const startTime = Date.now();

    while (Date.now() - startTime < batchTimeout) {
      if (operation.status !== 'running') {
        logger.info(`Operation ${operationId} stopped during batch processing`);
        return;
      }

      // Check job statuses
      const statusChecks = await Promise.all(
        jobIds.map(jobId => jobQueueManager.getJobStatus(JobType.AI_CONTENT_GENERATION, jobId))
      );

      const completed = statusChecks.filter(
        status => status && (status.state === 'completed' || status.state === 'failed')
      );

      // Update costs and progress
      let batchCost = 0;
      let processedInBatch = 0;
      let failedInBatch = 0;

      for (const status of completed) {
        if (status?.state === 'completed' && status.result) {
          processedInBatch++;
          batchCost += status.result.cost || 0;

          // Update cost breakdown
          const model = status.result.model || 'unknown';
          if (!operation.costs.costBreakdown[model]) {
            operation.costs.costBreakdown[model] = { tokens: 0, cost: 0, requests: 0 };
          }
          operation.costs.costBreakdown[model].cost += status.result.cost || 0;
          operation.costs.costBreakdown[model].tokens += status.result.totalTokens || 0;
          operation.costs.costBreakdown[model].requests++;
        } else if (status?.state === 'failed') {
          failedInBatch++;
        }
      }

      // Update operation progress
      operation.progress.processedTerms += processedInBatch;
      operation.progress.failedTerms += failedInBatch;
      operation.costs.actualCost += batchCost;
      operation.costs.budgetUsed =
        operation.costs.estimatedCost > 0
          ? (operation.costs.actualCost / operation.costs.estimatedCost) * 100
          : 0;

      // Check if all jobs completed
      if (completed.length === jobIds.length) {
        break;
      }

      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const batchProcessingTime = Date.now() - batchStartTime;
    logger.info(`Batch ${batchIndex} completed for operation ${operationId}:`, {
      processed: operation.progress.processedTerms,
      failed: operation.progress.failedTerms,
      batchCost: operation.costs.actualCost,
      processingTime: batchProcessingTime,
    });
  }

  /**
   * Get eligible terms for batch processing based on request criteria
   */
  private async getEligibleTerms(
    request: ColumnBatchRequest
  ): Promise<Array<{ id: string; name: string }>> {
    const whereConditions = [];

    // Filter by specific term IDs if provided
    if (request.termIds && request.termIds.length > 0) {
      whereConditions.push(inArray(enhancedTerms.id, request.termIds));
    }

    // Filter by categories if provided
    if (request.categories && request.categories.length > 0) {
      whereConditions.push(inArray(enhancedTerms.category, request.categories));
    }

    // Apply filter options
    if (request.filterOptions) {
      const { hasContent, isAiGenerated, verificationStatus, lastUpdatedBefore, lastUpdatedAfter } =
        request.filterOptions;

      // Complex filtering will require joining with sections and sectionItems
      // For now, implement basic term-level filtering
      if (lastUpdatedBefore) {
        whereConditions.push(sql`${enhancedTerms.updatedAt} < ${lastUpdatedBefore.toISOString()}`);
      }

      if (lastUpdatedAfter) {
        whereConditions.push(sql`${enhancedTerms.updatedAt} > ${lastUpdatedAfter.toISOString()}`);
      }
    }

    // Build query
    let query = db
      .select({
        id: enhancedTerms.id,
        name: enhancedTerms.name,
      })
      .from(enhancedTerms);

    if (whereConditions.length > 0) {
      query = query.where(and(...whereConditions));
    }

    // Add ordering and limits for consistency
    query = query.orderBy(enhancedTerms.name).limit(10000); // Safety limit

    const terms = await query;

    // Additional filtering based on section content if needed
    if (
      request.filterOptions?.hasContent !== undefined ||
      request.filterOptions?.isAiGenerated !== undefined
    ) {
      const filteredTerms = [];

      for (const term of terms) {
        const hasContentForSection = await this.termHasContentForSection(
          term.id,
          request.sectionName
        );

        if (request.filterOptions.hasContent !== undefined) {
          if (request.filterOptions.hasContent && !hasContentForSection) {continue;}
          if (!request.filterOptions.hasContent && hasContentForSection) {continue;}
        }

        if (request.filterOptions.isAiGenerated !== undefined) {
          const isAiGenerated = await this.isTermContentAiGenerated(term.id, request.sectionName);
          if (request.filterOptions.isAiGenerated !== isAiGenerated) {continue;}
        }

        filteredTerms.push(term);
      }

      return filteredTerms;
    }

    return terms;
  }

  /**
   * Check if term has content for specific section
   */
  private async termHasContentForSection(termId: string, sectionName: string): Promise<boolean> {
    const sectionData = await db
      .select()
      .from(sections)
      .innerJoin(sectionItems, eq(sections.id, sectionItems.sectionId))
      .where(
        and(
          eq(sections.termId, termId),
          eq(sections.name, sectionName),
          sql`${sectionItems.content} IS NOT NULL AND ${sectionItems.content} != ''`
        )
      )
      .limit(1);

    return sectionData.length > 0;
  }

  /**
   * Check if term content is AI generated
   */
  private async isTermContentAiGenerated(termId: string, sectionName: string): Promise<boolean> {
    const sectionData = await db
      .select()
      .from(sections)
      .innerJoin(sectionItems, eq(sections.id, sectionItems.sectionId))
      .where(
        and(
          eq(sections.termId, termId),
          eq(sections.name, sectionName),
          eq(sectionItems.isAiGenerated, true)
        )
      )
      .limit(1);

    return sectionData.length > 0;
  }

  /**
   * Estimate tokens per term based on section type and historical data
   */
  private async estimateTokensPerTerm(sectionName: string): Promise<number> {
    // Base estimates by section type
    const sectionEstimates: { [key: string]: number } = {
      definition: 150,
      explanation: 300,
      examples: 250,
      applications: 300,
      advantages: 200,
      disadvantages: 200,
      related_concepts: 150,
      further_reading: 100,
      code_examples: 400,
      mathematical_foundation: 350,
      history: 250,
      practical_implementation: 400,
    };

    const baseEstimate = sectionEstimates[sectionName.toLowerCase()] || 250;

    // Try to get historical data from analytics
    try {
      const historicalData = await db
        .select({
          avgTokens: sql<number>`AVG(CAST(${aiUsageAnalytics.inputTokens} + ${aiUsageAnalytics.outputTokens} AS FLOAT))`,
        })
        .from(aiUsageAnalytics)
        .where(
          and(
            eq(aiUsageAnalytics.operation, 'generate_content'),
            eq(aiUsageAnalytics.success, true),
            sql`${aiUsageAnalytics.metadata}->>'sectionName' = ${sectionName}`
          )
        )
        .limit(1);

      if (historicalData.length > 0 && historicalData[0].avgTokens) {
        return Math.max(historicalData[0].avgTokens, baseEstimate);
      }
    } catch (error) {
      logger.warn('Failed to fetch historical token data:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return baseEstimate;
  }

  /**
   * Calculate estimated completion time
   */
  private calculateEstimatedCompletion(totalTerms: number, _batchSize: number): Date {
    // Estimate 30 seconds per term on average (including queue time)
    const estimatedSecondsPerTerm = 30;
    const totalEstimatedSeconds = totalTerms * estimatedSecondsPerTerm;

    // Add buffer for batch processing overhead
    const bufferMultiplier = 1.2;
    const finalEstimate = totalEstimatedSeconds * bufferMultiplier;

    return new Date(Date.now() + finalEstimate * 1000);
  }

  /**
   * Validate batch request
   */
  private async validateBatchRequest(request: ColumnBatchRequest): Promise<void> {
    if (!request.sectionName || request.sectionName.trim().length === 0) {
      throw new Error('Section name is required');
    }

    if (!request.processingOptions) {
      throw new Error('Processing options are required');
    }

    if (
      request.processingOptions.batchSize < 1 ||
      request.processingOptions.batchSize > this.RATE_LIMITS.maxBatchSize
    ) {
      throw new Error(`Batch size must be between 1 and ${this.RATE_LIMITS.maxBatchSize}`);
    }

    if (
      request.processingOptions.model &&
      !this.MODEL_COSTS[request.processingOptions.model as keyof typeof this.MODEL_COSTS]
    ) {
      throw new Error(`Unsupported model: ${request.processingOptions.model}`);
    }

    if (
      request.processingOptions.temperature !== undefined &&
      (request.processingOptions.temperature < 0 || request.processingOptions.temperature > 2)
    ) {
      throw new Error('Temperature must be between 0 and 2');
    }

    if (
      request.processingOptions.maxTokens !== undefined &&
      (request.processingOptions.maxTokens < 1 || request.processingOptions.maxTokens > 4000)
    ) {
      throw new Error('Max tokens must be between 1 and 4000');
    }

    if (!request.metadata?.initiatedBy) {
      throw new Error('Initiated by user ID is required in metadata');
    }
  }

  /**
   * Check rate limits
   */
  private async checkRateLimits(): Promise<void> {
    const activeOps = this.getActiveOperations();

    if (activeOps.length >= this.RATE_LIMITS.maxConcurrentOperations) {
      throw new Error(
        `Maximum concurrent operations reached (${this.RATE_LIMITS.maxConcurrentOperations}). Please wait for existing operations to complete.`
      );
    }

    // Check hourly limit
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOps = Array.from(this.operations.values()).filter(
      op => op.timing.startedAt && op.timing.startedAt > oneHourAgo
    );

    if (recentOps.length >= this.RATE_LIMITS.maxOperationsPerHour) {
      throw new Error(
        `Maximum operations per hour reached (${this.RATE_LIMITS.maxOperationsPerHour}). Please try again later.`
      );
    }
  }

  /**
   * Start periodic monitoring of operations
   */
  private startMonitoring(): void {
    // Monitor every 30 seconds
    setInterval(() => {
      this.monitorOperations();
    }, 30000);

    // Cleanup old operations daily
    setInterval(
      () => {
        this.cleanupOldOperations();
      },
      24 * 60 * 60 * 1000
    );
  }

  /**
   * Monitor active operations for issues
   */
  private async monitorOperations(): Promise<void> {
    const activeOps = this.getActiveOperations();

    for (const operation of activeOps) {
      // Check for stalled operations
      const lastActivity = operation.timing.lastActivity;
      if (lastActivity && Date.now() - lastActivity.getTime() > 300000) {
        // 5 minutes
        logger.warn(`Operation ${operation.id} appears stalled, last activity: ${lastActivity}`);
        this.emit('operation:stalled', { operationId: operation.id, operation });
      }

      // Check cost limits
      if (operation.configuration.costLimits?.warningThreshold) {
        const warningCost =
          operation.costs.estimatedCost *
          (operation.configuration.costLimits.warningThreshold / 100);
        if (operation.costs.actualCost > warningCost && operation.costs.budgetUsed < 90) {
          logger.warn(
            `Operation ${operation.id} approaching cost limit: ${operation.costs.actualCost}/${operation.costs.estimatedCost}`
          );
          this.emit('operation:cost-warning', { operationId: operation.id, operation });
        }
      }
    }
  }

  /**
   * Cleanup old operations (keep last 1000 operations)
   */
  private cleanupOldOperations(): void {
    const allOps = Array.from(this.operations.entries()).sort(
      ([, a], [, b]) => (b.timing.startedAt?.getTime() || 0) - (a.timing.startedAt?.getTime() || 0)
    );

    if (allOps.length > 1000) {
      const toRemove = allOps.slice(1000);
      for (const [operationId] of toRemove) {
        this.operations.delete(operationId);
      }
      logger.info(`Cleaned up ${toRemove.length} old operations`);
    }
  }
}

// Export singleton instance
export const columnBatchProcessorService = new ColumnBatchProcessorService();
export default columnBatchProcessorService;
