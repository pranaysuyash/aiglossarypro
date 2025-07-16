import { log as logger } from '../utils/logger';

export interface NotificationConfig {
  email?: {
    enabled: boolean;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
    from: string;
    recipients: string[];
  };
  webhook?: {
    enabled: boolean;
    url: string;
    secret?: string;
    timeout: number;
    retries: number;
  };
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
    username: string;
  };
}

export interface NotificationData {
  type:
    | 'batch_started'
    | 'batch_completed'
    | 'batch_failed'
    | 'quality_alert'
    | 'cost_alert'
    | 'system_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    operationId?: string;
    columnId?: string;
    termCount?: number;
    totalCost?: number;
    successRate?: number;
    averageQuality?: number;
    processingTime?: number;
    errors?: Array<{
      termId: string;
      termName: string;
      error: string;
    }>;
    [key: string]: any;
  };
  timestamp: Date;
  userId?: string;
}

export interface NotificationResult {
  success: boolean;
  channel: string;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export interface NotificationHistory {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: string;
  channels: string[];
  success: boolean;
  results: NotificationResult[];
  metadata?: any;
  createdAt: Date;
  sentAt?: Date;
}

export class NotificationService {
  private config: NotificationConfig;
  private isInitialized = false;

  constructor() {
    this.config = this.loadConfiguration();
    this.initialize();
  }

  /**
   * Load notification configuration from environment variables
   */
  private loadConfiguration(): NotificationConfig {
    return {
      email: {
        enabled: process.env.NOTIFICATION_EMAIL_ENABLED === 'true',
        smtp: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
        },
        from: process.env.NOTIFICATION_FROM_EMAIL || 'noreply@aimlglossary.com',
        recipients: process.env.NOTIFICATION_RECIPIENTS?.split(',') || [],
      },
      webhook: {
        enabled: process.env.NOTIFICATION_WEBHOOK_ENABLED === 'true',
        url: process.env.NOTIFICATION_WEBHOOK_URL || '',
        secret: process.env.NOTIFICATION_WEBHOOK_SECRET,
        timeout: parseInt(process.env.NOTIFICATION_WEBHOOK_TIMEOUT || '5000'),
        retries: parseInt(process.env.NOTIFICATION_WEBHOOK_RETRIES || '3'),
      },
      slack: {
        enabled: process.env.NOTIFICATION_SLACK_ENABLED === 'true',
        webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
        channel: process.env.SLACK_CHANNEL || '#ai-glossary-alerts',
        username: process.env.SLACK_USERNAME || 'AI Glossary Bot',
      },
    };
  }

