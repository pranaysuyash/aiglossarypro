import { log as logger } from '../utils/logger';
import { NotificationService } from './notificationService';

export interface SafetyLimits {
  dailyCostLimit: number;
  monthlyCostLimit: number;
  maxConcurrentOperations: number;
  maxTermsPerBatch: number;
  maxQueueSize: number;
  minQualityThreshold: number;
  maxFailureRate: number;
  emergencyStopActive: boolean;
}

export interface SafetyMetrics {
  dailySpend: number;
  monthlySpend: number;
  activeOperations: number;
  queueSize: number;
  averageQuality: number;
  failureRate: number;
  lastUpdated: Date;
}

export interface SafetyAlert {
  id: string;
  type: 'cost' | 'quality' | 'capacity' | 'emergency' | 'failure_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  autoResolved: boolean;
}

class SafetyService {
  private limits: SafetyLimits;
  private metrics: SafetyMetrics;
  private alerts: SafetyAlert[] = [];
  private activeOperations: Set<string> = new Set();
  private operationQueue: string[] = [];
  private notificationService: NotificationService;

  constructor() {
    this.limits = {
      dailyCostLimit: parseFloat(process.env.DAILY_COST_LIMIT || '100'),
      monthlyCostLimit: parseFloat(process.env.MONTHLY_COST_LIMIT || '2000'),
      maxConcurrentOperations: parseInt(process.env.MAX_CONCURRENT_OPERATIONS || '5'),
      maxTermsPerBatch: parseInt(process.env.MAX_TERMS_PER_BATCH || '100'),
      maxQueueSize: parseInt(process.env.MAX_QUEUE_SIZE || '500'),
      minQualityThreshold: parseFloat(process.env.MIN_QUALITY_THRESHOLD || '6.0'),
      maxFailureRate: parseFloat(process.env.MAX_FAILURE_RATE || '0.1'),
      emergencyStopActive: false,
    };

    this.metrics = {
      dailySpend: 0,
      monthlySpend: 0,
      activeOperations: 0,
      queueSize: 0,
      averageQuality: 0,
      failureRate: 0,
      lastUpdated: new Date(),
    };

    this.notificationService = new NotificationService();
  }

  // Emergency Stop Controls
  async activateEmergencyStop(reason: string, userId?: string): Promise<void> {
    logger.warn('Emergency stop activated', { reason, userId });
    
    this.limits.emergencyStopActive = true;
    
    // Stop all active operations
    const activeOps = Array.from(this.activeOperations);
    for (const operationId of activeOps) {
      await this.stopOperation(operationId, 'Emergency stop activated');
    }
    
    // Clear queue
    this.operationQueue = [];
    
    // Create critical alert
    const alert: SafetyAlert = {
      id: `emergency-${Date.now()}`,
      type: 'emergency',
      severity: 'critical',
      message: `Emergency stop activated: ${reason}`,
      timestamp: new Date(),
      acknowledged: false,
      autoResolved: false,
    };
    
    this.alerts.push(alert);
    
    // Send notifications
    await this.notificationService.sendNotification({
      type: 'system_alert',
      severity: 'critical',
      title: 'Emergency Stop Activated',
      message: `Emergency stop activated: ${reason}`,
      data: { activeOperations: activeOps.length, queueSize: this.operationQueue.length },
    });
  }

  async deactivateEmergencyStop(userId?: string): Promise<void> {
    logger.info('Emergency stop deactivated', { userId });
    
    this.limits.emergencyStopActive = false;
    
    // Find and resolve emergency alerts
    const emergencyAlerts = this.alerts.filter(a => a.type === 'emergency' && !a.acknowledged);
    emergencyAlerts.forEach(alert => {
      alert.acknowledged = true;
      alert.autoResolved = true;
    });
    
    await this.notificationService.sendNotification({
      type: 'system_alert',
      severity: 'medium',
      title: 'Emergency Stop Deactivated',
      message: 'System operations can resume normally',
      data: { userId },
    });
  }

