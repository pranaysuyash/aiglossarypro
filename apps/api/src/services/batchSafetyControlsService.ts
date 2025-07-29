/**
 * Batch Safety Controls Service - Phase 2 Enhanced Content Generation System
 *
 * Provides comprehensive safety controls, rate limiting, and protection mechanisms
 * for large-scale batch operations to prevent system abuse and ensure stability.
 */

import { EventEmitter } from 'node:events';
import { log as logger } from '../utils/logger';
import { columnBatchProcessorService } from './columnBatchProcessorService';

// Safety control interfaces
export interface SafetyLimits {
  global: {
    maxConcurrentOperations: number;
    maxOperationsPerHour: number;
    maxOperationsPerDay: number;
    maxOperationsPerUser: number;
    maxTotalCostPerDay: number;
    maxTotalCostPerUser: number;
  };
  operation: {
    maxTermsPerOperation: number;
    maxCostPerOperation: number;
    maxDurationHours: number;
    maxErrorRate: number;
    maxRetries: number;
  };
  api: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    cooldownPeriodMinutes: number;
  };
  system: {
    maxMemoryUsageMB: number;
    maxCpuUsagePercent: number;
    maxDiskUsagePercent: number;
    emergencyStopThreshold: number;
  };
}

export interface SafetyViolation {
  id: string;
  type: 'rate_limit' | 'cost_limit' | 'resource_limit' | 'system_limit' | 'operation_limit';
  severity: 'warning' | 'critical' | 'emergency';
  message: string;
  userId?: string;
  operationId?: string;
  triggeredAt: Date;
  currentValue: number;
  limitValue: number;
  action: 'throttle' | 'pause' | 'cancel' | 'block';
  autoResolved?: boolean;
  resolvedAt?: Date;
}

export interface UserLimitStatus {
  userId: string;
  currentLimits: {
    operationsToday: number;
    costToday: number;
    activeOperations: number;
    recentRequests: number;
  };
  violations: SafetyViolation[];
  status: 'normal' | 'throttled' | 'blocked';
  nextAllowedOperation?: Date;
}

export interface SystemHealthCheck {
  timestamp: Date;
  healthy: boolean;
  metrics: {
    memoryUsageMB: number;
    cpuUsagePercent: number;
    diskUsagePercent: number;
    activeOperations: number;
    queueDepth: number;
    errorRate: number;
  };
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
  recommendations: string[];
}

export interface EmergencyControls {
  emergencyStopActive: boolean;
  pauseAllOperations: boolean;
  blockNewOperations: boolean;
  maxConcurrencyOverride?: number;
  emergencyContacts: string[];
  lastActivated?: Date;
  reason?: string;
}

/**
 * Batch Safety Controls Service
 *
 * Comprehensive service for implementing safety controls, rate limiting,
 * and system protection for batch operations.
 */