  /**
   * Initialize notification service
   */
  private initialize(): void {
    try {
      // Validate configuration
      if (
        this.config.email?.enabled &&
        (!this.config.email.smtp.auth.user || !this.config.email.smtp.auth.pass)
      ) {
        logger.warn('Email notifications enabled but SMTP credentials not provided');
        this.config.email.enabled = false;
      }

      if (this.config.webhook?.enabled && !this.config.webhook.url) {
        logger.warn('Webhook notifications enabled but webhook URL not provided');
        this.config.webhook.enabled = false;
      }

      if (this.config.slack?.enabled && !this.config.slack.webhookUrl) {
        logger.warn('Slack notifications enabled but webhook URL not provided');
        this.config.slack.enabled = false;
      }

      this.isInitialized = true;
      logger.info('Notification service initialized', {
        emailEnabled: this.config.email?.enabled,
        webhookEnabled: this.config.webhook?.enabled,
        slackEnabled: this.config.slack?.enabled,
      });
    } catch (error) {
      logger.error('Failed to initialize notification service:', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.isInitialized = false;
    }
  }

  /**
   * Send notification through all enabled channels
   */
  async sendNotification(notification: NotificationData): Promise<NotificationResult[]> {
    if (!this.isInitialized) {
      logger.warn('Notification service not initialized, skipping notification');
      return [];
    }

    const results: NotificationResult[] = [];

    try {
      // Send email notification
      if (this.config.email?.enabled) {
        const emailResult = await this.sendEmailNotification(notification);
        results.push(emailResult);
      }

      // Send webhook notification
      if (this.config.webhook?.enabled) {
        const webhookResult = await this.sendWebhookNotification(notification);
        results.push(webhookResult);
      }

      // Send Slack notification
      if (this.config.slack?.enabled) {
        const slackResult = await this.sendSlackNotification(notification);
        results.push(slackResult);
      }

      // Store notification in history
      await this.storeNotificationHistory(notification, results);

      logger.info('Notification sent', {
        type: notification.type,
        priority: notification.priority,
        channels: results.map(r => r.channel),
        success: results.every(r => r.success),
      });

      return results;
    } catch (error) {
      logger.error('Error sending notification:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return results;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: NotificationData): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      channel: 'email',
      timestamp: new Date(),
    };

    try {
      // Mock email sending - in production, use a proper email service like SendGrid, AWS SES, or nodemailer
      const emailBody = this.formatEmailBody(notification);

      logger.info('Mock email notification sent', {
        to: this.config.email?.recipients,
        subject: notification.title,
        body: `${emailBody.substring(0, 200)}...`,
      });

      result.success = true;
      result.messageId = `email_${Date.now()}`;
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown email error';
      logger.error('Failed to send email notification:', error);
    }

    return result;
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(
    notification: NotificationData
  ): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      channel: 'webhook',
      timestamp: new Date(),
    };

    try {
      const payload = {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        timestamp: notification.timestamp.toISOString(),
        metadata: notification.metadata,
      };

      // Mock webhook sending - in production, use fetch or axios
      logger.info('Mock webhook notification sent', {
        url: this.config.webhook?.url,
        payload: JSON.stringify(payload, null, 2),
      });

      result.success = true;
      result.messageId = `webhook_${Date.now()}`;
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown webhook error';
      logger.error('Failed to send webhook notification:', error);
    }

    return result;
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(notification: NotificationData): Promise<NotificationResult> {
    const result: NotificationResult = {
      success: false,
      channel: 'slack',
      timestamp: new Date(),
    };

    try {
      const slackMessage = this.formatSlackMessage(notification);

      // Mock Slack sending - in production, use @slack/webhook
      logger.info('Mock Slack notification sent', {
        channel: this.config.slack?.channel,
        message: slackMessage,
      });

      result.success = true;
      result.messageId = `slack_${Date.now()}`;
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown Slack error';
      logger.error('Failed to send Slack notification:', error);
    }

    return result;
  }

  /**
   * Format email body
   */
  private formatEmailBody(notification: NotificationData): string {
    const priorityEmoji = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    };

    let body = `
${priorityEmoji[notification.priority]} ${notification.title}

${notification.message}

Priority: ${notification.priority.toUpperCase()}
Time: ${notification.timestamp.toLocaleString()}
`;

    if (notification.metadata) {
      body += '\n--- Details ---\n';

      if (notification.metadata.operationId) {
        body += `Operation ID: ${notification.metadata.operationId}\n`;
      }

      if (notification.metadata.columnId) {
        body += `Column: ${notification.metadata.columnId}\n`;
      }

      if (notification.metadata.termCount) {
        body += `Terms Processed: ${notification.metadata.termCount}\n`;
      }

      if (notification.metadata.totalCost) {
        body += `Total Cost: $${notification.metadata.totalCost.toFixed(4)}\n`;
      }

      if (notification.metadata.successRate) {
        body += `Success Rate: ${(notification.metadata.successRate * 100).toFixed(1)}%\n`;
      }

      if (notification.metadata.averageQuality) {
        body += `Average Quality: ${notification.metadata.averageQuality.toFixed(1)}/10\n`;
      }

      if (notification.metadata.processingTime) {
        body += `Processing Time: ${(notification.metadata.processingTime / 1000).toFixed(1)}s\n`;
      }

      if (notification.metadata.errors && notification.metadata.errors.length > 0) {
        body += `\nErrors (${notification.metadata.errors.length}):\n`;
        notification.metadata.errors.slice(0, 5).forEach(error => {
          body += `- ${error.termName}: ${error.error}\n`;
        });
        if (notification.metadata.errors.length > 5) {
          body += `... and ${notification.metadata.errors.length - 5} more errors\n`;
        }
      }
    }

    body += `\n---\nAI/ML Glossary Pro - Automated Notification System`;

    return body;
  }

  /**
   * Format Slack message
   */
  private formatSlackMessage(notification: NotificationData): any {
    const priorityColor = {
      low: '#36a64f',
      medium: '#ffb347',
      high: '#ff6b47',
      critical: '#ff0000',
    };

    const priorityEmoji = {
      low: ':large_blue_circle:',
      medium: ':large_yellow_circle:',
      high: ':large_orange_circle:',
      critical: ':red_circle:',
    };

    const fields = [];

    if (notification.metadata?.termCount) {
      fields.push({
        title: 'Terms Processed',
        value: notification.metadata.termCount.toString(),
        short: true,
      });
    }

    if (notification.metadata?.totalCost) {
      fields.push({
        title: 'Total Cost',
        value: `$${notification.metadata.totalCost.toFixed(4)}`,
        short: true,
      });
    }

    if (notification.metadata?.successRate) {
      fields.push({
        title: 'Success Rate',
        value: `${(notification.metadata.successRate * 100).toFixed(1)}%`,
        short: true,
      });
    }

    if (notification.metadata?.averageQuality) {
      fields.push({
        title: 'Average Quality',
        value: `${notification.metadata.averageQuality.toFixed(1)}/10`,
        short: true,
      });
    }

    return {
      channel: this.config.slack?.channel,
      username: this.config.slack?.username,
      icon_emoji: ':robot_face:',
      attachments: [
        {
          color: priorityColor[notification.priority],
          title: `${priorityEmoji[notification.priority]} ${notification.title}`,
          text: notification.message,
          fields,
          footer: 'AI/ML Glossary Pro',
          ts: Math.floor(notification.timestamp.getTime() / 1000),
        },
      ],
    };
  }

  /**
   * Store notification history
   */
  private async storeNotificationHistory(
    notification: NotificationData,
    results: NotificationResult[]
  ): Promise<void> {
    try {
      // In production, store in database
      const historyEntry: NotificationHistory = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        channels: results.map(r => r.channel),
        success: results.every(r => r.success),
        results,
        metadata: notification.metadata,
        createdAt: notification.timestamp,
        sentAt: new Date(),
      };

      logger.info('Notification history stored', {
        id: historyEntry.id,
        type: historyEntry.type,
        success: historyEntry.success,
      });
    } catch (error) {
      logger.error('Failed to store notification history:', error);
    }
  }

