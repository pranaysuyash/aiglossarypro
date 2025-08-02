#!/bin/bash

echo "🚀 Starting AIGlossaryPro Backend..."

# Check if load balancer exists
ALB_ARN=$(aws elbv2 describe-load-balancers --names aiglossarypro-alb --region us-east-1 --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null)

if [ "$ALB_ARN" == "None" ] || [ -z "$ALB_ARN" ]; then
  echo "📦 Creating load balancer..."
  
  # Get VPC and subnets
  VPC_ID=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query "Vpcs[0].VpcId" --output text --region us-east-1)
  SUBNET_1=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=availability-zone,Values=us-east-1a" --query "Subnets[0].SubnetId" --output text --region us-east-1)
  SUBNET_2=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=availability-zone,Values=us-east-1b" --query "Subnets[0].SubnetId" --output text --region us-east-1)
  
  # Get security group
  SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=aiglossarypro-alb-sg" --query "SecurityGroups[0].GroupId" --output text --region us-east-1)
  
  # Create load balancer
  ALB_ARN=$(aws elbv2 create-load-balancer \
    --name aiglossarypro-alb \
    --subnets $SUBNET_1 $SUBNET_2 \
    --security-groups $SG_ID \
    --region us-east-1 \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)
  
  echo "✅ Load balancer created"
  
  # Get target group
  TG_ARN=$(aws elbv2 describe-target-groups --names aiglossarypro-api-tg --region us-east-1 --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null)
  
  # Create listener
  aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TG_ARN \
    --region us-east-1 >/dev/null
  
  echo "✅ Listener configured"
else
  echo "✅ Load balancer already exists"
fi

# Update service to desired count 1
aws ecs update-service \
  --cluster aiglossarypro \
  --service aiglossarypro-api \
  --desired-count 1 \
  --region us-east-1 >/dev/null

echo "✅ Backend starting... Check ECS console for status"
echo "📊 View logs: aws logs tail /ecs/aiglossarypro-api --follow --region us-east-1"
echo ""
echo "🔍 Check service status:"
echo "aws ecs describe-services --cluster aiglossarypro --services aiglossarypro-api --region us-east-1"