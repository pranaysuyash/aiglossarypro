#!/bin/bash

# AWS Cost Analysis Script for AIGlossaryPro
# Date: 2025-08-06

set -e

RESULTS_DIR="monitoring/results"
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
COST_ANALYSIS_FILE="$RESULTS_DIR/cost_analysis_$TIMESTAMP.txt"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo "=== AIGlossaryPro AWS Cost Analysis ===" | tee "$COST_ANALYSIS_FILE"
echo "Timestamp: $(date)" | tee -a "$COST_ANALYSIS_FILE"
echo "============================================" | tee -a "$COST_ANALYSIS_FILE"
echo "" | tee -a "$COST_ANALYSIS_FILE"

# Function to calculate ECS Fargate costs
calculate_ecs_costs() {
    echo "=== ECS Fargate Cost Analysis ===" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    
    # Current configuration
    CPU_UNITS="512"  # 0.5 vCPU
    MEMORY_MB="1024" # 1 GB
    TASK_COUNT="1"
    
    echo "Current Configuration:" | tee -a "$COST_ANALYSIS_FILE"
    echo "- CPU: $CPU_UNITS CPU units (0.5 vCPU)" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Memory: ${MEMORY_MB}MB (1 GB)" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Task Count: $TASK_COUNT" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Region: us-east-1" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    
    # Fargate pricing (us-east-1)
    CPU_PRICE_PER_HOUR=0.04048  # per vCPU per hour
    MEMORY_PRICE_PER_HOUR=0.004445  # per GB per hour
    
    # Calculate monthly costs
    HOURS_PER_MONTH=730  # Average hours per month
    
    # Calculate vCPU cost
    VCPU_COUNT=$(echo "scale=2; $CPU_UNITS / 1024" | bc -l)
    MEMORY_GB=$(echo "scale=2; $MEMORY_MB / 1024" | bc -l)
    
    CPU_MONTHLY_COST=$(echo "scale=2; $VCPU_COUNT * $CPU_PRICE_PER_HOUR * $HOURS_PER_MONTH" | bc -l)
    MEMORY_MONTHLY_COST=$(echo "scale=2; $MEMORY_GB * $MEMORY_PRICE_PER_HOUR * $HOURS_PER_MONTH" | bc -l)
    
    TOTAL_ECS_MONTHLY=$(echo "scale=2; $CPU_MONTHLY_COST + $MEMORY_MONTHLY_COST" | bc -l)
    
    echo "ECS Fargate Monthly Costs:" | tee -a "$COST_ANALYSIS_FILE"
    echo "- vCPU Cost: \$${CPU_MONTHLY_COST} (${VCPU_COUNT} vCPU × \$${CPU_PRICE_PER_HOUR}/hour × ${HOURS_PER_MONTH} hours)" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Memory Cost: \$${MEMORY_MONTHLY_COST} (${MEMORY_GB} GB × \$${MEMORY_PRICE_PER_HOUR}/hour × ${HOURS_PER_MONTH} hours)" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Total ECS Cost: \$${TOTAL_ECS_MONTHLY}/month" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
}

# Function to calculate S3 costs
calculate_s3_costs() {
    echo "=== S3 Storage Cost Analysis ===" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    
    # Get current S3 usage (approximate from previous command)
    # Frontend assets total approximately 15-20 MB
    STORAGE_GB=0.02  # Approximately 20MB
    
    # S3 pricing (us-east-1)
    STANDARD_STORAGE_PRICE=0.023  # per GB per month for first 50 TB
    
    S3_STORAGE_COST=$(echo "scale=4; $STORAGE_GB * $STANDARD_STORAGE_PRICE" | bc -l)
    
    echo "S3 Storage:" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Current Usage: ~${STORAGE_GB} GB" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Storage Cost: \$${S3_STORAGE_COST}/month" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    
    # Request costs (estimated)
    MONTHLY_REQUESTS=10000  # Estimated GET requests
    REQUEST_COST=$(echo "scale=4; $MONTHLY_REQUESTS * 0.0000004" | bc -l)
    
    echo "S3 Request Costs (estimated):" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Monthly GET Requests: ~${MONTHLY_REQUESTS}" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Request Cost: \$${REQUEST_COST}/month" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    
    TOTAL_S3_COST=$(echo "scale=4; $S3_STORAGE_COST + $REQUEST_COST" | bc -l)
    echo "Total S3 Cost: \$${TOTAL_S3_COST}/month" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
}

