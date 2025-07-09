/**
 * Cost Management Service - Phase 2 Enhanced Content Generation System
 *
 * Provides comprehensive cost tracking, budgeting, and monitoring for AI operations
 * with real-time alerts and detailed analytics.
 */

import { EventEmitter } from 'node:events';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { aiUsageAnalytics } from '../../shared/enhancedSchema';
import { db } from '../db';
import { log as logger } from '../utils/logger';

// Cost tracking interfaces
export interface CostBudget {
  id: string;
  name: string;
  description?: string;
  totalBudget: number;
  usedBudget: number;
  remainingBudget: number;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'project';
  startDate: Date;
  endDate: Date;
  categories: string[];
  alertThresholds: {
    warning: number; // Percentage
    critical: number; // Percentage
  };
  status: 'active' | 'paused' | 'exceeded' | 'completed';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostAlert {
  id: string;
  budgetId: string;
  type: 'warning' | 'critical' | 'exceeded';
  message: string;
  currentSpend: number;
  budgetLimit: number;
  percentageUsed: number;
  triggeredAt: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface CostAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
  averageCostPerRequest: number;
  averageTokensPerRequest: number;
  breakdown: {
    byModel: Array<{
      model: string;
      cost: number;
      requests: number;
      tokens: number;
      percentage: number;
    }>;
    byOperation: Array<{
      operation: string;
      cost: number;
      requests: number;
      tokens: number;
      percentage: number;
    }>;
    byUser: Array<{
      userId: string;
      cost: number;
      requests: number;
      tokens: number;
      percentage: number;
    }>;
    byDay: Array<{
      date: Date;
      cost: number;
      requests: number;
      tokens: number;
    }>;
  };
  trends: {
    costTrend: 'increasing' | 'decreasing' | 'stable';
    usageTrend: 'increasing' | 'decreasing' | 'stable';
    efficiency: number; // Cost per successful operation
  };
  projections: {
    estimatedMonthlySpend: number;
    estimatedYearlySpend: number;
    burnRate: number; // Cost per day
  };
}

export interface CostEstimation {
  operation: string;
  estimatedCost: number;
  estimatedTokens: number;
  confidence: 'high' | 'medium' | 'low';
  basedOn: string;
  factors: {
    modelCost: number;
    expectedPromptTokens: number;
    expectedCompletionTokens: number;
    historicalAverage?: number;
    complexity?: number;
  };
  recommendations: string[];
}

/**
 * Cost Management Service
 *
 * Comprehensive service for managing AI operation costs with budgeting,
 * monitoring, alerting, and analytics capabilities.
 */
export class CostManagementService extends EventEmitter {
  private budgets: Map<string, CostBudget> = new Map();
  private alerts: Map<string, CostAlert> = new Map();

  private readonly MODEL_COSTS = {
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  };

  // Default budget limits
  private readonly DEFAULT_LIMITS = {
    dailyLimit: 100,
    weeklyLimit: 500,
    monthlyLimit: 2000,
    warningThreshold: 75,
    criticalThreshold: 90,
  };

  constructor() {
    super();
    this.initializeDefaultBudgets();
    this.startMonitoring();
  }