  /**
   * Send batch started notification
   */
  async notifyBatchStarted(
    operationId: string,
    columnId: string,
    termCount: number
  ): Promise<void> {
    const notification: NotificationData = {
      type: 'batch_started',
      title: 'Batch Processing Started',
      message: `Started processing ${termCount} terms for column "${columnId}". Operation ID: ${operationId}`,
      priority: 'medium',
      metadata: {
        operationId,
        columnId,
        termCount,
      },
      timestamp: new Date(),
    };

    await this.sendNotification(notification);
  }

  /**
   * Send batch completed notification
   */
  async notifyBatchCompleted(
    operationId: string,
    columnId: string,
    termCount: number,
    successRate: number,
    averageQuality: number,
    totalCost: number,
    processingTime: number
  ): Promise<void> {
    const notification: NotificationData = {
      type: 'batch_completed',
      title: 'Batch Processing Completed',
      message: `Successfully completed processing ${termCount} terms for column "${columnId}". Success rate: ${(successRate * 100).toFixed(1)}%, Average quality: ${averageQuality.toFixed(1)}/10`,
      priority: successRate > 0.9 ? 'medium' : 'high',
      metadata: {
        operationId,
        columnId,
        termCount,
        successRate,
        averageQuality,
        totalCost,
        processingTime,
      },
      timestamp: new Date(),
    };

    await this.sendNotification(notification);
  }

  /**
   * Send batch failed notification
   */
  async notifyBatchFailed(
    operationId: string,
    columnId: string,
    termCount: number,
    errors: Array<{ termId: string; termName: string; error: string }>
  ): Promise<void> {
    const notification: NotificationData = {
      type: 'batch_failed',
      title: 'Batch Processing Failed',
      message: `Batch processing failed for column "${columnId}". ${errors.length} errors encountered out of ${termCount} terms.`,
      priority: 'critical',
      metadata: {
        operationId,
        columnId,
        termCount,
        errors: errors.slice(0, 10), // Limit to first 10 errors
      },
      timestamp: new Date(),
    };

    await this.sendNotification(notification);
  }

  /**
   * Send quality alert notification
   */
  async notifyQualityAlert(
    operationId: string,
    columnId: string,
    averageQuality: number,
    threshold: number,
    lowQualityCount: number
  ): Promise<void> {
    const notification: NotificationData = {
      type: 'quality_alert',
      title: 'Quality Alert',
      message: `Quality alert for column "${columnId}". Average quality score (${averageQuality.toFixed(1)}/10) is below threshold (${threshold}/10). ${lowQualityCount} terms need improvement.`,
      priority: 'high',
      metadata: {
        operationId,
        columnId,
        averageQuality,
        threshold,
        lowQualityCount,
      },
      timestamp: new Date(),
    };

    await this.sendNotification(notification);
  }

  /**
   * Send cost alert notification
   */
  async notifyCostAlert(
    operationId: string,
    currentCost: number,
    budgetLimit: number,
    projectedCost: number
  ): Promise<void> {
    const notification: NotificationData = {
      type: 'cost_alert',
      title: 'Cost Alert',
      message: `Cost alert: Current cost ($${currentCost.toFixed(4)}) is approaching budget limit ($${budgetLimit.toFixed(4)}). Projected final cost: $${projectedCost.toFixed(4)}`,
      priority: currentCost > budgetLimit ? 'critical' : 'high',
      metadata: {
        operationId,
        currentCost,
        budgetLimit,
        projectedCost,
      },
      timestamp: new Date(),
    };

    await this.sendNotification(notification);
  }

  /**
   * Send system alert notification
   */
  async notifySystemAlert(
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    metadata?: any
  ): Promise<void> {
    const notification: NotificationData = {
      type: 'system_alert',
      title,
      message,
      priority,
      metadata,
      timestamp: new Date(),
    };

    await this.sendNotification(notification);
  }

  /**
   * Update notification configuration
   */
  updateConfiguration(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config };
    this.initialize();
  }

  /**
   * Get notification configuration
   */
  getConfiguration(): NotificationConfig {
    return { ...this.config };
  }

  /**
   * Test notification channels
   */
  async testNotifications(): Promise<NotificationResult[]> {
    const testNotification: NotificationData = {
      type: 'system_alert',
      title: 'Notification Test',
      message:
        'This is a test notification to verify that all notification channels are working correctly.',
      priority: 'low',
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
    };

    return await this.sendNotification(testNotification);
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
