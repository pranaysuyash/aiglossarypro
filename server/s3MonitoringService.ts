import fs from 'node:fs';
import path from 'node:path';

export interface S3OperationLog {
  id: string;
  timestamp: Date;
  operation: 'upload' | 'download' | 'delete' | 'list' | 'validate' | 'archive' | 'cleanup';
  status: 'started' | 'success' | 'error' | 'warning';
  fileKey?: string;
  fileName?: string;
  fileSize?: number;
  duration?: number; // in milliseconds
  error?: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface S3Metrics {
  operations: {
    total: number;
    successful: number;
    failed: number;
    byOperation: Record<string, number>;
    byStatus: Record<string, number>;
  };
  files: {
    totalUploaded: number;
    totalDownloaded: number;
    totalDeleted: number;
    totalSize: number;
    averageSize: number;
  };
  performance: {
    averageUploadTime: number;
    averageDownloadTime: number;
    slowestOperations: S3OperationLog[];
    fastestOperations: S3OperationLog[];
  };
  errors: {
    recent: S3OperationLog[];
    byType: Record<string, number>;
    errorRate: number;
  };
  usage: {
    operationsPerHour: Record<string, number>;
    peakHours: { hour: number; operations: number }[];
    dailyStats: Record<string, { operations: number; dataTransferred: number }>;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  type: 'error_rate' | 'slow_operation' | 'large_file' | 'high_volume' | 'failed_operation';
  threshold: number;
  timeWindow: number; // in minutes
  enabled: boolean;
  lastTriggered?: Date;
  actions: ('log' | 'email' | 'webhook')[];
  webhookUrl?: string;
  emailRecipients?: string[];
}

class S3MonitoringService {
  private logs: S3OperationLog[] = [];
  private alerts: AlertRule[] = [];
  private maxLogsInMemory = 10000;
  private logFilePath: string;
  private metricsCache: { metrics: S3Metrics | null; lastUpdated: Date | null } = {
    metrics: null,
    lastUpdated: null,
  };
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.logFilePath = path.join(process.cwd(), 'logs', 's3-operations.log');
    this.ensureLogDirectory();
    this.loadExistingLogs();
    this.setupDefaultAlerts();

    // Cleanup old logs periodically
    setInterval(
      () => {
        this.cleanupOldLogs();
      },
      60 * 60 * 1000
    ); // Every hour
  }

  private ensureLogDirectory() {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private loadExistingLogs() {
    try {
      if (fs.existsSync(this.logFilePath)) {
        const logContent = fs.readFileSync(this.logFilePath, 'utf8');
        const logLines = logContent.split('\n').filter(line => line.trim());

        this.logs = logLines
          .slice(-this.maxLogsInMemory) // Only keep recent logs in memory
          .map(line => {
            try {
              const log = JSON.parse(line);
              return {
                ...log,
                timestamp: new Date(log.timestamp),
              };
            } catch (_e) {
              return null;
            }
          })
          .filter(log => log !== null) as S3OperationLog[];
      }
    } catch (error) {
      console.error('Error loading existing logs:', error);
    }
  }

  private setupDefaultAlerts() {
    this.alerts = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        type: 'error_rate',
        threshold: 10, // 10% error rate
        timeWindow: 15, // 15 minutes
        enabled: true,
        actions: ['log', 'webhook'],
      },
      {
        id: 'slow-uploads',
        name: 'Slow Upload Operations',
        type: 'slow_operation',
        threshold: 30000, // 30 seconds
        timeWindow: 5,
        enabled: true,
        actions: ['log'],
      },
      {
        id: 'large-file-upload',
        name: 'Large File Upload',
        type: 'large_file',
        threshold: 50 * 1024 * 1024, // 50MB
        timeWindow: 1,
        enabled: true,
        actions: ['log'],
      },
      {
        id: 'high-volume',
        name: 'High Volume Operations',
        type: 'high_volume',
        threshold: 100, // 100 operations
        timeWindow: 10,
        enabled: true,
        actions: ['log'],
      },
    ];
  }

