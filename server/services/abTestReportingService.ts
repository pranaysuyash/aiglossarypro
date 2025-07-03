import { db } from '../db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import {
  abTests,
  abTestMetrics,
  abTestEvents,
  abTestReports,
  type ABTest,
  type ABTestMetrics as ABTestMetricsType,
  type ABTestReport
} from '../../shared/abTestingSchema';
import { calculateStatisticalSignificance, determineWinner } from '../utils/statistics';
import { sendEmail } from '../utils/email';
import { log as logger } from '../utils/logger';

interface ReportData {
  test: ABTest;
  metrics: ABTestMetricsType[];
  analysis: {
    conversionRates: Record<string, number>;
    statisticalSignificance: Record<string, any>;
    winner?: {
      variant: string;
      improvement: number;
      confidence: number;
    };
    recommendations: string[];
  };
  period: {
    start: Date;
    end: Date;
    type: 'daily' | 'weekly' | 'final';
  };
}

class ABTestReportingService {
  /**
   * Generate daily report for active A/B tests
   */
  async generateDailyReports(): Promise<void> {
    try {
      const activeTests = await db.select()
        .from(abTests)
        .where(eq(abTests.status, 'active'));

      for (const test of activeTests) {
        await this.generateReport(test, 'daily');
      }
    } catch (error) {
      logger.error('Error generating daily reports:', error);
    }
  }

  /**
   * Generate weekly report for active A/B tests
   */
  async generateWeeklyReports(): Promise<void> {
    try {
      const activeTests = await db.select()
        .from(abTests)
        .where(eq(abTests.status, 'active'));

      for (const test of activeTests) {
        await this.generateReport(test, 'weekly');
      }
    } catch (error) {
      logger.error('Error generating weekly reports:', error);
    }
  }

  /**
   * Generate final report when test completes
   */
  async generateFinalReport(testId: string): Promise<void> {
    try {
      const [test] = await db.select()
        .from(abTests)
        .where(eq(abTests.id, testId))
        .limit(1);

      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      await this.generateReport(test, 'final');
    } catch (error) {
      logger.error('Error generating final report:', error);
    }
  }

  /**
   * Generate report for a specific test
   */
  private async generateReport(test: ABTest, type: 'daily' | 'weekly' | 'final'): Promise<void> {
    const now = new Date();
    const period = this.getReportPeriod(type, test.startDate!, now);

    // Get metrics for the test
    const metrics = await db.select()
      .from(abTestMetrics)
      .where(eq(abTestMetrics.testId, test.id));

    if (!metrics.length) {
      logger.warn(`No metrics found for test ${test.id}`);
      return;
    }

    // Calculate analysis
    const analysis = this.analyzeTestResults(metrics);

    // Generate recommendations
    const recommendations = this.generateRecommendations(analysis, metrics);

    // Create report data
    const reportData: ReportData = {
      test,
      metrics,
      analysis: {
        ...analysis,
        recommendations
      },
      period
    };

    // Save report to database
    const [report] = await db.insert(abTestReports).values({
      testId: test.id,
      reportType: type,
      reportDate: now,
      metricsSnapshot: reportData,
      statisticalAnalysis: analysis,
      recommendations: recommendations.join('\n'),
      isAutomated: true,
      sentTo: []
    }).returning();

    // Send report via email (if configured)
    await this.sendReportEmail(report, reportData);

    logger.info(`Generated ${type} report for test ${test.id}`);
  }

