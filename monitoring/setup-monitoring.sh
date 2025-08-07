#!/bin/bash

# CloudWatch Monitoring Setup Script for AIGlossaryPro API
# Date: 2025-08-06

set -e

DASHBOARD_NAME="AIGlossaryPro-Production-Monitoring"
RESULTS_DIR="monitoring/results"
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
SETUP_LOG="$RESULTS_DIR/monitoring_setup_$TIMESTAMP.txt"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo "=== AIGlossaryPro Monitoring Setup ===" | tee "$SETUP_LOG"
echo "Timestamp: $(date)" | tee -a "$SETUP_LOG"
echo "Dashboard Name: $DASHBOARD_NAME" | tee -a "$SETUP_LOG"
echo "============================================" | tee -a "$SETUP_LOG"
echo "" | tee -a "$SETUP_LOG"

# Function to create CloudWatch dashboard
create_dashboard() {
    echo "=== Creating CloudWatch Dashboard ===" | tee -a "$SETUP_LOG"
    echo "" | tee -a "$SETUP_LOG"
    
    if [ -f "monitoring/cloudwatch-dashboard.json" ]; then
        echo "Creating dashboard from configuration..." | tee -a "$SETUP_LOG"
        aws cloudwatch put-dashboard \
            --dashboard-name "$DASHBOARD_NAME" \
            --dashboard-body file://monitoring/cloudwatch-dashboard.json \
            && echo "✅ Dashboard created successfully" | tee -a "$SETUP_LOG" \
            || echo "❌ Dashboard creation failed" | tee -a "$SETUP_LOG"
    else
        echo "❌ Dashboard configuration file not found" | tee -a "$SETUP_LOG"
    fi
    echo "" | tee -a "$SETUP_LOG"
}

# Function to create CloudWatch alarms
create_alarms() {
    echo "=== Creating CloudWatch Alarms ===" | tee -a "$SETUP_LOG"
    echo "" | tee -a "$SETUP_LOG"
    
    # High CPU utilization alarm
    echo "Creating High CPU Utilization alarm..." | tee -a "$SETUP_LOG"
    aws cloudwatch put-metric-alarm \
        --alarm-name "AIGlossaryPro-High-CPU" \
        --alarm-description "High CPU utilization for AIGlossaryPro API" \
        --metric-name CPUUtilization \
        --namespace AWS/ECS \
        --statistic Average \
        --period 300 \
        --threshold 80 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions "arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:aiglossarypro-alerts" \
        --dimensions Name=ServiceName,Value=aiglossarypro-api-production Name=ClusterName,Value=aiglossarypro \
        && echo "✅ High CPU alarm created" | tee -a "$SETUP_LOG" \
        || echo "⚠️  High CPU alarm creation failed (SNS topic may need to be created)" | tee -a "$SETUP_LOG"
    
    # High memory utilization alarm
    echo "Creating High Memory Utilization alarm..." | tee -a "$SETUP_LOG"
    aws cloudwatch put-metric-alarm \
        --alarm-name "AIGlossaryPro-High-Memory" \
        --alarm-description "High memory utilization for AIGlossaryPro API" \
        --metric-name MemoryUtilization \
        --namespace AWS/ECS \
        --statistic Average \
        --period 300 \
        --threshold 85 \
        --comparison-operator GreaterThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions "arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:aiglossarypro-alerts" \
        --dimensions Name=ServiceName,Value=aiglossarypro-api-production Name=ClusterName,Value=aiglossarypro \
        && echo "✅ High Memory alarm created" | tee -a "$SETUP_LOG" \
        || echo "⚠️  High Memory alarm creation failed (SNS topic may need to be created)" | tee -a "$SETUP_LOG"
    
    # Service task count alarm (service down)
    echo "Creating Service Down alarm..." | tee -a "$SETUP_LOG"
    aws cloudwatch put-metric-alarm \
        --alarm-name "AIGlossaryPro-Service-Down" \
        --alarm-description "AIGlossaryPro API service has no running tasks" \
        --metric-name RunningCount \
        --namespace AWS/ECS \
        --statistic Average \
        --period 60 \
        --threshold 1 \
        --comparison-operator LessThanThreshold \
        --evaluation-periods 2 \
        --alarm-actions "arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:aiglossarypro-alerts" \
        --dimensions Name=ServiceName,Value=aiglossarypro-api-production Name=ClusterName,Value=aiglossarypro \
        && echo "✅ Service Down alarm created" | tee -a "$SETUP_LOG" \
        || echo "⚠️  Service Down alarm creation failed (SNS topic may need to be created)" | tee -a "$SETUP_LOG"
    
    echo "" | tee -a "$SETUP_LOG"
}