  // Generate unique ID for logs
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Log operation start
  public logOperationStart(
    operation: S3OperationLog['operation'],
    fileKey?: string,
    metadata?: Record<string, any>,
    context?: {
      userId?: string;
      sessionId?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): string {
    const logId = this.generateId();
    const log: S3OperationLog = {
      id: logId,
      timestamp: new Date(),
      operation,
      status: 'started',
      fileKey,
      fileName: fileKey ? path.basename(fileKey) : undefined,
      metadata,
      ...context,
    };

    this.addLog(log);
    return logId;
  }

  // Log operation completion
  public logOperationComplete(
    logId: string,
    status: 'success' | 'error' | 'warning',
    duration?: number,
    fileSize?: number,
    error?: string,
    additionalMetadata?: Record<string, any>
  ) {
    const existingLogIndex = this.logs.findIndex(log => log.id === logId);

    if (existingLogIndex !== -1) {
      const updatedLog: S3OperationLog = {
        ...this.logs[existingLogIndex],
        status,
        duration,
        fileSize,
        error,
        metadata: {
          ...this.logs[existingLogIndex].metadata,
          ...additionalMetadata,
        },
      };

      this.logs[existingLogIndex] = updatedLog;
      this.writeLogToFile(updatedLog);

      // Check alerts
      this.checkAlerts(updatedLog);

      // Invalidate metrics cache
      this.invalidateMetricsCache();
    }
  }

  // Add a log entry
  private addLog(log: S3OperationLog) {
    this.logs.push(log);

    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }

    this.writeLogToFile(log);
  }

  // Write log to file
  private writeLogToFile(log: S3OperationLog) {
    try {
      const logLine = `${JSON.stringify(log)}\n`;
      fs.appendFileSync(this.logFilePath, logLine);
    } catch (error) {
      console.error('Error writing log to file:', error);
    }
  }

