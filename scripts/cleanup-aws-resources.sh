#!/bin/bash
set -euo pipefail

# AWS Resource Cleanup Script
# Removes ALB, CloudFront, S3 to minimize costs

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ALB_NAME="${ALB_NAME:-aiglossarypro-api-alb}"
CLOUDFRONT_ID="${CLOUDFRONT_ID:-ESF8YR50LSGU8}"
S3_BUCKET="${S3_BUCKET:-aiglossarypro-frontend}"
BACKUP_BUCKET="${BACKUP_BUCKET:-}"
DRY_RUN="${DRY_RUN:-1}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🧹 AWS Resource Cleanup Script${NC}"
echo "Region: $AWS_REGION"
echo "DRY_RUN: $DRY_RUN (set DRY_RUN=0 to actually delete)"
echo ""

if [ "$DRY_RUN" = "1" ]; then
    echo -e "${YELLOW}⚠️  DRY RUN MODE - No resources will be deleted${NC}"
    echo ""
fi

# Function to execute or simulate commands
execute() {
    if [ "$DRY_RUN" = "1" ]; then
        echo -e "${YELLOW}[DRY RUN]${NC} $@"
    else
        echo -e "${GREEN}[EXECUTING]${NC} $@"
        eval "$@"
    fi
}

# Step 1: Get ALB ARN and related resources
echo -e "${YELLOW}1️⃣ Finding ALB resources...${NC}"
ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names "$ALB_NAME" \
    --region "$AWS_REGION" \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text 2>/dev/null || echo "")

if [ -n "$ALB_ARN" ] && [ "$ALB_ARN" != "None" ]; then
    echo "Found ALB: ${ALB_ARN##*/}"
    
    # Get target groups
    TARGET_GROUPS=$(aws elbv2 describe-target-groups \
        --load-balancer-arn "$ALB_ARN" \
        --region "$AWS_REGION" \
        --query 'TargetGroups[].TargetGroupArn' \
        --output text 2>/dev/null || echo "")
    
    # Get listeners
    LISTENERS=$(aws elbv2 describe-listeners \
        --load-balancer-arn "$ALB_ARN" \
        --region "$AWS_REGION" \
        --query 'Listeners[].ListenerArn' \
        --output text 2>/dev/null || echo "")
    
    echo "Found $(echo $TARGET_GROUPS | wc -w) target groups"
    echo "Found $(echo $LISTENERS | wc -w) listeners"
else
    echo -e "${YELLOW}ALB not found or already deleted${NC}"
fi

# Step 2: Delete ALB and related resources
if [ -n "$ALB_ARN" ] && [ "$ALB_ARN" != "None" ]; then
    echo -e "${YELLOW}2️⃣ Deleting ALB resources...${NC}"
    
    # Delete listeners first
    for LISTENER in $LISTENERS; do
        echo "  Deleting listener: ${LISTENER##*/}"
        execute aws elbv2 delete-listener \
            --listener-arn "$LISTENER" \
            --region "$AWS_REGION"
    done
    
    # Delete ALB
    echo "  Deleting ALB: ${ALB_ARN##*/}"
    execute aws elbv2 delete-load-balancer \
        --load-balancer-arn "$ALB_ARN" \
        --region "$AWS_REGION"
    
    # Wait for ALB deletion if not dry run
    if [ "$DRY_RUN" = "0" ]; then
        echo "  Waiting for ALB deletion..."
        sleep 30
    fi
    
    # Delete target groups
    for TG in $TARGET_GROUPS; do
        echo "  Deleting target group: ${TG##*/}"
        execute aws elbv2 delete-target-group \
            --target-group-arn "$TG" \
            --region "$AWS_REGION"
    done
    
    echo -e "${GREEN}✅ ALB resources deleted${NC}"
fi

# Step 3: Disable and delete CloudFront distribution
echo -e "${YELLOW}3️⃣ Handling CloudFront distribution...${NC}"
CF_STATUS=$(aws cloudfront get-distribution \
    --id "$CLOUDFRONT_ID" \
    --query 'Distribution.Status' \
    --output text 2>/dev/null || echo "")