  // Cost Monitoring
  async trackCost(operationId: string, cost: number): Promise<void> {
    this.metrics.dailySpend += cost;
    this.metrics.monthlySpend += cost;
    this.metrics.lastUpdated = new Date();
    
    logger.info('Cost tracked', { operationId, cost, dailySpend: this.metrics.dailySpend });
    
    // Check daily limit
    if (this.metrics.dailySpend > this.limits.dailyCostLimit * 0.9) {
      await this.createAlert({
        type: 'cost',
        severity: this.metrics.dailySpend > this.limits.dailyCostLimit ? 'critical' : 'high',
        message: `Daily cost limit approaching: $${this.metrics.dailySpend.toFixed(2)} / $${this.limits.dailyCostLimit}`,
      });
    }
    
    // Check monthly limit
    if (this.metrics.monthlySpend > this.limits.monthlyCostLimit * 0.9) {
      await this.createAlert({
        type: 'cost',
        severity: this.metrics.monthlySpend > this.limits.monthlyCostLimit ? 'critical' : 'high',
        message: `Monthly cost limit approaching: $${this.metrics.monthlySpend.toFixed(2)} / $${this.limits.monthlyCostLimit}`,
      });
    }
    
    // Auto-activate emergency stop if critical cost limit exceeded
    if (this.metrics.dailySpend > this.limits.dailyCostLimit * 1.1) {
      await this.activateEmergencyStop(`Daily cost limit exceeded: $${this.metrics.dailySpend.toFixed(2)}`);
    }
  }

  // Operation Management
  async canStartOperation(operationId: string, estimatedCost: number = 0): Promise<{ allowed: boolean; reason?: string }> {
    // Check emergency stop
    if (this.limits.emergencyStopActive) {
      return { allowed: false, reason: 'Emergency stop is active' };
    }
    
    // Check concurrent operations
    if (this.activeOperations.size >= this.limits.maxConcurrentOperations) {
      return { allowed: false, reason: 'Maximum concurrent operations reached' };
    }
    
    // Check queue size
    if (this.operationQueue.length >= this.limits.maxQueueSize) {
      return { allowed: false, reason: 'Operation queue is full' };
    }
    
    // Check cost limits
    if (estimatedCost > 0) {
      const projectedDailyCost = this.metrics.dailySpend + estimatedCost;
      if (projectedDailyCost > this.limits.dailyCostLimit) {
        return { allowed: false, reason: 'Would exceed daily cost limit' };
      }
    }
    
    return { allowed: true };
  }

  async startOperation(operationId: string, estimatedCost: number = 0): Promise<void> {
    const check = await this.canStartOperation(operationId, estimatedCost);
    if (!check.allowed) {
      throw new Error(`Cannot start operation: ${check.reason}`);
    }
    
    this.activeOperations.add(operationId);
    this.metrics.activeOperations = this.activeOperations.size;
    
    logger.info('Operation started', { operationId, activeOperations: this.activeOperations.size });
  }

  async stopOperation(operationId: string, reason: string = 'Manual stop'): Promise<void> {
    this.activeOperations.delete(operationId);
    this.metrics.activeOperations = this.activeOperations.size;
    
    logger.info('Operation stopped', { operationId, reason, activeOperations: this.activeOperations.size });
  }

  // Quality Monitoring
  async trackQuality(operationId: string, qualityScore: number): Promise<void> {
    // Update average quality (simplified calculation)
    this.metrics.averageQuality = (this.metrics.averageQuality + qualityScore) / 2;
    
    if (qualityScore < this.limits.minQualityThreshold) {
      await this.createAlert({
        type: 'quality',
        severity: 'medium',
        message: `Low quality detected: ${qualityScore.toFixed(1)} (threshold: ${this.limits.minQualityThreshold})`,
      });
    }
    
    logger.info('Quality tracked', { operationId, qualityScore, averageQuality: this.metrics.averageQuality });
  }