  // Get recent logs
  public getRecentLogs(limit = 100, operation?: string): S3OperationLog[] {
    let filteredLogs = this.logs;

    if (operation) {
      filteredLogs = this.logs.filter(log => log.operation === operation);
    }

    return filteredLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Get logs by date range
  public getLogsByDateRange(startDate: Date, endDate: Date): S3OperationLog[] {
    return this.logs.filter(log => log.timestamp >= startDate && log.timestamp <= endDate);
  }

  // Generate comprehensive metrics
  public generateMetrics(): S3Metrics {
    // Check cache
    if (
      this.metricsCache.metrics &&
      this.metricsCache.lastUpdated &&
      Date.now() - this.metricsCache.lastUpdated.getTime() < this.cacheTimeout
    ) {
      return this.metricsCache.metrics;
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentLogs = this.getLogsByDateRange(oneDayAgo, now);

    // Operations metrics
    const operations = {
      total: recentLogs.length,
      successful: recentLogs.filter(log => log.status === 'success').length,
      failed: recentLogs.filter(log => log.status === 'error').length,
      byOperation: this.groupBy(recentLogs, 'operation'),
      byStatus: this.groupBy(recentLogs, 'status'),
    };

    // Files metrics
    const successfulOps = recentLogs.filter(log => log.status === 'success');
    const uploadedFiles = successfulOps.filter(log => log.operation === 'upload');
    const downloadedFiles = successfulOps.filter(log => log.operation === 'download');
    const deletedFiles = successfulOps.filter(log => log.operation === 'delete');

    const totalSize = uploadedFiles.reduce((sum, log) => sum + (log.fileSize || 0), 0);

    const files = {
      totalUploaded: uploadedFiles.length,
      totalDownloaded: downloadedFiles.length,
      totalDeleted: deletedFiles.length,
      totalSize,
      averageSize: uploadedFiles.length > 0 ? totalSize / uploadedFiles.length : 0,
    };

    // Performance metrics
    const completedOps = recentLogs.filter(log => log.duration && log.status !== 'started');
    const _averageDuration =
      completedOps.length > 0
        ? completedOps.reduce((sum, log) => sum + (log.duration || 0), 0) / completedOps.length
        : 0;

    const sortedByDuration = [...completedOps].sort(
      (a, b) => (b.duration || 0) - (a.duration || 0)
    );

    const performance = {
      averageUploadTime: this.getAverageOperationTime(recentLogs, 'upload'),
      averageDownloadTime: this.getAverageOperationTime(recentLogs, 'download'),
      slowestOperations: sortedByDuration.slice(0, 10),
      fastestOperations: sortedByDuration.slice(-10).reverse(),
    };

    // Error metrics
    const errorLogs = recentLogs.filter(log => log.status === 'error');
    const errors = {
      recent: errorLogs.slice(0, 20),
      byType: this.groupBy(errorLogs, 'operation'),
      errorRate: operations.total > 0 ? (operations.failed / operations.total) * 100 : 0,
    };

    // Usage metrics
    const usage = {
      operationsPerHour: this.getOperationsPerHour(recentLogs),
      peakHours: this.getPeakHours(recentLogs),
      dailyStats: this.getDailyStats(recentLogs),
    };

    const metrics: S3Metrics = {
      operations,
      files,
      performance,
      errors,
      usage,
    };

    // Cache the results
    this.metricsCache = {
      metrics,
      lastUpdated: new Date(),
    };

    return metrics;
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce(
      (acc, item) => {
        const value = String(item[key]);
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private getAverageOperationTime(logs: S3OperationLog[], operation: string): number {
    const operationLogs = logs.filter(
      log => log.operation === operation && log.duration && log.status === 'success'
    );

    if (operationLogs.length === 0) {return 0;}

    return operationLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / operationLogs.length;
  }

  private getOperationsPerHour(logs: S3OperationLog[]): Record<string, number> {
    const hourCounts: Record<string, number> = {};

    logs.forEach(log => {
      const hour = log.timestamp.getHours().toString().padStart(2, '0');
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return hourCounts;
  }

  private getPeakHours(logs: S3OperationLog[]): { hour: number; operations: number }[] {
    const hourCounts = this.getOperationsPerHour(logs);

    return Object.entries(hourCounts)
      .map(([hour, operations]) => ({ hour: parseInt(hour), operations }))
      .sort((a, b) => b.operations - a.operations)
      .slice(0, 5);
  }

  private getDailyStats(
    logs: S3OperationLog[]
  ): Record<string, { operations: number; dataTransferred: number }> {
    const dailyStats: Record<string, { operations: number; dataTransferred: number }> = {};

    logs.forEach(log => {
      const date = log.timestamp.toISOString().split('T')[0];

      if (!dailyStats[date]) {
        dailyStats[date] = { operations: 0, dataTransferred: 0 };
      }

      dailyStats[date].operations++;
      dailyStats[date].dataTransferred += log.fileSize || 0;
    });

    return dailyStats;
  }

  private invalidateMetricsCache() {
    this.metricsCache = { metrics: null, lastUpdated: null };
  }

  // Alert checking
  private checkAlerts(log: S3OperationLog) {
    this.alerts
      .filter(alert => alert.enabled)
      .forEach(alert => {
        this.evaluateAlert(alert, log);
      });
  }

  private evaluateAlert(alert: AlertRule, log: S3OperationLog) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - alert.timeWindow * 60 * 1000);
    const recentLogs = this.getLogsByDateRange(windowStart, now);

    let shouldTrigger = false;
    let alertMessage = '';

    switch (alert.type) {
      case 'error_rate': {
        const totalOps = recentLogs.length;
        const errorOps = recentLogs.filter(l => l.status === 'error').length;
        const errorRate = totalOps > 0 ? (errorOps / totalOps) * 100 : 0;

        if (errorRate > alert.threshold) {
          shouldTrigger = true;
          alertMessage = `High error rate detected: ${errorRate.toFixed(2)}% (threshold: ${alert.threshold}%)`;
        }
        break;
      }

      case 'slow_operation':
        if (log.duration && log.duration > alert.threshold) {
          shouldTrigger = true;
          alertMessage = `Slow operation detected: ${log.operation} took ${log.duration}ms (threshold: ${alert.threshold}ms)`;
        }
        break;

      case 'large_file':
        if (log.fileSize && log.fileSize > alert.threshold) {
          shouldTrigger = true;
          alertMessage = `Large file uploaded: ${this.formatBytes(log.fileSize)} (threshold: ${this.formatBytes(alert.threshold)})`;
        }
        break;

      case 'high_volume':
        if (recentLogs.length > alert.threshold) {
          shouldTrigger = true;
          alertMessage = `High volume of operations: ${recentLogs.length} operations in ${alert.timeWindow} minutes (threshold: ${alert.threshold})`;
        }
        break;

      case 'failed_operation':
        if (log.status === 'error') {
          shouldTrigger = true;
          alertMessage = `Operation failed: ${log.operation} - ${log.error || 'Unknown error'}`;
        }
        break;
    }

    if (shouldTrigger) {
      this.triggerAlert(alert, alertMessage, log);
    }
  }

  private triggerAlert(alert: AlertRule, message: string, log: S3OperationLog) {
    // Prevent spam by checking last triggered time
    if (alert.lastTriggered) {
      const timeSinceLastTrigger = Date.now() - alert.lastTriggered.getTime();
      const minInterval = 5 * 60 * 1000; // 5 minutes minimum between same alert

      if (timeSinceLastTrigger < minInterval) {
        return;
      }
    }

    alert.lastTriggered = new Date();

    alert.actions.forEach(action => {
      switch (action) {
        case 'log':
          console.warn(`[S3 ALERT] ${alert.name}: ${message}`);
          break;
        case 'webhook':
          if (alert.webhookUrl) {
            this.sendWebhookAlert(alert.webhookUrl, alert, message, log);
          }
          break;
        case 'email':
          if (alert.emailRecipients) {
            this.sendEmailAlert(alert.emailRecipients, alert, message, log);
          }
          break;
      }
    });
  }

  private async sendWebhookAlert(
    url: string,
    alert: AlertRule,
    message: string,
    log: S3OperationLog
  ) {
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert: alert.name,
          message,
          log,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  private sendEmailAlert(
    recipients: string[],
    _alert: AlertRule,
    message: string,
    _log: S3OperationLog
  ) {
    // Email functionality would be implemented based on your email service
    console.log(`Would send email alert to ${recipients.join(', ')}: ${message}`);
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) {return `${bytes} B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
    if (bytes < 1024 * 1024 * 1024) {return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;}
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  // Cleanup old logs
  private cleanupOldLogs() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Remove old logs from memory
    this.logs = this.logs.filter(log => log.timestamp > sevenDaysAgo);

    // Archive old log files (implementation depends on your archival strategy)
    this.archiveOldLogFiles();
  }

  private archiveOldLogFiles() {
    // Implementation for archiving old log files
    // This could involve moving files to S3, compressing them, etc.
  }

  // Public methods for managing alerts
  public addAlert(alert: Omit<AlertRule, 'id'>): string {
    const newAlert: AlertRule = {
      id: this.generateId(),
      ...alert,
    };

    this.alerts.push(newAlert);
    return newAlert.id;
  }

  public updateAlert(id: string, updates: Partial<AlertRule>): boolean {
    const alertIndex = this.alerts.findIndex(alert => alert.id === id);

    if (alertIndex !== -1) {
      this.alerts[alertIndex] = { ...this.alerts[alertIndex], ...updates };
      return true;
    }

    return false;
  }

  public deleteAlert(id: string): boolean {
    const alertIndex = this.alerts.findIndex(alert => alert.id === id);

    if (alertIndex !== -1) {
      this.alerts.splice(alertIndex, 1);
      return true;
    }

    return false;
  }

  public getAlerts(): AlertRule[] {
    return this.alerts;
  }

  // Export logs for analysis
  public exportLogs(
    format: 'json' | 'csv' = 'json',
    dateRange?: { start: Date; end: Date }
  ): string {
    let logsToExport = this.logs;

    if (dateRange) {
      logsToExport = this.getLogsByDateRange(dateRange.start, dateRange.end);
    }

    if (format === 'csv') {
      const headers = [
        'id',
        'timestamp',
        'operation',
        'status',
        'fileKey',
        'fileName',
        'fileSize',
        'duration',
        'error',
        'userId',
        'sessionId',
      ];

      const csvRows = [
        headers.join(','),
        ...logsToExport.map(log =>
          [
            log.id,
            log.timestamp.toISOString(),
            log.operation,
            log.status,
            log.fileKey || '',
            log.fileName || '',
            log.fileSize || '',
            log.duration || '',
            log.error || '',
            log.userId || '',
            log.sessionId || '',
          ]
            .map(field => `"${field}"`)
            .join(',')
        ),
      ];

      return csvRows.join('\n');
    }

    return JSON.stringify(logsToExport, null, 2);
  }
}

// Singleton instance
let monitoringService: S3MonitoringService | null = null;

export function getS3MonitoringService(): S3MonitoringService {
  if (!monitoringService) {
    monitoringService = new S3MonitoringService();
  }
  return monitoringService;
}

export default S3MonitoringService;
