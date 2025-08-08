/**
 * Alert Configurations for AI Glossary Pro A/B Testing
 *
 * Defines alert thresholds, templates, and monitoring procedures
 * for A/B test monitoring and result detection.
 */
// Core Alert Configurations
export const alertConfigs = [
    // Test Result Alerts
    {
        id: 'test_winner_detected',
        name: 'A/B Test Winner Detected',
        description: 'Alerts when a test variant achieves statistical significance',
        condition: {
            type: 'threshold',
            metric: 'statistical_significance',
            operator: '>=',
            value: 0.95,
            duration: 60, // Must maintain for 1 hour
        },
        severity: 'success',
        channels: [
            {
                type: 'email',
                config: {
                    to: ['product@aiglossarypro.com', 'marketing@aiglossarypro.com'],
                    subject: '🎯 A/B Test Winner: {{test_name}}',
                    template: 'test_winner',
                },
            },
            {
                type: 'slack',
                config: {
                    channel: '#product-updates',
                    message: ':tada: *{{test_name}}* has a winner! {{winning_variant}} shows {{lift}}% improvement with {{confidence}}% confidence.',
                },
            },
        ],
        cooldown: 1440, // 24 hours
    },
    // Sample Ratio Mismatch
    {
        id: 'sample_ratio_mismatch',
        name: 'Sample Ratio Mismatch Detected',
        description: 'Alerts when variant distribution deviates from expected',
        condition: {
            type: 'threshold',
            metric: 'sample_ratio_deviation',
            operator: '>',
            value: 0.05,
            duration: 30,
        },
        severity: 'critical',
        channels: [
            {
                type: 'email',
                config: {
                    to: ['engineering@aiglossarypro.com'],
                    subject: '🚨 CRITICAL: Sample Ratio Mismatch in {{test_name}}',
                    template: 'sample_ratio_alert',
                },
            },
            {
                type: 'pagerduty',
                config: {
                    service_key: process.env.PAGERDUTY_SERVICE_KEY,
                    severity: 'error',
                },
            },
        ],
        cooldown: 60,
    },
    // Low Sample Collection
    {
        id: 'low_sample_collection',
        name: 'Low Sample Collection Rate',
        description: 'Alerts when sample collection falls below expected rate',
        condition: {
            type: 'threshold',
            metric: 'daily_sample_rate',
            operator: '<',
            value: 0.5, // 50% of expected
            aggregation: 'avg',
            duration: 120, // 2 hours
        },
        severity: 'warning',
        channels: [
            {
                type: 'slack',
                config: {
                    channel: '#analytics-alerts',
                    message: ':warning: Low sample collection for *{{test_name}}*. Current rate: {{current_rate}}/day (expected: {{expected_rate}}/day)',
                },
            },
        ],
        cooldown: 360, // 6 hours
    },
    // Performance Degradation
    {
        id: 'performance_degradation',
        name: 'Performance Degradation in Variant',
        description: 'Alerts when a variant shows significant performance degradation',
        condition: {
            type: 'composite',
            metric: 'performance_composite',
            operator: '<',
            value: -0.1, // 10% degradation
            duration: 60,
        },
        severity: 'critical',
        channels: [
            {
                type: 'email',
                config: {
                    to: ['product@aiglossarypro.com', 'engineering@aiglossarypro.com'],
                    subject: '⚠️ Performance Issue: {{variant}} in {{test_name}}',
                    template: 'performance_alert',
                },
            },
            {
                type: 'webhook',
                config: {
                    url: process.env.MONITORING_WEBHOOK_URL,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            },
        ],
        cooldown: 120,
    },
    // Test Completion
    {
        id: 'test_completion',
        name: 'A/B Test Completed',
        description: 'Alerts when a test reaches its completion criteria',
        condition: {
            type: 'threshold',
            metric: 'test_completion_percentage',
            operator: '>=',
            value: 100,
        },
        severity: 'info',
        channels: [
            {
                type: 'email',
                config: {
                    to: ['product@aiglossarypro.com'],
                    subject: '✅ A/B Test Completed: {{test_name}}',
                    template: 'test_completion',
                },
            },
            {
                type: 'dashboard',
                config: {
                    dashboard_id: 'ab_test_overview',
                    widget_id: 'completed_tests',
                },
            },
        ],
    },
    // Anomaly Detection
    {
        id: 'metric_anomaly',
        name: 'Metric Anomaly Detected',
        description: 'Alerts when metrics show unusual patterns',
        condition: {
            type: 'anomaly',
            metric: 'conversion_rate',
            operator: 'outside',
            value: [0.02, 0.98], // 2nd to 98th percentile
            duration: 30,
        },
        severity: 'warning',
        channels: [
            {
                type: 'slack',
                config: {
                    channel: '#analytics-alerts',
                    message: ':chart_with_downwards_trend: Anomaly detected in *{{test_name}}*: {{metric}} is {{value}} (expected range: {{expected_range}})',
                },
            },
        ],
        cooldown: 240,
        grouping: {
            by: ['test_id', 'metric'],
            window: 60,
            threshold: 3,
        },
    },
];
// Alert Templates
export const alertTemplates = {
    test_winner: {
        subject: '🎯 A/B Test Winner: {{test_name}}',
        body: `
      <h2>Test Results Summary</h2>
      <p>Great news! Your A/B test "{{test_name}}" has reached statistical significance.</p>
      
      <h3>Winner: {{winning_variant}}</h3>
      <ul>
        <li>Lift: <strong>{{lift}}%</strong></li>
        <li>Confidence: <strong>{{confidence}}%</strong></li>
        <li>Sample Size: {{sample_size}}</li>
        <li>Test Duration: {{duration}} days</li>
      </ul>
      
      <h3>Key Metrics</h3>
      {{#metrics}}
        <p>{{name}}: {{value}} ({{change}}% change)</p>
      {{/metrics}}
      
      <h3>Next Steps</h3>
      <ol>
        <li>Review detailed results in the dashboard</li>
        <li>Validate results across segments</li>
        <li>Plan implementation rollout</li>
      </ol>
      
      <a href="{{dashboard_url}}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">View Full Results</a>
    `,
    },
    sample_ratio_alert: {
        subject: '🚨 CRITICAL: Sample Ratio Mismatch in {{test_name}}',
        body: `
      <h2>Critical Alert: Sample Ratio Mismatch</h2>
      <p style="color: red;"><strong>Immediate action required!</strong></p>
      
      <h3>Issue Details</h3>
      <ul>
        <li>Test: {{test_name}}</li>
        <li>Expected ratio: {{expected_ratio}}</li>
        <li>Actual ratio: {{actual_ratio}}</li>
        <li>Deviation: {{deviation}}%</li>
      </ul>
      
      <h3>Potential Causes</h3>
      <ul>
        <li>Randomization implementation issue</li>
        <li>Bot traffic not properly filtered</li>
        <li>Client-side errors in variant assignment</li>
        <li>Cache or CDN configuration problems</li>
      </ul>
      
      <h3>Recommended Actions</h3>
      <ol>
        <li>Pause the test immediately</li>
        <li>Review randomization logic</li>
        <li>Check for JavaScript errors</li>
        <li>Analyze traffic sources</li>
      </ol>
      
      <p>This issue can invalidate test results. Please investigate immediately.</p>
    `,
    },
    performance_alert: {
        subject: '⚠️ Performance Issue: {{variant}} in {{test_name}}',
        body: `
      <h2>Performance Degradation Alert</h2>
      
      <h3>Affected Variant</h3>
      <p>Test: {{test_name}}<br>
      Variant: {{variant}}</p>
      
      <h3>Performance Metrics</h3>
      <table border="1" cellpadding="5">
        <tr>
          <th>Metric</th>
          <th>Control</th>
          <th>Variant</th>
          <th>Difference</th>
        </tr>
        {{#performance_metrics}}
        <tr>
          <td>{{name}}</td>
          <td>{{control_value}}</td>
          <td>{{variant_value}}</td>
          <td style="color: {{#negative}}red{{/negative}}{{^negative}}green{{/negative}}">{{difference}}%</td>
        </tr>
        {{/performance_metrics}}
      </table>
      
      <h3>User Impact</h3>
      <p>Estimated affected users: {{affected_users}}</p>
      <p>Revenue impact: {{revenue_impact}}</p>
      
      <a href="{{performance_dashboard}}" style="display: inline-block; padding: 10px 20px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px;">View Performance Dashboard</a>
    `,
    },
};
// Alert Monitoring Procedures
export const monitoringProcedures = {
    // Alert response workflows
    workflows: {
        critical: {
            name: 'Critical Alert Response',
            steps: [
                'Acknowledge alert within 15 minutes',
                'Assess immediate impact',
                'Implement mitigation if needed',
                'Investigate root cause',
                'Document findings',
                'Implement permanent fix',
            ],
            sla: {
                acknowledgment: 15, // minutes
                mitigation: 60,
                resolution: 240,
            },
        },
        warning: {
            name: 'Warning Alert Response',
            steps: [
                'Review alert details',
                'Monitor for escalation',
                'Investigate during business hours',
                'Document if action needed',
            ],
            sla: {
                acknowledgment: 60,
                resolution: 480,
            },
        },
        info: {
            name: 'Informational Alert Response',
            steps: [
                'Review during daily standup',
                'Update documentation if needed',
                'Archive for future reference',
            ],
            sla: {
                review: 1440, // 24 hours
            },
        },
    },
    // Escalation matrix
    escalation: {
        levels: [
            {
                level: 1,
                conditions: ['single_critical', 'multiple_warnings'],
                contacts: ['on_call_engineer'],
                timeframe: 15,
            },
            {
                level: 2,
                conditions: ['unacknowledged_critical', 'multiple_criticals'],
                contacts: ['engineering_lead', 'product_manager'],
                timeframe: 30,
            },
            {
                level: 3,
                conditions: ['unresolved_critical', 'revenue_impact'],
                contacts: ['cto', 'head_of_product'],
                timeframe: 60,
            },
        ],
    },
    // Alert fatigue prevention
    fatiguePrevention: {
        deduplication: {
            enabled: true,
            window: 300, // 5 minutes
            groupBy: ['test_id', 'alert_type'],
        },
        suppression: {
            maintenance_windows: [
                {
                    name: 'Weekly Deployment',
                    schedule: 'CRON:0 2 * * 3', // Wednesdays at 2 AM
                    duration: 120, // minutes
                },
            ],
            known_issues: [],
        },
        tuning: {
            review_frequency: 'weekly',
            metrics: ['alert_count', 'false_positive_rate', 'response_time'],
            auto_adjust: true,
        },
    },
};
// Alert Analytics
export const alertAnalytics = {
    // Track alert effectiveness
    metrics: {
        mean_time_to_acknowledge: 'avg(acknowledged_at - created_at)',
        mean_time_to_resolve: 'avg(resolved_at - created_at)',
        false_positive_rate: 'count(false_positives) / count(total_alerts)',
        alert_volume: 'count(alerts) by severity, time_bucket',
    },
    // Alert quality scoring
    qualityScore: (alert) => {
        const factors = {
            accuracy: alert.false_positives === 0 ? 1 : 0.5,
            actionability: alert.resulted_in_action ? 1 : 0.3,
            timeliness: alert.detected_within_sla ? 1 : 0.7,
            clarity: alert.required_clarification ? 0.8 : 1,
        };
        return Object.values(factors).reduce((a, b) => a + b) / Object.keys(factors).length;
    },
};
// Helper function to create PostHog alert
export const createPostHogAlert = (config) => {
    return {
        name: config.name,
        enabled: true,
        filters: {
            events: [
                {
                    id: config.condition.metric,
                    type: 'events',
                    properties: [],
                },
            ],
        },
        threshold: {
            type: config.condition.operator,
            value: config.condition.value,
        },
        notification_targets: config.channels.map(channel => ({
            type: channel.type,
            value: channel.config,
        })),
    };
};