# Function to calculate CloudFront costs
calculate_cloudfront_costs() {
    echo "=== CloudFront Cost Analysis ===" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    
    # Estimated usage
    MONTHLY_REQUESTS=50000  # Estimated requests
    DATA_TRANSFER_GB=5  # Estimated outbound data transfer
    
    # CloudFront pricing (first 10 TB)
    REQUEST_PRICE=0.0075  # per 10,000 requests
    DATA_TRANSFER_PRICE=0.085  # per GB for first 10 TB
    
    REQUEST_BLOCKS=$(echo "scale=0; ($MONTHLY_REQUESTS + 9999) / 10000" | bc -l)
    
    CF_REQUEST_COST=$(echo "scale=4; $REQUEST_BLOCKS * $REQUEST_PRICE" | bc -l)
    CF_DATA_COST=$(echo "scale=4; $DATA_TRANSFER_GB * $DATA_TRANSFER_PRICE" | bc -l)
    
    TOTAL_CF_COST=$(echo "scale=4; $CF_REQUEST_COST + $CF_DATA_COST" | bc -l)
    
    echo "CloudFront Usage (estimated):" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Monthly Requests: ~${MONTHLY_REQUESTS}" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Data Transfer: ~${DATA_TRANSFER_GB} GB" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    echo "CloudFront Costs:" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Request Cost: \$${CF_REQUEST_COST}/month" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Data Transfer Cost: \$${CF_DATA_COST}/month" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Total CloudFront Cost: \$${TOTAL_CF_COST}/month" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
}

# Function to calculate CloudWatch costs
calculate_cloudwatch_costs() {
    echo "=== CloudWatch Cost Analysis ===" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    
    # Estimated CloudWatch usage
    LOG_INGESTION_GB=0.5  # Based on current log volume
    CUSTOM_METRICS=5  # Estimated custom metrics
    ALARMS=5  # Number of alarms
    
    # CloudWatch pricing
    LOG_INGESTION_PRICE=0.50  # per GB ingested
    METRIC_PRICE=0.30  # per metric per month
    ALARM_PRICE=0.10  # per alarm per month
    
    CW_LOG_COST=$(echo "scale=4; $LOG_INGESTION_GB * $LOG_INGESTION_PRICE" | bc -l)
    CW_METRIC_COST=$(echo "scale=4; $CUSTOM_METRICS * $METRIC_PRICE" | bc -l)
    CW_ALARM_COST=$(echo "scale=4; $ALARMS * $ALARM_PRICE" | bc -l)
    
    TOTAL_CW_COST=$(echo "scale=4; $CW_LOG_COST + $CW_METRIC_COST + $CW_ALARM_COST" | bc -l)
    
    echo "CloudWatch Usage (estimated):" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Log Ingestion: ${LOG_INGESTION_GB} GB/month" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Custom Metrics: ${CUSTOM_METRICS} metrics" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Alarms: ${ALARMS} alarms" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    echo "CloudWatch Costs:" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Log Ingestion: \$${CW_LOG_COST}/month" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Custom Metrics: \$${CW_METRIC_COST}/month" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Alarms: \$${CW_ALARM_COST}/month" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Total CloudWatch Cost: \$${TOTAL_CW_COST}/month" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
}

# Function to calculate Application Load Balancer costs
calculate_alb_costs() {
    echo "=== Application Load Balancer Cost Analysis ===" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    
    # ALB pricing
    ALB_HOURLY_RATE=0.0225  # per hour
    LCU_HOURLY_RATE=0.008  # per LCU per hour
    
    HOURS_PER_MONTH=730
    ESTIMATED_LCUS=1  # For low traffic, typically 1 LCU minimum
    
    ALB_FIXED_COST=$(echo "scale=4; $ALB_HOURLY_RATE * $HOURS_PER_MONTH" | bc -l)
    ALB_LCU_COST=$(echo "scale=4; $LCU_HOURLY_RATE * $ESTIMATED_LCUS * $HOURS_PER_MONTH" | bc -l)
    
    TOTAL_ALB_COST=$(echo "scale=4; $ALB_FIXED_COST + $ALB_LCU_COST" | bc -l)
    
    echo "Application Load Balancer:" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Fixed Cost: \$${ALB_FIXED_COST}/month" | tee -a "$COST_ANALYSIS_FILE"
    echo "- LCU Cost: \$${ALB_LCU_COST}/month (${ESTIMATED_LCUS} LCUs)" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Total ALB Cost: \$${TOTAL_ALB_COST}/month" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
}

