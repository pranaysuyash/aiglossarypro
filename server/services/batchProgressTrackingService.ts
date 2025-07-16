/**
 * Batch Progress Tracking Service - Phase 2 Enhanced Content Generation System
 *
 * Provides real-time progress tracking, status reporting, and analytics
 * for column batch processing operations.
 */

import { EventEmitter } from 'node:events';
import { jobQueueManager } from '../jobs/queue';
import { log as logger } from '../utils/logger';
import { columnBatchProcessorService } from './columnBatchProcessorService';
import { costManagementService } from './costManagementService';

// Progress tracking interfaces
export interface ProgressSnapshot {
  timestamp: Date;
  operationId: string;
  sectionName: string;
  status: string;
  completionPercentage: number;
  processedTerms: number;
  totalTerms: number;
  currentCost: number;
  estimatedCost: number;
  processingRate: number; // Terms per minute
  estimatedTimeRemaining: number; // Minutes
  errorRate: number;
  recentErrors: Array<{
    termId: string;
    error: string;
    timestamp: Date;
  }>;
}

export interface ProgressMetrics {
  operationId: string;
  totalDuration: number;
  averageProcessingRate: number;
  peakProcessingRate: number;
  totalCost: number;
  costEfficiency: number; // Cost per successful term
  errorRate: number;
  throughputAnalysis: {
    hourlyBreakdown: Array<{
      hour: Date;
      termsProcessed: number;
      cost: number;
      errorCount: number;
    }>;
    performanceTrends: {
      processingRateChange: number; // Percentage change
      costRateChange: number;
      errorRateChange: number;
    };
  };
  qualityMetrics?: {
    averageContentLength: number;
    contentConsistencyScore: number;
  };
}

export interface StatusReport {
  operationId: string;
  reportType: 'progress' | 'completion' | 'error' | 'milestone';
  timestamp: Date;
  currentStatus: string;
  summary: {
    completionPercentage: number;
    processedTerms: number;
    totalTerms: number;
    currentCost: number;
    timeElapsed: number;
    estimatedTimeRemaining: number;
  };
  performance: {
    processingRate: number;
    costEfficiency: number;
    errorRate: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
  };
  issues?: Array<{
    type: 'warning' | 'error' | 'critical';
    message: string;
    impact: string;
    recommendation: string;
  }>;
  milestoneReached?: {
    percentage: number;
    achievedAt: Date;
    performanceAtMilestone: {
      actualRate: number;
      expectedRate: number;
      costAtMilestone: number;
      expectedCost: number;
    };
  };
}

export interface DashboardData {
  activeOperations: Array<{
    operationId: string;
    sectionName: string;
    status: string;
    completionPercentage: number;
    currentCost: number;
    estimatedTimeRemaining: number;
    health: 'healthy' | 'warning' | 'critical';
  }>;
  systemMetrics: {
    totalActiveOperations: number;
    totalCostToday: number;
    averageCompletionTime: number;
    systemHealthScore: number;
    queueDepth: number;
    processingCapacityUtilization: number;
  };
  alerts: Array<{
    id: string;
    type: 'cost' | 'performance' | 'error' | 'stale';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    operationId?: string;
    triggeredAt: Date;
  }>;
  recentActivity: Array<{
    timestamp: Date;
    operationId: string;
    event: string;
    details: any;
  }>;
}

/**
 * Batch Progress Tracking Service
 *
 * Comprehensive service for tracking and reporting on batch operation progress
 * with real-time analytics and performance monitoring.
 */
export class BatchProgressTrackingService extends EventEmitter {
  private progressSnapshots: Map<string, ProgressSnapshot[]> = new Map();
  private statusReports: Map<string, StatusReport[]> = new Map();
  private activeMonitors: Map<string, NodeJS.Timeout> = new Map();
  private alertThresholds = {
    slowProcessingRate: 5, // Terms per minute
    highErrorRate: 0.1, // 10%
    costOverrun: 1.2, // 20% over estimate
    staleTime: 300000, // 5 minutes with no progress
  };

  constructor() {
    super();
    this.initializeService();
  }