  /**
   * Analyze test results
   */
  private analyzeTestResults(metrics: ABTestMetricsType[]) {
    const conversionRates: Record<string, number> = {};
    const statisticalSignificance: Record<string, any> = {};

    // Calculate conversion rates
    metrics.forEach(metric => {
      conversionRates[metric.variant] = metric.pageViews > 0
        ? (metric.trialSignups / metric.pageViews) * 100
        : 0;
    });

    // Calculate statistical significance between variants
    if (metrics.length >= 2) {
      const control = metrics.find(m => m.variant === 'default') || metrics[0];
      
      metrics.forEach(metric => {
        if (metric.variant !== control.variant) {
          statisticalSignificance[metric.variant] = calculateStatisticalSignificance(
            control.trialSignups,
            control.pageViews,
            metric.trialSignups,
            metric.pageViews
          );
        }
      });
    }

    // Determine winner
    const winner = determineWinner(
      metrics.map(m => ({
        variant: m.variant,
        conversionRate: conversionRates[m.variant]
      })),
      'conversionRate'
    );

    return {
      conversionRates,
      statisticalSignificance,
      winner
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    analysis: any,
    metrics: ABTestMetricsType[]
  ): string[] {
    const recommendations: string[] = [];

    // Check if we have enough data
    const totalSessions = metrics.reduce((sum, m) => sum + m.totalSessions, 0);
    if (totalSessions < 1000) {
      recommendations.push(
        `Continue testing: Only ${totalSessions} sessions collected. Aim for at least 1,000 per variant for reliable results.`
      );
    }

    // Check for statistical significance
    const hasSignificantResults = Object.values(analysis.statisticalSignificance)
      .some((sig: any) => sig.isSignificant);

    if (hasSignificantResults && analysis.winner) {
      recommendations.push(
        `Statistical winner found: ${analysis.winner.variant} variant shows ${analysis.winner.improvement.toFixed(1)}% improvement.`
      );
      
      if (analysis.winner.confidence >= 95) {
        recommendations.push(
          `High confidence (${analysis.winner.confidence}%): Consider implementing ${analysis.winner.variant} as the default.`
        );
      } else {
        recommendations.push(
          `Moderate confidence (${analysis.winner.confidence}%): Continue testing for higher confidence.`
        );
      }
    } else {
      recommendations.push(
        'No statistically significant difference detected yet. Continue testing.'
      );
    }

    // Device-specific insights
    metrics.forEach(metric => {
      const deviceBreakdown = metric.deviceBreakdown as Record<string, number>;
      const mobilePercentage = (deviceBreakdown.mobile || 0) / metric.totalSessions * 100;
      
      if (mobilePercentage > 60) {
        recommendations.push(
          `${metric.variant} variant: ${mobilePercentage.toFixed(0)}% mobile traffic. Ensure mobile optimization.`
        );
      }
    });

    // Bounce rate insights
    metrics.forEach(metric => {
      if (metric.bounceRate && metric.bounceRate > 0.7) {
        recommendations.push(
          `${metric.variant} variant has high bounce rate (${(metric.bounceRate * 100).toFixed(0)}%). Consider improving engagement.`
        );
      }
    });

    return recommendations;
  }

  /**
   * Get report period based on type
   */
  private getReportPeriod(
    type: 'daily' | 'weekly' | 'final',
    testStart: Date,
    now: Date
  ): ReportData['period'] {
    switch (type) {
      case 'daily':
        return {
          start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          end: now,
          type
        };
      case 'weekly':
        return {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: now,
          type
        };
      case 'final':
        return {
          start: testStart,
          end: now,
          type
        };
    }
  }

  /**
   * Send report via email
   */
  private async sendReportEmail(report: ABTestReport, data: ReportData): Promise<void> {
    // Check if email service is configured
    if (!process.env.EMAIL_ENABLED) {
      return;
    }

    const recipients = process.env.AB_TEST_REPORT_RECIPIENTS?.split(',') || [];
    if (!recipients.length) {
      return;
    }

    try {
      const subject = `A/B Test Report: ${data.test.name} (${data.period.type})`;
      const html = this.generateEmailHTML(data);

      await sendEmail({
        to: recipients,
        subject,
        html
      });

      // Update report with sent recipients
      await db.update(abTestReports)
        .set({ sentTo: recipients })
        .where(eq(abTestReports.id, report.id));

      logger.info(`Sent ${data.period.type} report for test ${data.test.id} to ${recipients.length} recipients`);
    } catch (error) {
      logger.error('Error sending report email:', error);
    }
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHTML(data: ReportData): string {
    const { test, metrics, analysis, period } = data;

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    h1 { color: #6B46C1; }
    h2 { color: #4B5563; margin-top: 30px; }
    .metric-card { background: #F9FAFB; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .metric-title { font-weight: bold; color: #6B7280; }
    .metric-value { font-size: 24px; font-weight: bold; color: #1F2937; }
    .winner { background: #D1FAE5; border: 1px solid #10B981; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .recommendation { background: #FEF3C7; padding: 10px; margin: 5px 0; border-radius: 5px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #E5E7EB; }
    th { background: #F3F4F6; font-weight: bold; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; font-size: 14px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="container">
    <h1>A/B Test Report: ${test.name}</h1>
    <p><strong>Report Type:</strong> ${period.type.charAt(0).toUpperCase() + period.type.slice(1)}</p>
    <p><strong>Period:</strong> ${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}</p>
    
    <h2>Test Overview</h2>
    <p><strong>Status:</strong> ${test.status}</p>
    <p><strong>Variants:</strong> ${(test.variants as string[]).join(', ')}</p>
    <p><strong>Success Metric:</strong> ${test.successMetric}</p>
    
    <h2>Performance Summary</h2>
    <table>
      <thead>
        <tr>
          <th>Variant</th>
          <th>Page Views</th>
          <th>Conversions</th>
          <th>Conversion Rate</th>
          <th>Sessions</th>
        </tr>
      </thead>
      <tbody>
        ${metrics.map(m => `
        <tr>
          <td>${m.variant}</td>
          <td>${m.pageViews.toLocaleString()}</td>
          <td>${m.trialSignups}</td>
          <td>${analysis.conversionRates[m.variant].toFixed(2)}%</td>
          <td>${m.totalSessions}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    
    ${analysis.winner ? `
    <div class="winner">
      <h3>🏆 Winner: ${analysis.winner.variant}</h3>
      <p>Shows ${analysis.winner.improvement.toFixed(1)}% improvement with ${analysis.winner.confidence}% confidence</p>
    </div>
    ` : ''}
    
    <h2>Recommendations</h2>
    ${analysis.recommendations.map(rec => `
    <div class="recommendation">${rec}</div>
    `).join('')}
    
    <h2>Detailed Metrics</h2>
    ${metrics.map(m => `
    <div class="metric-card">
      <h3>${m.variant} Variant</h3>
      <p><strong>CTA Clicks:</strong> ${m.ctaClicks}</p>
      <p><strong>See What's Inside:</strong> ${m.seeWhatsInsideClicks}</p>
      <p><strong>Newsletter Signups:</strong> ${m.newsletterSignups}</p>
      <p><strong>Avg Session Duration:</strong> ${Math.floor((m.avgSessionDuration || 0) / 60)}m ${Math.floor((m.avgSessionDuration || 0) % 60)}s</p>
      <p><strong>Bounce Rate:</strong> ${((m.bounceRate || 0) * 100).toFixed(1)}%</p>
    </div>
    `).join('')}
    
    <div class="footer">
      <p>This is an automated report generated by the A/B Testing System.</p>
      <p>View the full dashboard at: ${process.env.CLIENT_URL}/admin/ab-testing</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

// Export singleton instance
export const abTestReportingService = new ABTestReportingService();

// Export scheduled job functions
export async function runDailyReports() {
  await abTestReportingService.generateDailyReports();
}

export async function runWeeklyReports() {
  await abTestReportingService.generateWeeklyReports();
}