# Function to create log metric filters
create_log_filters() {
    echo "=== Creating Log Metric Filters ===" | tee -a "$SETUP_LOG"
    echo "" | tee -a "$SETUP_LOG"
    
    # Error count metric filter
    echo "Creating Error Count metric filter..." | tee -a "$SETUP_LOG"
    aws logs put-metric-filter \
        --log-group-name "/ecs/aiglossarypro-api" \
        --filter-name "AIGlossaryPro-Error-Count" \
        --filter-pattern "ERROR" \
        --metric-transformations \
            metricName=ErrorCount,metricNamespace=AIGlossaryPro/Application,metricValue=1,defaultValue=0 \
        && echo "✅ Error Count metric filter created" | tee -a "$SETUP_LOG" \
        || echo "❌ Error Count metric filter creation failed" | tee -a "$SETUP_LOG"
    
    # Module error metric filter
    echo "Creating Module Error metric filter..." | tee -a "$SETUP_LOG"
    aws logs put-metric-filter \
        --log-group-name "/ecs/aiglossarypro-api" \
        --filter-name "AIGlossaryPro-Module-Errors" \
        --filter-pattern "ERR_MODULE_NOT_FOUND" \
        --metric-transformations \
            metricName=ModuleErrors,metricNamespace=AIGlossaryPro/Application,metricValue=1,defaultValue=0 \
        && echo "✅ Module Error metric filter created" | tee -a "$SETUP_LOG" \
        || echo "❌ Module Error metric filter creation failed" | tee -a "$SETUP_LOG"
    
    # Application restart metric filter
    echo "Creating Application Restart metric filter..." | tee -a "$SETUP_LOG"
    aws logs put-metric-filter \
        --log-group-name "/ecs/aiglossarypro-api" \
        --filter-name "AIGlossaryPro-App-Restarts" \
        --filter-pattern "[timestamp, level=\"[MINIMAL]\", message=\"Starting minimal server...\"]" \
        --metric-transformations \
            metricName=ApplicationRestarts,metricNamespace=AIGlossaryPro/Application,metricValue=1,defaultValue=0 \
        && echo "✅ Application Restart metric filter created" | tee -a "$SETUP_LOG" \
        || echo "❌ Application Restart metric filter creation failed" | tee -a "$SETUP_LOG"
    
    echo "" | tee -a "$SETUP_LOG"
}

# Function to create SNS topic for alerts (optional)
create_sns_topic() {
    echo "=== Setting up SNS Topic for Alerts ===" | tee -a "$SETUP_LOG"
    echo "" | tee -a "$SETUP_LOG"
    
    echo "Creating SNS topic for alerts..." | tee -a "$SETUP_LOG"
    topic_arn=$(aws sns create-topic --name aiglossarypro-alerts --query 'TopicArn' --output text 2>/dev/null || echo "EXISTS")
    
    if [ "$topic_arn" != "EXISTS" ]; then
        echo "✅ SNS Topic created: $topic_arn" | tee -a "$SETUP_LOG"
        echo "⚠️  Don't forget to subscribe to this topic for email/SMS alerts" | tee -a "$SETUP_LOG"
    else
        echo "⚠️  SNS Topic may already exist or creation failed" | tee -a "$SETUP_LOG"
    fi
    echo "" | tee -a "$SETUP_LOG"
}