export class BatchSafetyControlsService extends EventEmitter {
  private safetyLimits: SafetyLimits;
  private violations: Map<string, SafetyViolation> = new Map();
  private userLimitStatus: Map<string, UserLimitStatus> = new Map();
  private requestCounts: Map<string, Array<{ timestamp: Date; count: number }>> = new Map();
  private emergencyControls: EmergencyControls;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.initializeSafetyLimits();
    this.initializeEmergencyControls();
    this.startHealthChecks();
  }

  /**
   * Check if an operation is allowed to start
   */
  async checkOperationPermission(
    userId: string,
    operationRequest: {
      sectionName: string;
      termCount: number;
      estimatedCost: number;
      estimatedDuration: number;
    }
  ): Promise<{ allowed: boolean; reason?: string; waitTime?: number }> {
    logger.info(`Checking operation permission for user ${userId}:`, operationRequest);

    // Check emergency controls first
    if (this.emergencyControls.emergencyStopActive) {
      return {
        allowed: false,
        reason: 'System is in emergency stop mode - all operations are blocked',
      };
    }

    if (this.emergencyControls.blockNewOperations) {
      return {
        allowed: false,
        reason: 'New operations are temporarily blocked for system maintenance',
      };
    }

    // Check user status
    const userStatus = await this.getUserLimitStatus(userId);
    if (userStatus.status === 'blocked') {
      return {
        allowed: false,
        reason: 'User is temporarily blocked due to safety violations',
      };
    }

    // Check global concurrent operations limit
    const activeOperations = columnBatchProcessorService.getActiveOperations();
    if (activeOperations.length >= this.safetyLimits.global.maxConcurrentOperations) {
      return {
        allowed: false,
        reason: `Maximum concurrent operations reached (${this.safetyLimits.global.maxConcurrentOperations})`,
        waitTime: await this.estimateWaitTime(),
      };
    }

    // Check user concurrent operations
    const userActiveOps = activeOperations.filter(
      op => op.configuration.metadata?.initiatedBy === userId
    );
    if (userActiveOps.length >= this.safetyLimits.global.maxOperationsPerUser) {
      return {
        allowed: false,
        reason: `Maximum operations per user reached (${this.safetyLimits.global.maxOperationsPerUser})`,
      };
    }

    // Check operation size limits
    if (operationRequest.termCount > this.safetyLimits.operation.maxTermsPerOperation) {
      return {
        allowed: false,
        reason: `Operation too large (${operationRequest.termCount} terms, max: ${this.safetyLimits.operation.maxTermsPerOperation})`,
      };
    }

    if (operationRequest.estimatedCost > this.safetyLimits.operation.maxCostPerOperation) {
      return {
        allowed: false,
        reason: `Operation cost too high ($${operationRequest.estimatedCost}, max: $${this.safetyLimits.operation.maxCostPerOperation})`,
      };
    }

    // Check daily limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyCost = await this.getUserDailyCost(userId, today);
    if (dailyCost + operationRequest.estimatedCost > this.safetyLimits.global.maxTotalCostPerUser) {
      return {
        allowed: false,
        reason: `Daily cost limit would be exceeded ($${dailyCost + operationRequest.estimatedCost}, max: $${this.safetyLimits.global.maxTotalCostPerUser})`,
      };
    }

    const dailyOperations = await this.getUserDailyOperations(userId, today);
    if (dailyOperations >= this.safetyLimits.global.maxOperationsPerDay) {
      return {
        allowed: false,
        reason: `Daily operation limit reached (${dailyOperations}, max: ${this.safetyLimits.global.maxOperationsPerDay})`,
      };
    }

    // Check hourly limits
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyOperations = await this.getUserOperationsSince(userId, hourAgo);
    if (hourlyOperations >= this.safetyLimits.global.maxOperationsPerHour) {
      return {
        allowed: false,
        reason: `Hourly operation limit reached (${hourlyOperations}, max: ${this.safetyLimits.global.maxOperationsPerHour})`,
        waitTime: 60, // Wait an hour
      };
    }

    // Check system health
    const healthCheck = await this.performHealthCheck();
    if (!healthCheck.healthy) {
      return {
        allowed: false,
        reason: 'System health check failed - operations temporarily restricted',
      };
    }

    // Check API rate limits
    const rateLimitCheck = this.checkApiRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      return {
        allowed: false,
        reason: rateLimitCheck.reason,
        waitTime: rateLimitCheck.waitTime,
      };
    }

    return { allowed: true };
  }

  /**
   * Monitor an active operation for safety violations
   */
  async monitorOperation(operationId: string): Promise<void> {
    const operation = columnBatchProcessorService.getOperationStatus(operationId);
    if (!operation) {
      return;
    }

    // Check operation duration
    if (operation.timing.startedAt) {
      const durationHours = (Date.now() - operation.timing.startedAt.getTime()) / (1000 * 60 * 60);
      if (durationHours > this.safetyLimits.operation.maxDurationHours) {
        await this.triggerViolation({
          type: 'operation_limit',
          severity: 'critical',
          message: `Operation exceeded maximum duration (${durationHours.toFixed(1)}h, max: ${this.safetyLimits.operation.maxDurationHours}h)`,
          operationId,
          currentValue: durationHours,
          limitValue: this.safetyLimits.operation.maxDurationHours,
          action: 'cancel',
        });
      }
    }

    // Check error rate
    const totalProcessed = operation.progress.processedTerms + operation.progress.failedTerms;
    if (totalProcessed > 10) {
      const errorRate = operation.progress.failedTerms / totalProcessed;
      if (errorRate > this.safetyLimits.operation.maxErrorRate) {
        await this.triggerViolation({
          type: 'operation_limit',
          severity: 'warning',
          message: `Operation has high error rate (${(errorRate * 100).toFixed(1)}%, max: ${(this.safetyLimits.operation.maxErrorRate * 100).toFixed(1)}%)`,
          operationId,
          currentValue: errorRate,
          limitValue: this.safetyLimits.operation.maxErrorRate,
          action: 'pause',
        });
      }
    }

    // Check cost overrun
    if (operation.costs.actualCost > operation.costs.estimatedCost * 1.5) {
      await this.triggerViolation({
        type: 'cost_limit',
        severity: 'critical',
        message: `Operation cost significantly exceeded estimate ($${operation.costs.actualCost} vs $${operation.costs.estimatedCost})`,
        operationId,
        currentValue: operation.costs.actualCost,
        limitValue: operation.costs.estimatedCost * 1.5,
        action: 'pause',
      });
    }
  }

  /**
   * Activate emergency stop
   */
  async activateEmergencyStop(reason: string, activatedBy: string): Promise<void> {
    this.emergencyControls.emergencyStopActive = true;
    this.emergencyControls.reason = reason;
    this.emergencyControls.lastActivated = new Date();

    // Pause all active operations
    const activeOperations = columnBatchProcessorService.getActiveOperations();
    for (const operation of activeOperations) {
      try {
        await columnBatchProcessorService.pauseBatchOperation(operation.id);
        logger.warn(`Emergency stop: Paused operation ${operation.id}`);
      } catch (error) {
        logger.error(`Failed to pause operation ${operation.id} during emergency stop:`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.critical(`Emergency stop activated by ${activatedBy}: ${reason}`);
    this.emit('emergency:activated', {
      reason,
      activatedBy,
      affectedOperations: activeOperations.length,
    });
  }

  /**
   * Deactivate emergency stop
   */
  async deactivateEmergencyStop(deactivatedBy: string): Promise<void> {
    this.emergencyControls.emergencyStopActive = false;
    this.emergencyControls.reason = undefined;

    logger.info(`Emergency stop deactivated by ${deactivatedBy}`);
    this.emit('emergency:deactivated', { deactivatedBy });
  }

  /**
   * Get current safety status
   */
  async getSafetyStatus(): Promise<{
    systemHealth: SystemHealthCheck;
    emergencyControls: EmergencyControls;
    activeLimits: SafetyLimits;
    recentViolations: SafetyViolation[];
    blockedUsers: string[];
  }> {
    const systemHealth = await this.performHealthCheck();
    const recentViolations = Array.from(this.violations.values())
      .filter(v => Date.now() - v.triggeredAt.getTime() < 24 * 60 * 60 * 1000) // Last 24 hours
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());

    const blockedUsers = Array.from(this.userLimitStatus.values())
      .filter(status => status.status === 'blocked')
      .map(status => status.userId);

    return {
      systemHealth,
      emergencyControls: this.emergencyControls,
      activeLimits: this.safetyLimits,
      recentViolations,
      blockedUsers,
    };
  }

  /**
   * Update safety limits
   */
  async updateSafetyLimits(newLimits: Partial<SafetyLimits>): Promise<void> {
    this.safetyLimits = { ...this.safetyLimits, ...newLimits };

    logger.info('Safety limits updated:', newLimits);
    this.emit('limits:updated', { newLimits });
  }

  /**
   * Get user limit status
   */
  async getUserLimitStatus(userId: string): Promise<UserLimitStatus> {
    let status = this.userLimitStatus.get(userId);

    if (!status) {
      status = {
        userId,
        currentLimits: {
          operationsToday: 0,
          costToday: 0,
          activeOperations: 0,
          recentRequests: 0,
        },
        violations: [],
        status: 'normal',
      };
      this.userLimitStatus.set(userId, status);
    }

    // Update current limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    status.currentLimits.operationsToday = await this.getUserDailyOperations(userId, today);
    status.currentLimits.costToday = await this.getUserDailyCost(userId, today);

    const activeOps = columnBatchProcessorService.getActiveOperations();
    status.currentLimits.activeOperations = activeOps.filter(
      op => op.configuration.metadata?.initiatedBy === userId
    ).length;

    // Check for recent violations
    const recentViolations = Array.from(this.violations.values()).filter(
      v => v.userId === userId && Date.now() - v.triggeredAt.getTime() < 60 * 60 * 1000
    );

    status.violations = recentViolations;

    // Update status based on violations
    if (recentViolations.some(v => v.severity === 'emergency')) {
      status.status = 'blocked';
      status.nextAllowedOperation = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hour block
    } else if (recentViolations.some(v => v.severity === 'critical')) {
      status.status = 'throttled';
      status.nextAllowedOperation = new Date(Date.now() + 60 * 60 * 1000); // 1 hour throttle
    } else {
      status.status = 'normal';
      status.nextAllowedOperation = undefined;
    }

    return status;
  }

  /**
   * Clear user violations (admin function)
   */
  async clearUserViolations(userId: string, clearedBy: string): Promise<void> {
    const violations = Array.from(this.violations.values()).filter(v => v.userId === userId);

    for (const violation of violations) {
      this.violations.delete(violation.id);
    }

    const status = this.userLimitStatus.get(userId);
    if (status) {
      status.violations = [];
      status.status = 'normal';
      status.nextAllowedOperation = undefined;
    }

    logger.info(`User violations cleared for ${userId} by ${clearedBy}`);
    this.emit('violations:cleared', { userId, clearedBy, violationCount: violations.length });
  }

  /**
   * Check API rate limit for a user
   */
  private checkApiRateLimit(userId: string): {
    allowed: boolean;
    reason?: string;
    waitTime?: number;
  } {
    const now = new Date();
    const userRequests = this.requestCounts.get(userId) || [];

    // Clean old requests
    const validRequests = userRequests.filter(
      req => now.getTime() - req.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    // Count requests in last minute and hour
    const lastMinute = new Date(now.getTime() - 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    const requestsLastMinute = validRequests.filter(req => req.timestamp > lastMinute).length;
    const requestsLastHour = validRequests.filter(req => req.timestamp > lastHour).length;

    // Check limits
    if (requestsLastMinute >= this.safetyLimits.api.maxRequestsPerMinute) {
      return {
        allowed: false,
        reason: `API rate limit exceeded (${requestsLastMinute}/${this.safetyLimits.api.maxRequestsPerMinute} per minute)`,
        waitTime: 1, // Wait 1 minute
      };
    }

    if (requestsLastHour >= this.safetyLimits.api.maxRequestsPerHour) {
      return {
        allowed: false,
        reason: `API rate limit exceeded (${requestsLastHour}/${this.safetyLimits.api.maxRequestsPerHour} per hour)`,
        waitTime: 60, // Wait 1 hour
      };
    }

    // Record this request
    validRequests.push({ timestamp: now, count: 1 });
    this.requestCounts.set(userId, validRequests);

    return { allowed: true };
  }

  /**
   * Trigger a safety violation
   */
  private async triggerViolation(
    violationData: Omit<SafetyViolation, 'id' | 'triggeredAt'>
  ): Promise<void> {
    const violation: SafetyViolation = {
      ...violationData,
      id: `violation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      triggeredAt: new Date(),
    };

    this.violations.set(violation.id, violation);

    // Execute action
    switch (violation.action) {
      case 'pause':
        if (violation.operationId) {
          try {
            await columnBatchProcessorService.pauseBatchOperation(violation.operationId);
            logger.warn(
              `Paused operation ${violation.operationId} due to safety violation: ${violation.message}`
            );
          } catch (error) {
            logger.error(`Failed to pause operation ${violation.operationId}:`, {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
        break;

      case 'cancel':
        if (violation.operationId) {
          try {
            await columnBatchProcessorService.cancelBatchOperation(violation.operationId);
            logger.warn(
              `Cancelled operation ${violation.operationId} due to safety violation: ${violation.message}`
            );
          } catch (error) {
            logger.error(`Failed to cancel operation ${violation.operationId}:`, {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
        break;

      case 'block':
        if (violation.userId) {
          const userStatus = await this.getUserLimitStatus(violation.userId);
          userStatus.status = 'blocked';
          logger.warn(
            `Blocked user ${violation.userId} due to safety violation: ${violation.message}`
          );
        }
        break;
    }

    logger.warn(`Safety violation triggered:`, violation);
    this.emit('violation:triggered', violation);
  }

  /**
   * Perform system health check
   */
  private async performHealthCheck(): Promise<SystemHealthCheck> {
    const timestamp = new Date();
    const metrics = {
      memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
      cpuUsagePercent: 0, // Would need additional monitoring
      diskUsagePercent: 0, // Would need additional monitoring
      activeOperations: columnBatchProcessorService.getActiveOperations().length,
      queueDepth: 0, // Would get from job queue
      errorRate: 0, // Would calculate from recent operations
    };

    const alerts: Array<{ type: string; severity: string; message: string }> = [];
    const recommendations: string[] = [];

    // Check memory usage
    if (metrics.memoryUsageMB > this.safetyLimits.system.maxMemoryUsageMB) {
      alerts.push({
        type: 'memory',
        severity: 'critical',
        message: `High memory usage: ${metrics.memoryUsageMB.toFixed(1)}MB (limit: ${this.safetyLimits.system.maxMemoryUsageMB}MB)`,
      });
      recommendations.push('Consider reducing concurrent operations or restarting the service');
    }

    // Check active operations
    if (metrics.activeOperations >= this.safetyLimits.global.maxConcurrentOperations * 0.9) {
      alerts.push({
        type: 'operations',
        severity: 'warning',
        message: `High number of active operations: ${metrics.activeOperations}`,
      });
      recommendations.push(
        'Monitor operation completion rates and consider increasing processing capacity'
      );
    }

    const healthy = alerts.length === 0 || !alerts.some(a => a.severity === 'critical');

    return {
      timestamp,
      healthy,
      metrics,
      alerts,
      recommendations,
    };
  }

  /**
   * Get user daily operations count
   */
  private async getUserDailyOperations(userId: string, date: Date): Promise<number> {
    const history = columnBatchProcessorService.getOperationHistory(1000);
    const userOpsToday = history.filter(
      op =>
        op.configuration.metadata?.initiatedBy === userId &&
        op.timing.startedAt &&
        op.timing.startedAt >= date
    );
    return userOpsToday.length;
  }

  /**
   * Get user daily cost
   */
  private async getUserDailyCost(userId: string, date: Date): Promise<number> {
    const history = columnBatchProcessorService.getOperationHistory(1000);
    const userOpsToday = history.filter(
      op =>
        op.configuration.metadata?.initiatedBy === userId &&
        op.timing.startedAt &&
        op.timing.startedAt >= date
    );
    return userOpsToday.reduce((sum, op) => sum + op.costs.actualCost, 0);
  }

  /**
   * Get user operations since a specific time
   */
  private async getUserOperationsSince(userId: string, since: Date): Promise<number> {
    const history = columnBatchProcessorService.getOperationHistory(1000);
    const userOpsSince = history.filter(
      op =>
        op.configuration.metadata?.initiatedBy === userId &&
        op.timing.startedAt &&
        op.timing.startedAt >= since
    );
    return userOpsSince.length;
  }

  /**
   * Estimate wait time for next operation
   */
  private async estimateWaitTime(): Promise<number> {
    const activeOperations = columnBatchProcessorService.getActiveOperations();
    const avgCompletionTime = 3600; // 1 hour estimate

    // Simple estimate: average time divided by number of operations
    return Math.max(15, avgCompletionTime / Math.max(1, activeOperations.length));
  }

  /**
   * Initialize default safety limits
   */
  private initializeSafetyLimits(): void {
    this.safetyLimits = {
      global: {
        maxConcurrentOperations: 5,
        maxOperationsPerHour: 10,
        maxOperationsPerDay: 50,
        maxOperationsPerUser: 3,
        maxTotalCostPerDay: 500,
        maxTotalCostPerUser: 100,
      },
      operation: {
        maxTermsPerOperation: 5000,
        maxCostPerOperation: 100,
        maxDurationHours: 24,
        maxErrorRate: 0.2,
        maxRetries: 3,
      },
      api: {
        maxRequestsPerMinute: 60,
        maxRequestsPerHour: 1000,
        cooldownPeriodMinutes: 5,
      },
      system: {
        maxMemoryUsageMB: 2048,
        maxCpuUsagePercent: 80,
        maxDiskUsagePercent: 90,
        emergencyStopThreshold: 95,
      },
    };
  }

  /**
   * Initialize emergency controls
   */
  private initializeEmergencyControls(): void {
    this.emergencyControls = {
      emergencyStopActive: false,
      pauseAllOperations: false,
      blockNewOperations: false,
      emergencyContacts: ['admin@example.com'],
    };
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthCheck = await this.performHealthCheck();

        if (!healthCheck.healthy) {
          this.emit('health:degraded', healthCheck);
        }

        // Auto-trigger emergency stop if critical
        const criticalAlerts = healthCheck.alerts.filter(a => a.severity === 'critical');
        if (criticalAlerts.length > 0 && !this.emergencyControls.emergencyStopActive) {
          await this.activateEmergencyStop(
            `Auto-triggered due to critical health alerts: ${criticalAlerts.map(a => a.message).join(', ')}`,
            'system'
          );
        }
      } catch (error) {
        logger.error('Health check failed:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, 60000); // Every minute

    // Cleanup old data periodically
    setInterval(
      () => {
        this.cleanupOldData();
      },
      60 * 60 * 1000
    ); // Every hour
  }

  /**
   * Cleanup old violations and request counts
   */
  private cleanupOldData(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Cleanup old violations
    for (const [id, violation] of this.violations.entries()) {
      if (violation.triggeredAt < oneDayAgo) {
        this.violations.delete(id);
      }
    }

    // Cleanup old request counts
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [userId, requests] of this.requestCounts.entries()) {
      const validRequests = requests.filter(req => req.timestamp > oneHourAgo);
      if (validRequests.length === 0) {
        this.requestCounts.delete(userId);
      } else {
        this.requestCounts.set(userId, validRequests);
      }
    }
  }
}

// Export singleton instance
export const batchSafetyControlsService = new BatchSafetyControlsService();
export default batchSafetyControlsService;