  /**
   * Create a new cost budget
   */
  async createBudget(
    budget: Omit<
      CostBudget,
      'id' | 'usedBudget' | 'remainingBudget' | 'status' | 'createdAt' | 'updatedAt'
    >
  ): Promise<string> {
    const budgetId = `budget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newBudget: CostBudget = {
      ...budget,
      id: budgetId,
      usedBudget: 0,
      remainingBudget: budget.totalBudget,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.budgets.set(budgetId, newBudget);

    logger.info(`Created new budget: ${budget.name} ($${budget.totalBudget})`);
    this.emit('budget:created', { budgetId, budget: newBudget });

    return budgetId;
  }

  /**
   * Update an existing budget
   */
  async updateBudget(budgetId: string, updates: Partial<CostBudget>): Promise<boolean> {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }

    const updatedBudget = {
      ...budget,
      ...updates,
      updatedAt: new Date(),
    };

    // Recalculate remaining budget if total budget changed
    if (updates.totalBudget !== undefined) {
      updatedBudget.remainingBudget = updates.totalBudget - budget.usedBudget;
    }

    this.budgets.set(budgetId, updatedBudget);

    logger.info(`Updated budget: ${budgetId}`);
    this.emit('budget:updated', { budgetId, budget: updatedBudget });

    return true;
  }

  /**
   * Delete a budget
   */
  async deleteBudget(budgetId: string): Promise<boolean> {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      return false;
    }

    this.budgets.delete(budgetId);

    logger.info(`Deleted budget: ${budgetId}`);
    this.emit('budget:deleted', { budgetId });

    return true;
  }

  /**
   * Get all budgets
   */
  getBudgets(): CostBudget[] {
    return Array.from(this.budgets.values());
  }

  /**
   * Get budget by ID
   */
  getBudget(budgetId: string): CostBudget | null {
    return this.budgets.get(budgetId) || null;
  }

  /**
   * Get active budgets for a specific period
   */
  getActiveBudgets(date: Date = new Date()): CostBudget[] {
    return Array.from(this.budgets.values()).filter(
      (budget) => budget.status === 'active' && date >= budget.startDate && date <= budget.endDate
    );
  }

  /**
   * Record cost usage
   */
  async recordCostUsage(
    operation: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    userId?: string,
    termId?: string,
    metadata?: any
  ): Promise<number> {
    const cost = this.calculateCost(model, inputTokens, outputTokens);

    // Store in analytics table
    await this.storeCostAnalytics({
      operation,
      model,
      userId,
      termId,
      inputTokens,
      outputTokens,
      cost,
      success: true,
      metadata,
    });

    // Update relevant budgets
    await this.updateBudgetUsage(cost, operation, userId);

    logger.info(`Recorded cost usage: $${cost.toFixed(4)} for ${operation} (${model})`);

    return cost;
  }

  /**
   * Estimate cost for an operation
   */
  async estimateCost(
    operation: string,
    model: string,
    estimatedPromptTokens: number,
    estimatedCompletionTokens: number,
    historicalData?: boolean
  ): Promise<CostEstimation> {
    const modelCosts = this.MODEL_COSTS[model as keyof typeof this.MODEL_COSTS];
    if (!modelCosts) {
      throw new Error(`Unknown model: ${model}`);
    }

    let promptTokens = estimatedPromptTokens;
    let completionTokens = estimatedCompletionTokens;
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    let basedOn = 'static estimates';

    // Use historical data if available and requested
    if (historicalData) {
      try {
        const historical = await this.getHistoricalTokenUsage(operation, model);
        if (historical.count > 5) {
          promptTokens = Math.max(historical.avgInputTokens, estimatedPromptTokens);
          completionTokens = Math.max(historical.avgOutputTokens, estimatedCompletionTokens);
          confidence = historical.count > 20 ? 'high' : 'medium';
          basedOn = `${historical.count} historical operations`;
        }
      } catch (error) {
        logger.warn('Failed to fetch historical data for cost estimation:', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const estimatedCost = this.calculateCost(model, promptTokens, completionTokens);
    const estimatedTokens = promptTokens + completionTokens;

    const recommendations: string[] = [];

    // Add cost optimization recommendations
    if (model === 'gpt-4' && estimatedCost > 0.1) {
      recommendations.push('Consider using gpt-3.5-turbo for ~90% cost savings');
    }

    if (completionTokens > 1000) {
      recommendations.push('Consider reducing max_tokens to control costs');
    }

    if (promptTokens > 2000) {
      recommendations.push('Consider optimizing prompt length to reduce input costs');
    }

    return {
      operation,
      estimatedCost,
      estimatedTokens,
      confidence,
      basedOn,
      factors: {
        modelCost: estimatedCost,
        expectedPromptTokens: promptTokens,
        expectedCompletionTokens: completionTokens,
        historicalAverage: historicalData ? promptTokens + completionTokens : undefined,
      },
      recommendations,
    };
  }

  /**
   * Get cost analytics for a specific period
   */
  async getCostAnalytics(
    startDate: Date,
    endDate: Date,
    filters?: {
      operation?: string;
      model?: string;
      userId?: string;
    }
  ): Promise<CostAnalytics> {
    const whereConditions = [
      gte(aiUsageAnalytics.createdAt, startDate),
      lte(aiUsageAnalytics.createdAt, endDate),
      eq(aiUsageAnalytics.success, true),
    ];

    if (filters?.operation) {
      whereConditions.push(eq(aiUsageAnalytics.operation, filters.operation));
    }

    if (filters?.model) {
      whereConditions.push(eq(aiUsageAnalytics.model, filters.model));
    }

    if (filters?.userId) {
      whereConditions.push(eq(aiUsageAnalytics.userId, filters.userId));
    }

    // Get basic metrics
    const [totalMetrics] = await db
      .select({
        totalCost: sql<number>`SUM(CAST(${aiUsageAnalytics.cost} AS FLOAT))`,
        totalRequests: sql<number>`COUNT(*)`,
        totalTokens: sql<number>`SUM(${aiUsageAnalytics.inputTokens} + ${aiUsageAnalytics.outputTokens})`,
      })
      .from(aiUsageAnalytics)
      .where(and(...whereConditions));

    const totalCost = totalMetrics.totalCost || 0;
    const totalRequests = totalMetrics.totalRequests || 0;
    const totalTokens = totalMetrics.totalTokens || 0;

    // Get breakdown by model
    const byModel = await db
      .select({
        model: aiUsageAnalytics.model,
        cost: sql<number>`SUM(CAST(${aiUsageAnalytics.cost} AS FLOAT))`,
        requests: sql<number>`COUNT(*)`,
        tokens: sql<number>`SUM(${aiUsageAnalytics.inputTokens} + ${aiUsageAnalytics.outputTokens})`,
      })
      .from(aiUsageAnalytics)
      .where(and(...whereConditions))
      .groupBy(aiUsageAnalytics.model)
      .orderBy(desc(sql`SUM(CAST(${aiUsageAnalytics.cost} AS FLOAT))`));

    // Get breakdown by operation
    const byOperation = await db
      .select({
        operation: aiUsageAnalytics.operation,
        cost: sql<number>`SUM(CAST(${aiUsageAnalytics.cost} AS FLOAT))`,
        requests: sql<number>`COUNT(*)`,
        tokens: sql<number>`SUM(${aiUsageAnalytics.inputTokens} + ${aiUsageAnalytics.outputTokens})`,
      })
      .from(aiUsageAnalytics)
      .where(and(...whereConditions))
      .groupBy(aiUsageAnalytics.operation)
      .orderBy(desc(sql`SUM(CAST(${aiUsageAnalytics.cost} AS FLOAT))`));

    // Get breakdown by user (only if not filtering by specific user)
    const byUser = !filters?.userId
      ? await db
          .select({
            userId: aiUsageAnalytics.userId,
            cost: sql<number>`SUM(CAST(${aiUsageAnalytics.cost} AS FLOAT))`,
            requests: sql<number>`COUNT(*)`,
            tokens: sql<number>`SUM(${aiUsageAnalytics.inputTokens} + ${aiUsageAnalytics.outputTokens})`,
          })
          .from(aiUsageAnalytics)
          .where(and(...whereConditions))
          .groupBy(aiUsageAnalytics.userId)
          .orderBy(desc(sql`SUM(CAST(${aiUsageAnalytics.cost} AS FLOAT))`))
          .limit(10)
      : [];

    // Get daily breakdown
    const byDay = await db
      .select({
        date: sql<Date>`DATE(${aiUsageAnalytics.createdAt})`,
        cost: sql<number>`SUM(CAST(${aiUsageAnalytics.cost} AS FLOAT))`,
        requests: sql<number>`COUNT(*)`,
        tokens: sql<number>`SUM(${aiUsageAnalytics.inputTokens} + ${aiUsageAnalytics.outputTokens})`,
      })
      .from(aiUsageAnalytics)
      .where(and(...whereConditions))
      .groupBy(sql`DATE(${aiUsageAnalytics.createdAt})`)
      .orderBy(sql`DATE(${aiUsageAnalytics.createdAt})`);

    // Calculate trends and projections
    const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyAverage = totalCost / Math.max(periodDays, 1);
    const estimatedMonthlySpend = dailyAverage * 30;
    const estimatedYearlySpend = dailyAverage * 365;

    // Determine trends (simplified - would need more sophisticated analysis)
    const costTrend: 'increasing' | 'decreasing' | 'stable' =
      byDay.length > 1 && byDay[byDay.length - 1].cost > byDay[0].cost
        ? 'increasing'
        : byDay.length > 1 && byDay[byDay.length - 1].cost < byDay[0].cost
          ? 'decreasing'
          : 'stable';

    const usageTrend: 'increasing' | 'decreasing' | 'stable' =
      byDay.length > 1 && byDay[byDay.length - 1].requests > byDay[0].requests
        ? 'increasing'
        : byDay.length > 1 && byDay[byDay.length - 1].requests < byDay[0].requests
          ? 'decreasing'
          : 'stable';

    const efficiency = totalRequests > 0 ? totalCost / totalRequests : 0;

    return {
      period: { start: startDate, end: endDate },
      totalCost,
      totalRequests,
      totalTokens,
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      averageTokensPerRequest: totalRequests > 0 ? totalTokens / totalRequests : 0,
      breakdown: {
        byModel: byModel.map((item) => ({
          model: item.model,
          cost: item.cost,
          requests: item.requests,
          tokens: item.tokens,
          percentage: totalCost > 0 ? (item.cost / totalCost) * 100 : 0,
        })),
        byOperation: byOperation.map((item) => ({
          operation: item.operation,
          cost: item.cost,
          requests: item.requests,
          tokens: item.tokens,
          percentage: totalCost > 0 ? (item.cost / totalCost) * 100 : 0,
        })),
        byUser: byUser.map((item) => ({
          userId: item.userId || 'unknown',
          cost: item.cost,
          requests: item.requests,
          tokens: item.tokens,
          percentage: totalCost > 0 ? (item.cost / totalCost) * 100 : 0,
        })),
        byDay: byDay.map((item) => ({
          date: item.date,
          cost: item.cost,
          requests: item.requests,
          tokens: item.tokens,
        })),
      },
      trends: {
        costTrend,
        usageTrend,
        efficiency,
      },
      projections: {
        estimatedMonthlySpend,
        estimatedYearlySpend,
        burnRate: dailyAverage,
      },
    };
  }

  /**
   * Get all cost alerts
   */
  getCostAlerts(): CostAlert[] {
    return Array.from(this.alerts.values()).sort(
      (a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime()
    );
  }

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts(): CostAlert[] {
    return this.getCostAlerts().filter((alert) => !alert.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    logger.info(`Alert ${alertId} acknowledged by ${acknowledgedBy}`);
    this.emit('alert:acknowledged', { alertId, alert });

    return true;
  }

  /**
   * Get cost summary for dashboard
   */
  async getCostSummary(): Promise<{
    today: number;
    thisWeek: number;
    thisMonth: number;
    activeAlerts: number;
    activeBudgets: number;
    budgetUtilization: number;
  }> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayCost] = await db
      .select({
        cost: sql<number>`COALESCE(SUM(CAST(${aiUsageAnalytics.cost} AS FLOAT)), 0)`,
      })
      .from(aiUsageAnalytics)
      .where(and(gte(aiUsageAnalytics.createdAt, todayStart), eq(aiUsageAnalytics.success, true)));

    const [weekCost] = await db
      .select({
        cost: sql<number>`COALESCE(SUM(CAST(${aiUsageAnalytics.cost} AS FLOAT)), 0)`,
      })
      .from(aiUsageAnalytics)
      .where(and(gte(aiUsageAnalytics.createdAt, weekStart), eq(aiUsageAnalytics.success, true)));

    const [monthCost] = await db
      .select({
        cost: sql<number>`COALESCE(SUM(CAST(${aiUsageAnalytics.cost} AS FLOAT)), 0)`,
      })
      .from(aiUsageAnalytics)
      .where(and(gte(aiUsageAnalytics.createdAt, monthStart), eq(aiUsageAnalytics.success, true)));

    const activeBudgets = this.getActiveBudgets();
    const activeAlerts = this.getUnacknowledgedAlerts();

    const totalBudget = activeBudgets.reduce((sum, budget) => sum + budget.totalBudget, 0);
    const usedBudget = activeBudgets.reduce((sum, budget) => sum + budget.usedBudget, 0);
    const budgetUtilization = totalBudget > 0 ? (usedBudget / totalBudget) * 100 : 0;

    return {
      today: todayCost.cost,
      thisWeek: weekCost.cost,
      thisMonth: monthCost.cost,
      activeAlerts: activeAlerts.length,
      activeBudgets: activeBudgets.length,
      budgetUtilization,
    };
  }

  /**
   * Calculate cost for given model and tokens
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const costs = this.MODEL_COSTS[model as keyof typeof this.MODEL_COSTS];
    if (!costs) {
      logger.warn(`Unknown model for cost calculation: ${model}`);
      return 0;
    }

    return (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;
  }

  /**
   * Store cost analytics in database
   */
  private async storeCostAnalytics(data: {
    operation: string;
    model: string;
    userId?: string;
    termId?: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
    success: boolean;
    metadata?: any;
  }): Promise<void> {
    try {
      await db.insert(aiUsageAnalytics).values({
        operation: data.operation,
        model: data.model,
        userId: data.userId,
        termId: data.termId,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        cost: data.cost.toString(),
        success: data.success,
        latency: 0, // Not tracking latency in cost recording
        metadata: data.metadata,
      });
    } catch (error) {
      logger.error('Failed to store cost analytics:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Update budget usage
   */
  private async updateBudgetUsage(
    cost: number,
    operation: string,
    _userId?: string
  ): Promise<void> {
    const activeBudgets = this.getActiveBudgets();

    for (const budget of activeBudgets) {
      // Check if this operation/user is covered by this budget
      if (budget.categories.length > 0 && !budget.categories.includes(operation)) {
        continue;
      }

      budget.usedBudget += cost;
      budget.remainingBudget = budget.totalBudget - budget.usedBudget;
      budget.updatedAt = new Date();

      // Check for budget alerts
      const percentageUsed = (budget.usedBudget / budget.totalBudget) * 100;

      if (percentageUsed >= budget.alertThresholds.critical && budget.status !== 'exceeded') {
        budget.status = 'exceeded';
        await this.createAlert(budget, 'critical', percentageUsed);
      } else if (percentageUsed >= budget.alertThresholds.warning) {
        await this.createAlert(budget, 'warning', percentageUsed);
      }
    }
  }

  /**
   * Create a cost alert
   */
  private async createAlert(
    budget: CostBudget,
    type: 'warning' | 'critical',
    percentageUsed: number
  ): Promise<void> {
    const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Check if we already have a recent alert of this type for this budget
    const recentAlerts = Array.from(this.alerts.values()).filter(
      (alert) =>
        alert.budgetId === budget.id &&
        alert.type === type &&
        Date.now() - alert.triggeredAt.getTime() < 60 * 60 * 1000 // Within last hour
    );

    if (recentAlerts.length > 0) {
      return; // Don't spam alerts
    }

    const alert: CostAlert = {
      id: alertId,
      budgetId: budget.id,
      type,
      message: `Budget "${budget.name}" has ${type === 'critical' ? 'exceeded critical threshold' : 'reached warning threshold'} at ${percentageUsed.toFixed(1)}%`,
      currentSpend: budget.usedBudget,
      budgetLimit: budget.totalBudget,
      percentageUsed,
      triggeredAt: new Date(),
      acknowledged: false,
    };

    this.alerts.set(alertId, alert);

    logger.warn(`Cost alert triggered: ${alert.message}`);
    this.emit('alert:triggered', { alertId, alert, budget });
  }

  /**
   * Get historical token usage for cost estimation
   */
  private async getHistoricalTokenUsage(
    operation: string,
    model: string
  ): Promise<{
    count: number;
    avgInputTokens: number;
    avgOutputTokens: number;
  }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [result] = await db
      .select({
        count: sql<number>`COUNT(*)`,
        avgInputTokens: sql<number>`AVG(${aiUsageAnalytics.inputTokens})`,
        avgOutputTokens: sql<number>`AVG(${aiUsageAnalytics.outputTokens})`,
      })
      .from(aiUsageAnalytics)
      .where(
        and(
          eq(aiUsageAnalytics.operation, operation),
          eq(aiUsageAnalytics.model, model),
          eq(aiUsageAnalytics.success, true),
          gte(aiUsageAnalytics.createdAt, thirtyDaysAgo)
        )
      );

    return {
      count: result.count || 0,
      avgInputTokens: Math.ceil(result.avgInputTokens || 0),
      avgOutputTokens: Math.ceil(result.avgOutputTokens || 0),
    };
  }

  /**
   * Initialize default budgets
   */
  private async initializeDefaultBudgets(): Promise<void> {
    // Create monthly budget if none exists
    const existingBudgets = this.getBudgets();
    if (existingBudgets.length === 0) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      await this.createBudget({
        name: 'Default Monthly Budget',
        description: 'Automatically created default monthly budget',
        totalBudget: this.DEFAULT_LIMITS.monthlyLimit,
        period: 'monthly',
        startDate: monthStart,
        endDate: monthEnd,
        categories: [], // All operations
        alertThresholds: {
          warning: this.DEFAULT_LIMITS.warningThreshold,
          critical: this.DEFAULT_LIMITS.criticalThreshold,
        },
        createdBy: 'system',
      });

      logger.info('Created default monthly budget');
    }
  }

  /**
   * Start monitoring for automatic budget management
   */
  private startMonitoring(): void {
    // Check budgets every hour
    setInterval(
      () => {
        this.updateBudgetStatuses();
      },
      60 * 60 * 1000
    );

    // Cleanup old alerts daily
    setInterval(
      () => {
        this.cleanupOldAlerts();
      },
      24 * 60 * 60 * 1000
    );
  }

  /**
   * Update budget statuses
   */
  private async updateBudgetStatuses(): Promise<void> {
    const now = new Date();

    for (const budget of this.budgets.values()) {
      if (budget.endDate < now && budget.status === 'active') {
        budget.status = 'completed';
        budget.updatedAt = new Date();

        logger.info(`Budget ${budget.name} completed`);
        this.emit('budget:completed', { budgetId: budget.id, budget });
      }
    }
  }

  /**
   * Cleanup old alerts (keep last 30 days)
   */
  private cleanupOldAlerts(): void {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const alertsToRemove: string[] = [];

    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.triggeredAt < thirtyDaysAgo && alert.acknowledged) {
        alertsToRemove.push(alertId);
      }
    }

    for (const alertId of alertsToRemove) {
      this.alerts.delete(alertId);
    }

    if (alertsToRemove.length > 0) {
      logger.info(`Cleaned up ${alertsToRemove.length} old alerts`);
    }
  }
}

// Export singleton instance
export const costManagementService = new CostManagementService();
export default costManagementService;