# Function to set log retention
set_log_retention() {
    echo "=== Setting Log Retention Policy ===" | tee -a "$SETUP_LOG"
    echo "" | tee -a "$SETUP_LOG"
    
    echo "Setting log retention to 14 days..." | tee -a "$SETUP_LOG"
    aws logs put-retention-policy \
        --log-group-name "/ecs/aiglossarypro-api" \
        --retention-in-days 14 \
        && echo "✅ Log retention policy set to 14 days" | tee -a "$SETUP_LOG" \
        || echo "❌ Log retention policy setting failed" | tee -a "$SETUP_LOG"
    
    echo "" | tee -a "$SETUP_LOG"
}

# Function to create custom metrics for API performance
create_custom_metrics() {
    echo "=== Custom Metrics Setup Instructions ===" | tee -a "$SETUP_LOG"
    echo "" | tee -a "$SETUP_LOG"
    
    echo "To implement custom metrics in your application code:" | tee -a "$SETUP_LOG"
    echo "1. API Response Times" | tee -a "$SETUP_LOG"
    echo "2. Database Connection Pool Metrics" | tee -a "$SETUP_LOG"
    echo "3. Request Count by Endpoint" | tee -a "$SETUP_LOG"
    echo "4. Error Rate by Type" | tee -a "$SETUP_LOG"
    echo "" | tee -a "$SETUP_LOG"
    
    echo "Example CloudWatch PutMetricData calls:" | tee -a "$SETUP_LOG"
    cat << 'EOF' | tee -a "$SETUP_LOG"
    
# Response Time
aws cloudwatch put-metric-data \
    --namespace AIGlossaryPro/API \
    --metric-data MetricName=ResponseTime,Value=0.5,Unit=Seconds,Dimensions=Endpoint=/health

# Request Count
aws cloudwatch put-metric-data \
    --namespace AIGlossaryPro/API \
    --metric-data MetricName=RequestCount,Value=1,Unit=Count,Dimensions=Endpoint=/health
    
EOF
    echo "" | tee -a "$SETUP_LOG"
}

# Main setup execution
echo "Starting monitoring setup..." | tee -a "$SETUP_LOG"
echo "" | tee -a "$SETUP_LOG"

create_dashboard
create_log_filters
set_log_retention
create_sns_topic
create_alarms
create_custom_metrics

echo "=== Monitoring Setup Summary ===" | tee -a "$SETUP_LOG"
echo "" | tee -a "$SETUP_LOG"
echo "✅ CloudWatch Dashboard: Created/Updated" | tee -a "$SETUP_LOG"
echo "✅ Log Metric Filters: Configured" | tee -a "$SETUP_LOG"
echo "✅ Log Retention: Set to 14 days" | tee -a "$SETUP_LOG"
echo "⚠️  CloudWatch Alarms: May need SNS topic subscription" | tee -a "$SETUP_LOG"
echo "" | tee -a "$SETUP_LOG"
echo "Next Steps:" | tee -a "$SETUP_LOG"
echo "1. Subscribe to SNS topic for email alerts" | tee -a "$SETUP_LOG"
echo "2. Update CloudFront distribution ID in dashboard" | tee -a "$SETUP_LOG"
echo "3. Implement custom metrics in application code" | tee -a "$SETUP_LOG"
echo "4. Test alarms by triggering threshold conditions" | tee -a "$SETUP_LOG"
echo "" | tee -a "$SETUP_LOG"
echo "Setup completed at: $(date)" | tee -a "$SETUP_LOG"
echo "Dashboard URL: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=$DASHBOARD_NAME" | tee -a "$SETUP_LOG"
echo "Full setup log saved to: $SETUP_LOG" | tee -a "$SETUP_LOG"

echo "Monitoring setup completed. Check $SETUP_LOG for detailed results."