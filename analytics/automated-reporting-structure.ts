/**
 * Automated Reporting Structure for AI Glossary Pro A/B Tests
 *
 * Defines report templates, data export configurations, and
 * documentation for interpreting A/B test results.
 */

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  schedule?: ReportSchedule;
  distribution?: DistributionConfig;
}

export interface ReportSection {
  title: string;
  type: 'summary' | 'chart' | 'table' | 'insight' | 'recommendation';
  dataSource: string;
  visualization?: VisualizationConfig;
  interpretation?: InterpretationGuide;
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'on_completion';
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  time?: string; // HH:MM format
}

export interface DistributionConfig {
  recipients: string[];
  format: 'pdf' | 'html' | 'csv' | 'json';
  channels: ('email' | 'slack' | 'webhook')[];
}

export interface VisualizationConfig {
  type: 'line' | 'bar' | 'pie' | 'funnel' | 'table' | 'heatmap';
  options: Record<string, any>;
}

export interface InterpretationGuide {
  metrics: string[];
  thresholds: ThresholdConfig[];
  insights: InsightTemplate[];
}

export interface ThresholdConfig {
  metric: string;
  operator: '>' | '<' | '=' | '>=' | '<=';
  value: number;
  interpretation: string;
  action?: string;
}

export interface InsightTemplate {
  condition: string;
  template: string;
  severity: 'success' | 'warning' | 'info' | 'critical';
}

// A/B Test Report Templates
export const reportTemplates: ReportTemplate[] = [
  {
    id: 'weekly_ab_test_summary',
    name: 'Weekly A/B Test Summary',
    description: 'Comprehensive weekly report of all active A/B tests',
    schedule: {
      frequency: 'weekly',
      dayOfWeek: 1, // Monday
      time: '09:00',
    },
    distribution: {
      recipients: ['product@aiglossarypro.com', 'marketing@aiglossarypro.com'],
      format: 'pdf',
      channels: ['email', 'slack'],
    },
    sections: [
      {
        title: 'Executive Summary',
        type: 'summary',
        dataSource: 'all_active_tests',
        interpretation: {
          metrics: ['conversion_rate', 'statistical_significance'],
          thresholds: [
            {
              metric: 'statistical_significance',
              operator: '>=',
              value: 0.95,
              interpretation: 'Test has reached statistical significance',
              action: 'Consider implementing winning variant',
            },
          ],
          insights: [
            {
              condition: 'winner_found',
              template:
                '🎯 {test_name} has a clear winner: {winning_variant} with {lift}% improvement',
              severity: 'success',
            },
          ],
        },
      },
      {
        title: 'Test Performance Overview',
        type: 'chart',
        dataSource: 'test_metrics',
        visualization: {
          type: 'bar',
          options: {
            grouped: true,
            showValues: true,
            colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'],
          },
        },
      },
      {
        title: 'Detailed Test Results',
        type: 'table',
        dataSource: 'detailed_results',
        visualization: {
          type: 'table',
          options: {
            sortable: true,
            filterable: true,
            exportable: true,
          },
        },
      },
      {
        title: 'Recommendations',
        type: 'recommendation',
        dataSource: 'test_recommendations',
      },
    ],
  },
  {
    id: 'test_completion_report',
    name: 'A/B Test Completion Report',
    description: 'Detailed report generated when a test reaches completion',
    schedule: {
      frequency: 'on_completion',
    },
    distribution: {
      recipients: ['product@aiglossarypro.com', 'executives@aiglossarypro.com'],
      format: 'html',
      channels: ['email'],
    },
    sections: [
      {
        title: 'Test Overview',
        type: 'summary',
        dataSource: 'test_metadata',
      },
      {
        title: 'Primary Metric Results',
        type: 'chart',
        dataSource: 'primary_metric_timeseries',
        visualization: {
          type: 'line',
          options: {
            showConfidenceIntervals: true,
            annotateSignificance: true,
          },
        },
      },
      {
        title: 'Secondary Metrics',
        type: 'table',
        dataSource: 'secondary_metrics_summary',
      },
      {
        title: 'Segment Analysis',
        type: 'chart',
        dataSource: 'segment_breakdown',
        visualization: {
          type: 'bar',
          options: {
            stacked: false,
            showPercentages: true,
          },
        },
      },
      {
        title: 'Statistical Analysis',
        type: 'insight',
        dataSource: 'statistical_summary',
        interpretation: {
          metrics: ['p_value', 'confidence_interval', 'power'],
          thresholds: [
            {
              metric: 'p_value',
              operator: '<',
              value: 0.05,
              interpretation: 'Results are statistically significant',
            },
            {
              metric: 'power',
              operator: '>=',
              value: 0.8,
              interpretation: 'Test had sufficient power to detect differences',
            },
          ],
          insights: [],
        },
      },
      {
        title: 'Implementation Recommendations',
        type: 'recommendation',
        dataSource: 'implementation_guide',
      },
    ],
  },
  {
    id: 'daily_monitoring_report',
    name: 'Daily A/B Test Monitoring',
    description: 'Daily health check and anomaly detection for active tests',
    schedule: {
      frequency: 'daily',
      time: '08:00',
    },
    distribution: {
      recipients: ['product@aiglossarypro.com'],
      format: 'html',
      channels: ['email', 'slack'],
    },
    sections: [
      {
        title: 'Test Health Status',
        type: 'summary',
        dataSource: 'test_health_metrics',
      },
      {
        title: 'Sample Size Progress',
        type: 'chart',
        dataSource: 'sample_size_tracking',
        visualization: {
          type: 'bar',
          options: {
            showProgress: true,
            showProjectedCompletion: true,
          },
        },
      },
      {
        title: 'Anomaly Detection',
        type: 'insight',
        dataSource: 'anomaly_detection',
        interpretation: {
          metrics: ['sample_ratio', 'performance_metrics'],
          thresholds: [
            {
              metric: 'sample_ratio_mismatch',
              operator: '>',
              value: 0.05,
              interpretation: 'Sample ratio mismatch detected',
              action: 'Investigate randomization implementation',
            },
          ],
          insights: [
            {
              condition: 'anomaly_detected',
              template: '⚠️ Anomaly detected in {test_name}: {anomaly_description}',
              severity: 'warning',
            },
          ],
        },
      },
    ],
  },
];