  /**
   * Start monitoring a batch operation
   */
  async startMonitoring(
    operationId: string,
    monitoringOptions?: {
      snapshotInterval?: number;
      alertThresholds?: Partial<typeof this.alertThresholds>;
      reportMilestones?: number[];
    }
  ): Promise<void> {
    const interval = monitoringOptions?.snapshotInterval || 30000; // 30 seconds default
    const milestones = monitoringOptions?.reportMilestones || [25, 50, 75, 90];

    // Update alert thresholds if provided
    if (monitoringOptions?.alertThresholds) {
      Object.assign(this.alertThresholds, monitoringOptions.alertThresholds);
    }

    logger.info(`Starting progress monitoring for operation ${operationId}`);

    // Initialize storage for this operation
    this.progressSnapshots.set(operationId, []);
    this.statusReports.set(operationId, []);

    // Create monitoring interval
    const monitor = setInterval(async () => {
      try {
        await this.captureProgressSnapshot(operationId);
        await this.analyzeProgress(operationId, milestones);
      } catch (error) {
        logger.error(`Error monitoring operation ${operationId}:`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }, interval);

    this.activeMonitors.set(operationId, monitor);

    // Emit monitoring started event
    this.emit('monitoring:started', { operationId, interval, milestones });
  }

  /**
   * Stop monitoring a batch operation
   */
  async stopMonitoring(operationId: string): Promise<void> {
    const monitor = this.activeMonitors.get(operationId);
    if (monitor) {
      clearInterval(monitor);
      this.activeMonitors.delete(operationId);

      // Generate final report
      await this.generateFinalReport(operationId);

      logger.info(`Stopped progress monitoring for operation ${operationId}`);
      this.emit('monitoring:stopped', { operationId });
    }
  }

  /**
   * Get current progress for an operation
   */
  getCurrentProgress(operationId: string): ProgressSnapshot | null {
    const snapshots = this.progressSnapshots.get(operationId);
    return snapshots && snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  }

  /**
   * Get progress history for an operation
   */
  getProgressHistory(operationId: string, limit?: number): ProgressSnapshot[] {
    const snapshots = this.progressSnapshots.get(operationId) || [];
    return limit ? snapshots.slice(-limit) : snapshots;
  }

  /**
   * Get status reports for an operation
   */
  getStatusReports(operationId: string, reportType?: string): StatusReport[] {
    const reports = this.statusReports.get(operationId) || [];
    return reportType ? reports.filter(r => r.reportType === reportType) : reports;
  }

  /**
   * Get dashboard data for admin interface
   */
  async getDashboardData(): Promise<DashboardData> {
    const activeOperations = columnBatchProcessorService.getActiveOperations();
    const costSummary = await costManagementService.getCostSummary();
    const queueStats = await jobQueueManager.getAllQueueStats();

    // Calculate active operations data
    const activeOpsData = activeOperations.map(op => {
      const _currentProgress = this.getCurrentProgress(op.id);
      const health = this.calculateOperationHealth(op.id);

      return {
        operationId: op.id,
        sectionName: op.sectionName,
        status: op.status,
        completionPercentage: op.progress.completionPercentage,
        currentCost: op.costs.actualCost,
        estimatedTimeRemaining: this.calculateEstimatedTimeRemaining(op.id),
        health,
      };
    });

    // Calculate system metrics
    const totalQueueJobs = Object.values(queueStats).reduce(
      (sum, stat: any) => sum + stat.total,
      0
    );
    const processingCapacity = Object.values(queueStats).reduce(
      (sum, stat: any) => sum + stat.active,
      0
    );
    const maxCapacity = 50; // Estimated max concurrent jobs

    const systemMetrics = {
      totalActiveOperations: activeOperations.length,
      totalCostToday: costSummary.today,
      averageCompletionTime: await this.calculateAverageCompletionTime(),
      systemHealthScore: this.calculateSystemHealthScore(),
      queueDepth: totalQueueJobs,
      processingCapacityUtilization: (processingCapacity / maxCapacity) * 100,
    };

    // Get alerts
    const alerts = this.generateSystemAlerts();

    // Get recent activity
    const recentActivity = this.getRecentActivity();

    return {
      activeOperations: activeOpsData,
      systemMetrics,
      alerts,
      recentActivity,
    };
  }

  /**
   * Get detailed metrics for an operation
   */
  async getDetailedMetrics(operationId: string): Promise<ProgressMetrics | null> {
    const operation = columnBatchProcessorService.getOperationStatus(operationId);
    const snapshots = this.getProgressHistory(operationId);

    if (!operation || snapshots.length === 0) {
      return null;
    }

    const startTime = operation.timing.startedAt?.getTime() || Date.now();
    const endTime = operation.timing.actualCompletion?.getTime() || Date.now();
    const totalDuration = endTime - startTime;

    // Calculate processing rates
    const processingRates = snapshots.map(s => s.processingRate).filter(r => r > 0);
    const averageProcessingRate =
      processingRates.length > 0
        ? processingRates.reduce((sum, rate) => sum + rate, 0) / processingRates.length
        : 0;
    const peakProcessingRate = Math.max(...processingRates, 0);

    // Calculate cost efficiency
    const successfulTerms = operation.progress.processedTerms;
    const costEfficiency = successfulTerms > 0 ? operation.costs.actualCost / successfulTerms : 0;

    // Generate hourly breakdown
    const hourlyBreakdown = this.generateHourlyBreakdown(snapshots);

    // Calculate performance trends
    const performanceTrends = this.calculatePerformanceTrends(snapshots);

    return {
      operationId,
      totalDuration,
      averageProcessingRate,
      peakProcessingRate,
      totalCost: operation.costs.actualCost,
      costEfficiency,
      errorRate:
        operation.progress.totalTerms > 0
          ? operation.progress.failedTerms / operation.progress.totalTerms
          : 0,
      throughputAnalysis: {
        hourlyBreakdown,
        performanceTrends,
      },
      qualityMetrics: operation.result?.qualityMetrics,
    };
  }

  /**
   * Capture a progress snapshot for an operation
   */
  private async captureProgressSnapshot(operationId: string): Promise<void> {
    const operation = columnBatchProcessorService.getOperationStatus(operationId);
    if (!operation) {
      return;
    }

    const previousSnapshots = this.progressSnapshots.get(operationId) || [];
    const previousSnapshot = previousSnapshots[previousSnapshots.length - 1];

    // Calculate processing rate
    let processingRate = 0;
    if (previousSnapshot) {
      const timeDiff = (Date.now() - previousSnapshot.timestamp.getTime()) / 1000 / 60; // Minutes
      const termsDiff = operation.progress.processedTerms - previousSnapshot.processedTerms;
      processingRate = timeDiff > 0 ? termsDiff / timeDiff : 0;
    }

    // Calculate estimated time remaining
    let estimatedTimeRemaining = 0;
    if (processingRate > 0) {
      const remainingTerms = operation.progress.totalTerms - operation.progress.processedTerms;
      estimatedTimeRemaining = remainingTerms / processingRate;
    }

    // Calculate error rate
    const totalProcessed = operation.progress.processedTerms + operation.progress.failedTerms;
    const errorRate = totalProcessed > 0 ? operation.progress.failedTerms / totalProcessed : 0;

    const snapshot: ProgressSnapshot = {
      timestamp: new Date(),
      operationId,
      sectionName: operation.sectionName,
      status: operation.status,
      completionPercentage: operation.progress.completionPercentage,
      processedTerms: operation.progress.processedTerms,
      totalTerms: operation.progress.totalTerms,
      currentCost: operation.costs.actualCost,
      estimatedCost: operation.costs.estimatedCost,
      processingRate,
      estimatedTimeRemaining,
      errorRate,
      recentErrors: operation.errors.slice(-5), // Last 5 errors
    };

    previousSnapshots.push(snapshot);
    this.progressSnapshots.set(operationId, previousSnapshots);

    // Emit progress update event
    this.emit('progress:updated', { operationId, snapshot });
  }

  /**
   * Analyze progress and generate reports/alerts
   */
  private async analyzeProgress(operationId: string, milestones: number[]): Promise<void> {
    const operation = columnBatchProcessorService.getOperationStatus(operationId);
    const currentSnapshot = this.getCurrentProgress(operationId);

    if (!operation || !currentSnapshot) {
      return;
    }

    // Check for milestone achievements
    for (const milestone of milestones) {
      if (currentSnapshot.completionPercentage >= milestone) {
        const reports = this.getStatusReports(operationId, 'milestone');
        const alreadyReported = reports.some(r => r.milestoneReached?.percentage === milestone);

        if (!alreadyReported) {
          await this.generateMilestoneReport(operationId, milestone, currentSnapshot);
        }
      }
    }

    // Check for alerts
    await this.checkForAlerts(operationId, currentSnapshot);
  }

  /**
   * Generate milestone report
   */
  private async generateMilestoneReport(
    operationId: string,
    milestone: number,
    snapshot: ProgressSnapshot
  ): Promise<void> {
    const operation = columnBatchProcessorService.getOperationStatus(operationId);
    if (!operation) {return;}

    const report: StatusReport = {
      operationId,
      reportType: 'milestone',
      timestamp: new Date(),
      currentStatus: operation.status,
      summary: {
        completionPercentage: snapshot.completionPercentage,
        processedTerms: snapshot.processedTerms,
        totalTerms: snapshot.totalTerms,
        currentCost: snapshot.currentCost,
        timeElapsed: operation.timing.startedAt
          ? Date.now() - operation.timing.startedAt.getTime()
          : 0,
        estimatedTimeRemaining: snapshot.estimatedTimeRemaining,
      },
      performance: {
        processingRate: snapshot.processingRate,
        costEfficiency:
          snapshot.processedTerms > 0 ? snapshot.currentCost / snapshot.processedTerms : 0,
        errorRate: snapshot.errorRate,
        systemHealth: this.calculateOperationHealth(operationId),
      },
      milestoneReached: {
        percentage: milestone,
        achievedAt: new Date(),
        performanceAtMilestone: {
          actualRate: snapshot.processingRate,
          expectedRate: this.calculateExpectedRate(operationId),
          costAtMilestone: snapshot.currentCost,
          expectedCost: (snapshot.estimatedCost * milestone) / 100,
        },
      },
    };

    const reports = this.statusReports.get(operationId) || [];
    reports.push(report);
    this.statusReports.set(operationId, reports);

    logger.info(`Milestone ${milestone}% reached for operation ${operationId}`);
    this.emit('milestone:reached', { operationId, milestone, report });
  }

  /**
   * Check for alerts based on current progress
   */
  private async checkForAlerts(operationId: string, snapshot: ProgressSnapshot): Promise<void> {
    const alerts: Array<{ type: string; severity: string; message: string }> = [];

    // Check processing rate
    if (
      snapshot.processingRate > 0 &&
      snapshot.processingRate < this.alertThresholds.slowProcessingRate
    ) {
      alerts.push({
        type: 'performance',
        severity: 'medium',
        message: `Slow processing rate: ${snapshot.processingRate.toFixed(1)} terms/min (threshold: ${this.alertThresholds.slowProcessingRate})`,
      });
    }

    // Check error rate
    if (snapshot.errorRate > this.alertThresholds.highErrorRate) {
      alerts.push({
        type: 'error',
        severity: 'high',
        message: `High error rate: ${(snapshot.errorRate * 100).toFixed(1)}% (threshold: ${(this.alertThresholds.highErrorRate * 100).toFixed(1)}%)`,
      });
    }

    // Check cost overrun
    if (snapshot.currentCost > snapshot.estimatedCost * this.alertThresholds.costOverrun) {
      alerts.push({
        type: 'cost',
        severity: 'high',
        message: `Cost overrun: $${snapshot.currentCost.toFixed(2)} vs estimated $${snapshot.estimatedCost.toFixed(2)}`,
      });
    }

    // Emit alerts
    for (const alert of alerts) {
      this.emit('alert:triggered', { operationId, ...alert });
    }
  }

  /**
   * Generate final completion report
   */
  private async generateFinalReport(operationId: string): Promise<void> {
    const operation = columnBatchProcessorService.getOperationStatus(operationId);
    const metrics = await this.getDetailedMetrics(operationId);

    if (!operation || !metrics) {
      return;
    }

    const report: StatusReport = {
      operationId,
      reportType: 'completion',
      timestamp: new Date(),
      currentStatus: operation.status,
      summary: {
        completionPercentage: operation.progress.completionPercentage,
        processedTerms: operation.progress.processedTerms,
        totalTerms: operation.progress.totalTerms,
        currentCost: operation.costs.actualCost,
        timeElapsed: metrics.totalDuration,
        estimatedTimeRemaining: 0,
      },
      performance: {
        processingRate: metrics.averageProcessingRate,
        costEfficiency: metrics.costEfficiency,
        errorRate: metrics.errorRate,
        systemHealth: this.calculateOperationHealth(operationId),
      },
    };

    const reports = this.statusReports.get(operationId) || [];
    reports.push(report);
    this.statusReports.set(operationId, reports);

    logger.info(`Final report generated for operation ${operationId}`);
    this.emit('operation:completed', { operationId, report, metrics });
  }

  /**
   * Calculate operation health status
   */
  private calculateOperationHealth(operationId: string): 'healthy' | 'warning' | 'critical' {
    const snapshot = this.getCurrentProgress(operationId);
    if (!snapshot) {return 'critical';}

    let score = 100;

    // Deduct points for high error rate
    if (snapshot.errorRate > 0.1) {score -= 30;}
    else if (snapshot.errorRate > 0.05) {score -= 15;}

    // Deduct points for slow processing
    if (snapshot.processingRate > 0 && snapshot.processingRate < 5) {score -= 20;}

    // Deduct points for cost overrun
    if (snapshot.currentCost > snapshot.estimatedCost * 1.2) {score -= 25;}

    // Deduct points for stale progress
    const timeSinceUpdate = Date.now() - snapshot.timestamp.getTime();
    if (timeSinceUpdate > this.alertThresholds.staleTime) {score -= 20;}

    if (score >= 80) {return 'healthy';}
    if (score >= 60) {return 'warning';}
    return 'critical';
  }

  /**
   * Calculate expected processing rate
   */
  private calculateExpectedRate(_operationId: string): number {
    // Simple estimate: 1 term per 30 seconds = 2 terms per minute
    return 2;
  }

  /**
   * Generate hourly breakdown of processing
   */
  private generateHourlyBreakdown(snapshots: ProgressSnapshot[]): Array<{
    hour: Date;
    termsProcessed: number;
    cost: number;
    errorCount: number;
  }> {
    const breakdown: Array<{
      hour: Date;
      termsProcessed: number;
      cost: number;
      errorCount: number;
    }> = [];

    // Group snapshots by hour
    const hourlyGroups = new Map<string, ProgressSnapshot[]>();

    for (const snapshot of snapshots) {
      const hour = new Date(snapshot.timestamp);
      hour.setMinutes(0, 0, 0);
      const hourKey = hour.toISOString();

      if (!hourlyGroups.has(hourKey)) {
        hourlyGroups.set(hourKey, []);
      }
      hourlyGroups.get(hourKey)?.push(snapshot);
    }

    // Calculate metrics for each hour
    for (const [hourKey, hourSnapshots] of hourlyGroups) {
      const hour = new Date(hourKey);
      const firstSnapshot = hourSnapshots[0];
      const lastSnapshot = hourSnapshots[hourSnapshots.length - 1];

      breakdown.push({
        hour,
        termsProcessed: lastSnapshot.processedTerms - firstSnapshot.processedTerms,
        cost: lastSnapshot.currentCost - firstSnapshot.currentCost,
        errorCount: lastSnapshot.recentErrors.length,
      });
    }

    return breakdown.sort((a, b) => a.hour.getTime() - b.hour.getTime());
  }

  /**
   * Calculate performance trends
   */
  private calculatePerformanceTrends(snapshots: ProgressSnapshot[]): {
    processingRateChange: number;
    costRateChange: number;
    errorRateChange: number;
  } {
    if (snapshots.length < 2) {
      return { processingRateChange: 0, costRateChange: 0, errorRateChange: 0 };
    }

    const firstHalf = snapshots.slice(0, Math.floor(snapshots.length / 2));
    const secondHalf = snapshots.slice(Math.floor(snapshots.length / 2));

    const firstHalfAvgRate =
      firstHalf.reduce((sum, s) => sum + s.processingRate, 0) / firstHalf.length;
    const secondHalfAvgRate =
      secondHalf.reduce((sum, s) => sum + s.processingRate, 0) / secondHalf.length;

    const firstHalfAvgError = firstHalf.reduce((sum, s) => sum + s.errorRate, 0) / firstHalf.length;
    const secondHalfAvgError =
      secondHalf.reduce((sum, s) => sum + s.errorRate, 0) / secondHalf.length;

    const processingRateChange =
      firstHalfAvgRate > 0 ? ((secondHalfAvgRate - firstHalfAvgRate) / firstHalfAvgRate) * 100 : 0;

    const errorRateChange =
      firstHalfAvgError > 0
        ? ((secondHalfAvgError - firstHalfAvgError) / firstHalfAvgError) * 100
        : 0;

    return {
      processingRateChange,
      costRateChange: 0, // Simplified for now
      errorRateChange,
    };
  }

  /**
   * Calculate average completion time across all operations
   */
  private async calculateAverageCompletionTime(): Promise<number> {
    const history = columnBatchProcessorService.getOperationHistory(100);
    const completedOps = history.filter(
      op => op.status === 'completed' && op.timing.startedAt && op.timing.actualCompletion
    );

    if (completedOps.length === 0) {return 0;}

    const totalTime = completedOps.reduce((sum, op) => {
      if (!op.timing.actualCompletion || !op.timing.startedAt) {return sum;}
      const duration = op.timing.actualCompletion.getTime() - op.timing.startedAt.getTime();
      return sum + duration;
    }, 0);

    return totalTime / completedOps.length;
  }

  /**
   * Calculate system health score
   */
  private calculateSystemHealthScore(): number {
    const activeOps = columnBatchProcessorService.getActiveOperations();
    if (activeOps.length === 0) {return 100;}

    let totalScore = 0;
    for (const op of activeOps) {
      const health = this.calculateOperationHealth(op.id);
      const score = health === 'healthy' ? 100 : health === 'warning' ? 70 : 40;
      totalScore += score;
    }

    return totalScore / activeOps.length;
  }

  /**
   * Generate system-wide alerts
   */
  private generateSystemAlerts(): Array<{
    id: string;
    type: 'cost' | 'performance' | 'error' | 'stale';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    operationId?: string;
    triggeredAt: Date;
  }> {
    const alerts: Array<{
      id: string;
      type: 'cost' | 'performance' | 'error' | 'stale';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      operationId?: string;
      triggeredAt: Date;
    }> = [];

    // Check each active operation
    const activeOps = columnBatchProcessorService.getActiveOperations();
    for (const op of activeOps) {
      const health = this.calculateOperationHealth(op.id);
      if (health === 'critical') {
        alerts.push({
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'performance',
          severity: 'high',
          message: `Operation ${op.sectionName} is in critical state`,
          operationId: op.id,
          triggeredAt: new Date(),
        });
      }
    }

    return alerts;
  }

  /**
   * Get recent activity across all operations
   */
  private getRecentActivity(): Array<{
    timestamp: Date;
    operationId: string;
    event: string;
    details: any;
  }> {
    // This would be populated by listening to events
    // For now, return empty array
    return [];
  }

  /**
   * Calculate estimated time remaining for an operation
   */
  private calculateEstimatedTimeRemaining(operationId: string): number {
    const snapshot = this.getCurrentProgress(operationId);
    return snapshot?.estimatedTimeRemaining || 0;
  }

  /**
   * Initialize the service
   */
  private initializeService(): void {
    // Listen to batch processor events
    columnBatchProcessorService.on('operation:started', ({ operationId }) => {
      this.startMonitoring(operationId);
    });

    columnBatchProcessorService.on('operation:completed', ({ operationId }) => {
      this.stopMonitoring(operationId);
    });

    columnBatchProcessorService.on('operation:failed', ({ operationId }) => {
      this.stopMonitoring(operationId);
    });

    columnBatchProcessorService.on('operation:cancelled', ({ operationId }) => {
      this.stopMonitoring(operationId);
    });

    // Cleanup old data periodically
    setInterval(
      () => {
        this.cleanupOldData();
      },
      24 * 60 * 60 * 1000
    ); // Daily cleanup
  }

  /**
   * Cleanup old progress data
   */
  private cleanupOldData(): void {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    for (const [operationId, snapshots] of this.progressSnapshots.entries()) {
      const filteredSnapshots = snapshots.filter(s => s.timestamp > cutoffDate);
      if (filteredSnapshots.length !== snapshots.length) {
        this.progressSnapshots.set(operationId, filteredSnapshots);
      }
    }

    for (const [operationId, reports] of this.statusReports.entries()) {
      const filteredReports = reports.filter(r => r.timestamp > cutoffDate);
      if (filteredReports.length !== reports.length) {
        this.statusReports.set(operationId, filteredReports);
      }
    }
  }
}

// Export singleton instance
export const batchProgressTrackingService = new BatchProgressTrackingService();
export default batchProgressTrackingService;
