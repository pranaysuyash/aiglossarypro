/**
 * Column Batch Processing Test Suite - Phase 2 Enhanced Content Generation System
 *
 * Comprehensive test suite for validating batch processing functionality,
 * safety controls, cost management, and system reliability.
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { jobQueueManager } from '../jobs/queue';
import { batchAnalyticsService } from '../services/batchAnalyticsService';
import { batchProgressTrackingService } from '../services/batchProgressTrackingService';
import { batchSafetyControlsService } from '../services/batchSafetyControlsService';
import { columnBatchProcessorService } from '../services/columnBatchProcessorService';
import { costManagementService } from '../services/costManagementService';
import { log as logger } from '../utils/logger';

// Test data
const testUser = 'test-user-123';
const testSection = 'test-section';
const testTermIds = ['term-1', 'term-2', 'term-3', 'term-4', 'term-5'];

describe('Column Batch Processing System', () => {
  let testOperationId: string;

  beforeAll(async () => {
    // Initialize services
    await jobQueueManager.initialize();
    logger.info('Test suite initialized');
  });

  afterAll(async () => {
    // Cleanup
    await jobQueueManager.shutdown();
    logger.info('Test suite completed');
  });

  beforeEach(async () => {
    // Reset state before each test
    logger.info('Starting new test');
  });

  afterEach(async () => {
    // Cleanup after each test
    if (testOperationId) {
      try {
        await columnBatchProcessorService.cancelBatchOperation(testOperationId);
      } catch (_error) {
        // Ignore errors during cleanup
      }
    }
    logger.info('Test completed');
  });

  describe('Cost Estimation', () => {
    it('should provide accurate cost estimates for batch operations', async () => {
      const request = {
        sectionName: testSection,
        termIds: testTermIds,
        processingOptions: {
          batchSize: 10,
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 1000,
          regenerateExisting: false,
          pauseOnError: false,
          maxConcurrentBatches: 2,
        },
        metadata: {
          initiatedBy: testUser,
          reason: 'Test cost estimation',
        },
      };

      const estimate = await columnBatchProcessorService.estimateBatchCosts(request);

      expect(estimate).toBeDefined();
      expect(estimate.totalTerms).toBe(testTermIds.length);
      expect(estimate.totalEstimatedCost).toBeGreaterThan(0);
      expect(estimate.estimatedTokensPerTerm).toBeGreaterThan(0);
      expect(estimate.confidence).toBeDefined();
      expect(estimate.recommendations).toBeInstanceOf(Array);
    });

    it('should handle different models in cost estimation', async () => {
      const gpt35Request = {
        sectionName: testSection,
        termIds: testTermIds,
        processingOptions: {
          batchSize: 10,
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 1000,
          regenerateExisting: false,
          pauseOnError: false,
          maxConcurrentBatches: 2,
        },
        metadata: {
          initiatedBy: testUser,
          reason: 'Test cost estimation GPT-3.5',
        },
      };

      const gpt4Request = {
        ...gpt35Request,
        processingOptions: {
          ...gpt35Request.processingOptions,
          model: 'gpt-4',
        },
      };

      const gpt35Estimate = await columnBatchProcessorService.estimateBatchCosts(gpt35Request);
      const gpt4Estimate = await columnBatchProcessorService.estimateBatchCosts(gpt4Request);

      expect(gpt4Estimate.totalEstimatedCost).toBeGreaterThan(gpt35Estimate.totalEstimatedCost);
      expect(gpt4Estimate.costBreakdown['gpt-4']).toBeDefined();
      expect(gpt35Estimate.costBreakdown['gpt-3.5-turbo']).toBeDefined();
    });
  });

  describe('Safety Controls', () => {
    it('should enforce rate limits for operations', async () => {
      const operationRequest = {
        sectionName: testSection,
        termCount: 100,
        estimatedCost: 50,
        estimatedDuration: 60,
      };

      // First operation should be allowed
      const firstCheck = await batchSafetyControlsService.checkOperationPermission(
        testUser,
        operationRequest
      );
      expect(firstCheck.allowed).toBe(true);

      // Simulate multiple rapid requests
      const rapidRequests = Array.from({ length: 20 }, (_, i) =>
        batchSafetyControlsService.checkOperationPermission(`${testUser}-${i}`, operationRequest)
      );

      const results = await Promise.all(rapidRequests);
      const allowedCount = results.filter(r => r.allowed).length;
      const deniedCount = results.filter(r => !r.allowed).length;

      expect(deniedCount).toBeGreaterThan(0); // Some should be denied due to rate limits
      expect(allowedCount).toBeLessThan(20); // Not all should be allowed
    });

    it('should enforce cost limits', async () => {
      const highCostRequest = {
        sectionName: testSection,
        termCount: 10000,
        estimatedCost: 2000, // Very high cost
        estimatedDuration: 60,
      };

      const permission = await batchSafetyControlsService.checkOperationPermission(
        testUser,
        highCostRequest
      );
      expect(permission.allowed).toBe(false);
      expect(permission.reason).toContain('cost');
    });

    it('should handle emergency stops', async () => {
      // Activate emergency stop
      await batchSafetyControlsService.activateEmergencyStop('Test emergency stop', testUser);

      // Try to start an operation
      const operationRequest = {
        sectionName: testSection,
        termCount: 10,
        estimatedCost: 5,
        estimatedDuration: 30,
      };

      const permission = await batchSafetyControlsService.checkOperationPermission(
        testUser,
        operationRequest
      );
      expect(permission.allowed).toBe(false);
      expect(permission.reason).toContain('emergency');

      // Deactivate emergency stop
      await batchSafetyControlsService.deactivateEmergencyStop(testUser);

      // Now operation should be allowed
      const newPermission = await batchSafetyControlsService.checkOperationPermission(
        testUser,
        operationRequest
      );
      expect(newPermission.allowed).toBe(true);
    });
  });

  describe('Batch Operation Management', () => {
    it('should start and track batch operations', async () => {
      const request = {
        sectionName: testSection,
        termIds: testTermIds,
        processingOptions: {
          batchSize: 2,
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 500,
          regenerateExisting: false,
          pauseOnError: false,
          maxConcurrentBatches: 1,
        },
        metadata: {
          initiatedBy: testUser,
          reason: 'Test batch operation',
        },
      };

      // Mock the actual processing by providing test data
      // Note: In a real test, you might want to mock the OpenAI API calls

      testOperationId = await columnBatchProcessorService.startBatchOperation(request);
      expect(testOperationId).toBeDefined();
      expect(testOperationId).toMatch(/^col-batch-/);

      // Check operation status
      const operation = columnBatchProcessorService.getOperationStatus(testOperationId);
      expect(operation).toBeDefined();
      expect(operation?.sectionName).toBe(testSection);
      expect(operation?.status).toBe('pending');
    });

    it('should handle operation pause and resume', async () => {
      const request = {
        sectionName: testSection,
        termIds: testTermIds,
        processingOptions: {
          batchSize: 2,
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 500,
          regenerateExisting: false,
          pauseOnError: false,
          maxConcurrentBatches: 1,
        },
        metadata: {
          initiatedBy: testUser,
          reason: 'Test pause/resume',
        },
      };

      testOperationId = await columnBatchProcessorService.startBatchOperation(request);

      // Wait a bit for operation to start
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Pause operation
      const pauseResult = await columnBatchProcessorService.pauseBatchOperation(testOperationId);
      expect(pauseResult).toBe(true);

      const pausedOperation = columnBatchProcessorService.getOperationStatus(testOperationId);
      expect(pausedOperation?.status).toBe('paused');

      // Resume operation
      const resumeResult = await columnBatchProcessorService.resumeBatchOperation(testOperationId);
      expect(resumeResult).toBe(true);

      const resumedOperation = columnBatchProcessorService.getOperationStatus(testOperationId);
      expect(resumedOperation?.status).toBe('running');
    });

    it('should handle operation cancellation', async () => {
      const request = {
        sectionName: testSection,
        termIds: testTermIds,
        processingOptions: {
          batchSize: 2,
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 500,
          regenerateExisting: false,
          pauseOnError: false,
          maxConcurrentBatches: 1,
        },
        metadata: {
          initiatedBy: testUser,
          reason: 'Test cancellation',
        },
      };

      testOperationId = await columnBatchProcessorService.startBatchOperation(request);

      // Cancel operation
      const cancelResult = await columnBatchProcessorService.cancelBatchOperation(testOperationId);
      expect(cancelResult).toBe(true);

      const cancelledOperation = columnBatchProcessorService.getOperationStatus(testOperationId);
      expect(cancelledOperation?.status).toBe('cancelled');
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress in real-time', async () => {
      const request = {
        sectionName: testSection,
        termIds: testTermIds.slice(0, 3), // Smaller batch for testing
        processingOptions: {
          batchSize: 1,
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 500,
          regenerateExisting: false,
          pauseOnError: false,
          maxConcurrentBatches: 1,
        },
        metadata: {
          initiatedBy: testUser,
          reason: 'Test progress tracking',
        },
      };

      testOperationId = await columnBatchProcessorService.startBatchOperation(request);

      // Start monitoring
      await batchProgressTrackingService.startMonitoring(testOperationId);

      // Wait for some progress
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check progress snapshot
      const progress = batchProgressTrackingService.getCurrentProgress(testOperationId);
      expect(progress).toBeDefined();
      expect(progress?.operationId).toBe(testOperationId);
      expect(progress?.sectionName).toBe(testSection);

      // Stop monitoring
      await batchProgressTrackingService.stopMonitoring(testOperationId);
    });

    it('should generate progress reports', async () => {
      const request = {
        sectionName: testSection,
        termIds: testTermIds.slice(0, 2),
        processingOptions: {
          batchSize: 1,
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 500,
          regenerateExisting: false,
          pauseOnError: false,
          maxConcurrentBatches: 1,
        },
        metadata: {
          initiatedBy: testUser,
          reason: 'Test progress reports',
        },
      };

      testOperationId = await columnBatchProcessorService.startBatchOperation(request);

      // Start monitoring with milestone reporting
      await batchProgressTrackingService.startMonitoring(testOperationId, {
        reportMilestones: [50, 100],
      });

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check for reports
      const reports = batchProgressTrackingService.getStatusReports(testOperationId);
      expect(reports.length).toBeGreaterThan(0);
    });
  });

  describe('Cost Management', () => {
    it('should track costs accurately', async () => {
      const testCost = await costManagementService.recordCostUsage(
        'test_operation',
        'gpt-3.5-turbo',
        100, // input tokens
        200, // output tokens
        testUser,
        'test-term-123'
      );

      expect(testCost).toBeGreaterThan(0);
      expect(testCost).toBeLessThan(1); // Should be reasonable for these token counts
    });

    it('should create and manage budgets', async () => {
      const budgetId = await costManagementService.createBudget({
        name: 'Test Budget',
        description: 'Budget for testing',
        totalBudget: 100,
        period: 'monthly',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        categories: ['test_operation'],
        alertThresholds: {
          warning: 75,
          critical: 90,
        },
        createdBy: testUser,
      });

      expect(budgetId).toBeDefined();

      const budget = costManagementService.getBudget(budgetId);
      expect(budget).toBeDefined();
      expect(budget?.name).toBe('Test Budget');
      expect(budget?.totalBudget).toBe(100);
    });

    it('should provide cost analytics', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const analytics = await costManagementService.getCostAnalytics(startDate, endDate);

      expect(analytics).toBeDefined();
      expect(analytics.period.start).toEqual(startDate);
      expect(analytics.period.end).toEqual(endDate);
      expect(analytics.breakdown).toBeDefined();
      expect(analytics.breakdown.byModel).toBeInstanceOf(Array);
      expect(analytics.breakdown.byOperation).toBeInstanceOf(Array);
    });
  });

  describe('Analytics and Reporting', () => {
    it('should generate performance reports', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const report = await batchAnalyticsService.generatePerformanceReport(startDate, endDate);

      expect(report).toBeDefined();
      expect(report.period.start).toEqual(startDate);
      expect(report.period.end).toEqual(endDate);
      expect(report.overview).toBeDefined();
      expect(report.trends).toBeDefined();
      expect(report.sectionAnalysis).toBeInstanceOf(Array);
      expect(report.recommendations).toBeInstanceOf(Array);
    });

    it('should generate cost optimization reports', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const report = await batchAnalyticsService.generateCostOptimizationReport(startDate, endDate);

      expect(report).toBeDefined();
      expect(report.period.start).toEqual(startDate);
      expect(report.period.end).toEqual(endDate);
      expect(report.currentSpending).toBeDefined();
      expect(report.optimizationOpportunities).toBeInstanceOf(Array);
      expect(report.projections).toBeDefined();
    });

    it('should generate business intelligence reports', async () => {
      const report = await batchAnalyticsService.generateBusinessIntelligenceReport();

      expect(report).toBeDefined();
      expect(report.operationalMetrics).toBeDefined();
      expect(report.businessImpact).toBeDefined();
      expect(report.competitiveAnalysis).toBeDefined();
      expect(report.growthProjections).toBeDefined();
    });

    it('should provide real-time metrics', async () => {
      const metrics = await batchAnalyticsService.getRealTimeMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.timestamp).toBeInstanceOf(Date);
      expect(metrics.activeOperations).toBeGreaterThanOrEqual(0);
      expect(metrics.processingRate).toBeGreaterThanOrEqual(0);
      expect(metrics.systemHealth).toBeGreaterThanOrEqual(0);
      expect(metrics.resourceUtilization).toBeDefined();
    });
  });

  describe('System Integration', () => {
    it('should handle multiple concurrent operations', async () => {
      const requests = Array.from({ length: 3 }, (_, i) => ({
        sectionName: `${testSection}-${i}`,
        termIds: testTermIds.slice(0, 2),
        processingOptions: {
          batchSize: 1,
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 500,
          regenerateExisting: false,
          pauseOnError: false,
          maxConcurrentBatches: 1,
        },
        metadata: {
          initiatedBy: `${testUser}-${i}`,
          reason: `Test concurrent operation ${i}`,
        },
      }));

      const operationIds = await Promise.all(
        requests.map(req => columnBatchProcessorService.startBatchOperation(req))
      );

      expect(operationIds.length).toBe(3);
      expect(operationIds.every(id => id.startsWith('col-batch-'))).toBe(true);

      // Check that all operations are tracked
      const activeOps = columnBatchProcessorService.getActiveOperations();
      expect(activeOps.length).toBeGreaterThanOrEqual(3);

      // Cleanup
      await Promise.all(
        operationIds.map(id => columnBatchProcessorService.cancelBatchOperation(id))
      );
    });

    it('should maintain data consistency during operations', async () => {
      // This test would verify that the system maintains data consistency
      // during concurrent operations, failures, and recovery scenarios

      const request = {
        sectionName: testSection,
        termIds: testTermIds.slice(0, 2),
        processingOptions: {
          batchSize: 1,
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 500,
          regenerateExisting: false,
          pauseOnError: false,
          maxConcurrentBatches: 1,
        },
        metadata: {
          initiatedBy: testUser,
          reason: 'Test data consistency',
        },
      };

      testOperationId = await columnBatchProcessorService.startBatchOperation(request);

      // Simulate monitoring during operation
      await batchProgressTrackingService.startMonitoring(testOperationId);

      // Wait for some progress
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check system state consistency
      const operation = columnBatchProcessorService.getOperationStatus(testOperationId);
      const progress = batchProgressTrackingService.getCurrentProgress(testOperationId);

      expect(operation).toBeDefined();
      expect(progress).toBeDefined();
      expect(progress?.operationId).toBe(testOperationId);
      expect(progress?.sectionName).toBe(operation?.sectionName);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid operation requests', async () => {
      const invalidRequest = {
        sectionName: '', // Invalid: empty section name
        termIds: testTermIds,
        processingOptions: {
          batchSize: 0, // Invalid: zero batch size
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 500,
          regenerateExisting: false,
          pauseOnError: false,
          maxConcurrentBatches: 1,
        },
        metadata: {
          initiatedBy: testUser,
          reason: 'Test error handling',
        },
      };

      await expect(
        columnBatchProcessorService.startBatchOperation(invalidRequest)
      ).rejects.toThrow();
    });

    it('should handle operation not found scenarios', async () => {
      const nonExistentId = 'non-existent-operation-id';

      const operation = columnBatchProcessorService.getOperationStatus(nonExistentId);
      expect(operation).toBeNull();

      await expect(
        columnBatchProcessorService.pauseBatchOperation(nonExistentId)
      ).rejects.toThrow();
    });

    it('should handle service failures gracefully', async () => {
      // Test that the system can handle various failure scenarios
      // This would typically involve mocking service failures

      const request = {
        sectionName: testSection,
        termIds: testTermIds.slice(0, 1),
        processingOptions: {
          batchSize: 1,
          model: 'invalid-model', // This should trigger an error
          temperature: 0.7,
          maxTokens: 500,
          regenerateExisting: false,
          pauseOnError: false,
          maxConcurrentBatches: 1,
        },
        metadata: {
          initiatedBy: testUser,
          reason: 'Test service failure',
        },
      };

      await expect(columnBatchProcessorService.startBatchOperation(request)).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle large batch sizes efficiently', async () => {
      const largeBatchRequest = {
        sectionName: testSection,
        termIds: Array.from({ length: 100 }, (_, i) => `term-${i}`),
        processingOptions: {
          batchSize: 10,
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 500,
          regenerateExisting: false,
          pauseOnError: false,
          maxConcurrentBatches: 2,
        },
        metadata: {
          initiatedBy: testUser,
          reason: 'Test performance with large batch',
        },
      };

      const startTime = Date.now();
      const estimate = await columnBatchProcessorService.estimateBatchCosts(largeBatchRequest);
      const estimationTime = Date.now() - startTime;

      expect(estimate.totalTerms).toBe(100);
      expect(estimationTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should maintain performance under load', async () => {
      // Test system performance under concurrent load
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => ({
        sectionName: `load-test-${i}`,
        termIds: testTermIds.slice(0, 2),
        processingOptions: {
          batchSize: 1,
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 500,
          regenerateExisting: false,
          pauseOnError: false,
          maxConcurrentBatches: 1,
        },
        metadata: {
          initiatedBy: `load-test-user-${i}`,
          reason: `Load test ${i}`,
        },
      }));

      const startTime = Date.now();
      const estimates = await Promise.all(
        concurrentRequests.map(req => columnBatchProcessorService.estimateBatchCosts(req))
      );
      const totalTime = Date.now() - startTime;

      expect(estimates.length).toBe(10);
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(estimates.every(est => est.totalTerms > 0)).toBe(true);
    });
  });
});

// Helper functions for testing
export const testHelpers = {
  createTestOperation: async (options: Partial<any> = {}) => {
    const defaultRequest = {
      sectionName: testSection,
      termIds: testTermIds.slice(0, 2),
      processingOptions: {
        batchSize: 1,
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 500,
        regenerateExisting: false,
        pauseOnError: false,
        maxConcurrentBatches: 1,
      },
      metadata: {
        initiatedBy: testUser,
        reason: 'Test helper operation',
      },
      ...options,
    };

    return await columnBatchProcessorService.startBatchOperation(defaultRequest);
  },

  waitForOperationCompletion: async (operationId: string, timeout = 10000) => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const operation = columnBatchProcessorService.getOperationStatus(operationId);
      if (
        operation &&
        (operation.status === 'completed' ||
          operation.status === 'failed' ||
          operation.status === 'cancelled')
      ) {
        return operation;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Operation ${operationId} did not complete within ${timeout}ms`);
  },

  generateMockTerms: (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `mock-term-${i}`,
      name: `Mock Term ${i}`,
      definition: `Definition for mock term ${i}`,
      category: 'mock-category',
    }));
  },
};

export default testHelpers;