// Data Export Configurations
export const dataExportConfig = {
  // Supported export formats
  formats: {
    csv: {
      delimiter: ',',
      includeHeaders: true,
      dateFormat: 'YYYY-MM-DD',
      encoding: 'utf-8',
    },
    json: {
      pretty: true,
      includeMetadata: true,
      nestingLevel: 3,
    },
    excel: {
      includeCharts: true,
      autoFilter: true,
      freezePanes: true,
    },
  },

  // Export templates for different use cases
  exportTemplates: {
    raw_data: {
      name: 'Raw Event Data',
      fields: ['timestamp', 'user_id', 'variant', 'event', 'properties'],
      filters: ['date_range', 'variant', 'event_type'],
    },
    aggregated_metrics: {
      name: 'Aggregated Metrics',
      fields: ['date', 'variant', 'metric', 'value', 'sample_size'],
      aggregation: 'daily',
    },
    user_level: {
      name: 'User Level Analysis',
      fields: ['user_id', 'variant', 'conversion', 'revenue', 'engagement_score'],
      includeSegments: true,
    },
  },

  // Scheduling options
  scheduling: {
    automated_exports: [
      {
        name: 'Weekly Raw Data Backup',
        template: 'raw_data',
        frequency: 'weekly',
        destination: 's3://aiglossarypro-analytics/exports/',
      },
      {
        name: 'Monthly Executive Dashboard',
        template: 'aggregated_metrics',
        frequency: 'monthly',
        destination: 'email://executives@aiglossarypro.com',
      },
    ],
  },
};

// Result Interpretation Documentation
export const interpretationGuide = {
  // Statistical concepts
  concepts: {
    statistical_significance: {
      definition: 'The probability that the observed difference is not due to random chance',
      interpretation: "A p-value < 0.05 means there's less than 5% chance the results are random",
      caution: "Statistical significance doesn't always mean practical significance",
    },
    confidence_interval: {
      definition: 'The range within which the true effect size likely falls',
      interpretation: "95% CI means we're 95% confident the true value is in this range",
      example: 'A 95% CI of [2%, 8%] means the true lift is likely between 2% and 8%',
    },
    minimum_detectable_effect: {
      definition: 'The smallest difference the test can reliably detect',
      interpretation: 'If MDE is 5%, differences smaller than 5% may not be detected',
      planning: 'Lower MDE requires larger sample sizes',
    },
    statistical_power: {
      definition: 'The probability of detecting a real difference when it exists',
      interpretation: '80% power means 80% chance of detecting a true difference',
      standard: 'Most tests aim for 80% or higher power',
    },
  },

  // Common pitfalls
  pitfalls: [
    {
      name: 'Peeking Problem',
      description: 'Checking results too early and stopping when significant',
      impact: 'Inflates false positive rate',
      solution: 'Wait for predetermined sample size or use sequential testing',
    },
    {
      name: 'Multiple Testing',
      description: 'Testing many metrics increases chance of false positives',
      impact: 'Higher probability of finding spurious results',
      solution: 'Apply Bonferroni correction or focus on primary metric',
    },
    {
      name: "Simpson's Paradox",
      description: 'Overall results differ from segment results',
      impact: 'May implement wrong variant',
      solution: 'Always check segment-level results',
    },
  ],

  // Decision framework
  decisionFramework: {
    steps: [
      'Verify statistical significance (p < 0.05)',
      'Check practical significance (is the lift meaningful?)',
      'Review confidence intervals',
      'Analyze segment performance',
      'Consider implementation costs',
      'Assess long-term impact',
    ],
    decisionMatrix: {
      significant_positive: 'Implement winning variant',
      significant_negative: 'Keep control, investigate why variant failed',
      not_significant: 'No clear winner, consider extending test or moving on',
      mixed_segments: 'Consider targeted implementation by segment',
    },
  },
};

// Report Generation Functions
export const generateReport = async (
  templateId: string,
  testId: string,
  dateRange: { from: Date; to: Date }
) => {
  const template = reportTemplates.find(t => t.id === templateId);
  if (!template) {throw new Error(`Template ${templateId} not found`);}

  // Report generation logic would go here
  return {
    template: template.name,
    generatedAt: new Date(),
    testId,
    dateRange,
    sections: template.sections.map(section => ({
      ...section,
      data: `Data for ${section.dataSource}`, // Placeholder
    })),
  };
};

// Export function for creating PostHog annotations
export const createTestAnnotations = (testId: string, events: unknown[]) => {
  return events.map(event => ({
    content: event.description,
    date_marker: event.timestamp,
    creation_type: 'ab_test',
    dashboard_item: testId,
    scope: 'project',
    tags: ['ab_test', testId, event.type],
  }));
};