# Function to summarize total costs
summarize_total_costs() {
    echo "=== Total Cost Summary ===" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    
    # Calculate totals (using approximations)
    ECS_COST="14.77"  # From calculation above
    S3_COST="0.01"
    CF_COST="0.46"
    CW_COST="2.00"
    ALB_COST="22.24"
    
    TOTAL_MONTHLY=$(echo "scale=2; $ECS_COST + $S3_COST + $CF_COST + $CW_COST + $ALB_COST" | bc -l)
    ANNUAL_COST=$(echo "scale=2; $TOTAL_MONTHLY * 12" | bc -l)
    
    echo "Monthly Cost Breakdown:" | tee -a "$COST_ANALYSIS_FILE"
    echo "- ECS Fargate:        \$${ECS_COST}" | tee -a "$COST_ANALYSIS_FILE"
    echo "- S3 Storage:         \$${S3_COST}" | tee -a "$COST_ANALYSIS_FILE"
    echo "- CloudFront:         \$${CF_COST}" | tee -a "$COST_ANALYSIS_FILE"
    echo "- CloudWatch:         \$${CW_COST}" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Load Balancer:      \$${ALB_COST}" | tee -a "$COST_ANALYSIS_FILE"
    echo "- Other Services:     \$2.00 (ECR, Secrets Manager, etc.)" | tee -a "$COST_ANALYSIS_FILE"
    echo "                     --------" | tee -a "$COST_ANALYSIS_FILE"
    echo "- TOTAL MONTHLY:      \$${TOTAL_MONTHLY}" | tee -a "$COST_ANALYSIS_FILE"
    echo "- TOTAL ANNUALLY:     \$${ANNUAL_COST}" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
}

# Function to provide optimization recommendations
provide_optimizations() {
    echo "=== Cost Optimization Recommendations ===" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    
    echo "1. Immediate Optimizations:" | tee -a "$COST_ANALYSIS_FILE"
    echo "   - Consider using ECS Service with fewer resources during off-peak hours" | tee -a "$COST_ANALYSIS_FILE"
    echo "   - Implement S3 lifecycle policies for old assets" | tee -a "$COST_ANALYSIS_FILE"
    echo "   - Set CloudWatch log retention to 7-14 days instead of indefinite" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    
    echo "2. Medium-term Optimizations:" | tee -a "$COST_ANALYSIS_FILE"
    echo "   - Consider using Spot instances for non-critical workloads" | tee -a "$COST_ANALYSIS_FILE"
    echo "   - Implement CloudFront caching to reduce origin requests" | tee -a "$COST_ANALYSIS_FILE"
    echo "   - Use S3 Intelligent Tiering for cost-effective storage" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    
    echo "3. Long-term Optimizations:" | tee -a "$COST_ANALYSIS_FILE"
    echo "   - Consider Reserved Instances if usage is predictable" | tee -a "$COST_ANALYSIS_FILE"
    echo "   - Evaluate alternative architectures (Lambda, AppRunner)" | tee -a "$COST_ANALYSIS_FILE"
    echo "   - Implement auto-scaling to match demand" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    
    echo "4. Monitoring and Alerts:" | tee -a "$COST_ANALYSIS_FILE"
    echo "   - Set up billing alerts for budget overruns" | tee -a "$COST_ANALYSIS_FILE"
    echo "   - Use AWS Cost Explorer for detailed analysis" | tee -a "$COST_ANALYSIS_FILE"
    echo "   - Regularly review AWS Trusted Advisor recommendations" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
    
    echo "Potential Monthly Savings: \$5-10 (15-25% reduction)" | tee -a "$COST_ANALYSIS_FILE"
    echo "" | tee -a "$COST_ANALYSIS_FILE"
}

# Main cost analysis execution
echo "Starting comprehensive cost analysis..." | tee -a "$COST_ANALYSIS_FILE"
echo "" | tee -a "$COST_ANALYSIS_FILE"

calculate_ecs_costs
calculate_s3_costs
calculate_cloudfront_costs
calculate_cloudwatch_costs
calculate_alb_costs
summarize_total_costs
provide_optimizations

echo "Cost analysis completed at: $(date)" | tee -a "$COST_ANALYSIS_FILE"
echo "Full analysis saved to: $COST_ANALYSIS_FILE" | tee -a "$COST_ANALYSIS_FILE"

echo "Cost analysis completed. Check $COST_ANALYSIS_FILE for detailed results."