#!/bin/bash

echo "🛑 Stopping AIGlossaryPro Backend..."

# Update service to desired count 0
aws ecs update-service \
  --cluster aiglossarypro \
  --service aiglossarypro-api \
  --desired-count 0 \
  --region us-east-1

echo "✅ Backend service stopped."

# Check if load balancer exists and delete it
echo "🛑 Checking for load balancer..."
ALB_ARN=$(aws elbv2 describe-load-balancers --names aiglossarypro-alb --region us-east-1 --query 'LoadBalancers[0].LoadBalancerArn' --output text 2>/dev/null)

if [ "$ALB_ARN" != "None" ] && [ -n "$ALB_ARN" ]; then
  echo "🗑️  Deleting load balancer to save costs..."
  aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN" --region us-east-1
  echo "✅ Load balancer deleted."
  echo "💰 This saves ~$16/month in ALB costs"
else
  echo "ℹ️  No load balancer found."
fi

echo ""
echo "💰 Total savings: ~$26-36/month (Fargate + ALB)"
echo "💡 To restart the backend, run: ./scripts/start-backend.sh"