if [ -n "$CF_STATUS" ] && [ "$CF_STATUS" != "None" ]; then
    echo "CloudFront status: $CF_STATUS"
    
    # Get current config and ETag
    aws cloudfront get-distribution-config \
        --id "$CLOUDFRONT_ID" \
        --output json > /tmp/cf-config.json 2>/dev/null
    
    ETAG=$(jq -r '.ETag' /tmp/cf-config.json)
    
    # Disable distribution first
    if [ "$CF_STATUS" = "Deployed" ]; then
        echo "  Disabling CloudFront distribution..."
        jq '.DistributionConfig.Enabled = false' /tmp/cf-config.json | \
            jq '.DistributionConfig' > /tmp/cf-disabled.json
        
        execute aws cloudfront update-distribution \
            --id "$CLOUDFRONT_ID" \
            --if-match "$ETAG" \
            --distribution-config file:///tmp/cf-disabled.json
        
        if [ "$DRY_RUN" = "0" ]; then
            echo "  Waiting for CloudFront to disable (this can take 10-15 minutes)..."
            aws cloudfront wait distribution-deployed --id "$CLOUDFRONT_ID" 2>/dev/null || true
        fi
    fi
    
    # Delete distribution
    echo "  Deleting CloudFront distribution..."
    if [ "$DRY_RUN" = "0" ]; then
        # Get fresh ETag after disable
        ETAG=$(aws cloudfront get-distribution-config --id "$CLOUDFRONT_ID" --query 'ETag' --output text)
    fi
    
    execute aws cloudfront delete-distribution \
        --id "$CLOUDFRONT_ID" \
        --if-match "$ETAG"
    
    echo -e "${GREEN}✅ CloudFront distribution handled${NC}"
else
    echo -e "${YELLOW}CloudFront distribution not found or already deleted${NC}"
fi

# Step 4: Backup and delete S3 bucket
echo -e "${YELLOW}4️⃣ Handling S3 bucket...${NC}"
BUCKET_EXISTS=$(aws s3api head-bucket --bucket "$S3_BUCKET" 2>&1 | grep -c "404" || true)

if [ "$BUCKET_EXISTS" = "0" ]; then
    echo "S3 bucket exists: $S3_BUCKET"
    
    # Backup if backup bucket specified
    if [ -n "$BACKUP_BUCKET" ]; then
        echo "  Backing up to: $BACKUP_BUCKET"
        execute aws s3 sync "s3://$S3_BUCKET" "s3://$BACKUP_BUCKET/backup-$(date +%Y%m%d)" \
            --delete
    else
        echo -e "${YELLOW}  No backup bucket specified, skipping backup${NC}"
    fi
    
    # Delete all objects and versions
    echo "  Removing all objects from bucket..."
    execute aws s3 rm "s3://$S3_BUCKET" --recursive
    
    # Delete all object versions if versioning was enabled
    echo "  Removing all object versions..."
    if [ "$DRY_RUN" = "0" ]; then
        aws s3api list-object-versions --bucket "$S3_BUCKET" \
            --query 'Versions[].{Key:Key,VersionId:VersionId}' \
            --output json 2>/dev/null | \
            jq -r '.[] | "--delete-object Key=\(.Key),VersionId=\(.VersionId)"' | \
            xargs -I {} aws s3api {} --bucket "$S3_BUCKET" 2>/dev/null || true
    fi
    
    # Delete bucket
    echo "  Deleting bucket..."
    execute aws s3api delete-bucket \
        --bucket "$S3_BUCKET" \
        --region "$AWS_REGION"
    
    echo -e "${GREEN}✅ S3 bucket handled${NC}"
else
    echo -e "${YELLOW}S3 bucket not found or already deleted${NC}"
fi

# Step 5: Summary
echo ""
echo -e "${GREEN}🎉 Cleanup Summary${NC}"
echo "=================="

if [ "$DRY_RUN" = "1" ]; then
    echo -e "${YELLOW}This was a DRY RUN. To actually delete resources, run:${NC}"
    echo "  DRY_RUN=0 $0"
    echo ""
    echo "Resources that would be deleted:"
else
    echo "Resources deleted:"
fi

[ -n "$ALB_ARN" ] && [ "$ALB_ARN" != "None" ] && echo "  ✅ ALB: $ALB_NAME"
[ -n "$CF_STATUS" ] && [ "$CF_STATUS" != "None" ] && echo "  ✅ CloudFront: $CLOUDFRONT_ID"
[ "$BUCKET_EXISTS" = "0" ] && echo "  ✅ S3 Bucket: $S3_BUCKET"

echo ""
echo "Cost savings (estimated monthly):"
echo "  ALB: ~\$22.27"
echo "  CloudFront: ~\$0.50"
echo "  S3: ~\$0.10"
echo "  Total: ~\$22.87/month"
echo ""
echo "Remaining resources (keep these):"
echo "  ✅ EC2 instance"
echo "  ✅ ECR repository"
echo "  ✅ Secrets Manager"
echo "  ✅ Route53 domain"