  // Failure Rate Monitoring
  async trackFailure(operationId: string, error: string): Promise<void> {
    // Update failure rate (simplified calculation)
    this.metrics.failureRate = Math.min(this.metrics.failureRate + 0.01, 1);
    
    if (this.metrics.failureRate > this.limits.maxFailureRate) {
      await this.createAlert({
        type: 'failure_rate',
        severity: 'high',
        message: `High failure rate detected: ${(this.metrics.failureRate * 100).toFixed(1)}%`,
      });
    }
    
    logger.warn('Operation failure tracked', { operationId, error, failureRate: this.metrics.failureRate });
  }

  // Alert Management
  private async createAlert(alertData: Omit<SafetyAlert, 'id' | 'timestamp' | 'acknowledged' | 'autoResolved'>): Promise<void> {
    const alert: SafetyAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      acknowledged: false,
      autoResolved: false,
      ...alertData,
    };
    
    this.alerts.push(alert);
    
    // Send notification based on severity
    if (alert.severity === 'high' || alert.severity === 'critical') {
      await this.notificationService.sendNotification({
        type: alert.type === 'cost' ? 'cost_alert' : 'quality_alert',
        severity: alert.severity,
        title: `Safety Alert: ${alert.type.toUpperCase()}`,
        message: alert.message,
        data: { alertId: alert.id, metrics: this.metrics },
      });
    }
  }

  async acknowledgeAlert(alertId: string, userId?: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      logger.info('Alert acknowledged', { alertId, userId });
    }
  }

  // Getters
  getSafetyLimits(): SafetyLimits {
    return { ...this.limits };
  }

  getSafetyMetrics(): SafetyMetrics {
    return { ...this.metrics };
  }

  getActiveAlerts(): SafetyAlert[] {
    return this.alerts.filter(a => !a.acknowledged);
  }

  getAllAlerts(): SafetyAlert[] {
    return [...this.alerts];
  }

  getSystemStatus(): {
    status: 'healthy' | 'warning' | 'critical' | 'emergency';
    activeOperations: number;
    queueSize: number;
    emergencyStopActive: boolean;
    criticalAlerts: number;
  } {
    const criticalAlerts = this.alerts.filter(a => !a.acknowledged && a.severity === 'critical').length;
    
    let status: 'healthy' | 'warning' | 'critical' | 'emergency' = 'healthy';
    
    if (this.limits.emergencyStopActive) {
      status = 'emergency';
    } else if (criticalAlerts > 0) {
      status = 'critical';
    } else if (this.metrics.dailySpend > this.limits.dailyCostLimit * 0.8 || this.metrics.failureRate > this.limits.maxFailureRate * 0.8) {
      status = 'warning';
    }
    
    return {
      status,
      activeOperations: this.activeOperations.size,
      queueSize: this.operationQueue.length,
      emergencyStopActive: this.limits.emergencyStopActive,
      criticalAlerts,
    };
  }

  // Configuration Management
  async updateLimits(newLimits: Partial<SafetyLimits>): Promise<void> {
    this.limits = { ...this.limits, ...newLimits };
    logger.info('Safety limits updated', { newLimits });
    
    await this.notificationService.sendNotification({
      type: 'system_alert',
      severity: 'medium',
      title: 'Safety Limits Updated',
      message: 'Safety configuration has been modified',
      data: { updatedLimits: newLimits },
    });
  }

  // Reset daily metrics (should be called by cron job)
  resetDailyMetrics(): void {
    this.metrics.dailySpend = 0;
    this.metrics.failureRate = Math.max(0, this.metrics.failureRate - 0.1);
    logger.info('Daily metrics reset');
  }

  // Reset monthly metrics (should be called by cron job)
  resetMonthlyMetrics(): void {
    this.metrics.monthlySpend = 0;
    logger.info('Monthly metrics reset');
  }
}

export const safetyService = new SafetyService();
export default safetyService;