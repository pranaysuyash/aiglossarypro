# EC2 Fallback Deployment Guide

**Last Updated**: August 10, 2025  
**Purpose**: Quick fallback deployment when ECS Fargate has issues

## 🚀 Quick Start - Launch EC2 Instance

### 1. Launch EC2 Instance via AWS Console

**Instance Configuration**:
- **AMI**: Amazon Linux 2023 (latest)
- **Instance Type**: t3.medium
- **Network**: 
  - VPC: Same as ALB (vpc-0af5e5e12d19bae24 or your VPC)
  - Subnet: Public subnet in same AZ as ALB
  - Auto-assign public IP: Enable
- **Security Group**: Create new or use existing with:
  - Inbound: Port 8080 from ALB security group
  - Inbound: Port 22 from your IP (for SSH)
  - Outbound: All traffic (for ECR, Secrets Manager, etc.)
- **IAM Role**: Create new role with policies:
  - `AmazonEC2ContainerRegistryReadOnly`
  - `SecretsManagerReadWrite` (or custom policy for specific secrets)
- **Storage**: 20 GB gp3
- **Tags**: 
  - Name: aiglossarypro-api-ec2
  - Environment: production

### 2. User Data Script

Copy this into the User Data field when launching:

```bash
#!/bin/bash
set -ex

# Update and install dependencies
yum update -y
yum install -y docker jq aws-cli

# Start Docker
systemctl enable docker
systemctl start docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Set environment variables
export AWS_REGION=us-east-1
export ACCOUNT_ID=927289246324
export ECR_REPO=aiglossarypro-api

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Pull latest image
docker pull $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest

# Fetch secrets from Secrets Manager
DATABASE_URL=$(aws secretsmanager get-secret-value \
  --secret-id arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/database \
  --region $AWS_REGION --query SecretString --output text)

SESSION_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/session \
  --region $AWS_REGION --query SecretString --output text)

JWT_SECRET=$(aws secretsmanager get-secret-value \
  --secret-id arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/jwt \
  --region $AWS_REGION --query SecretString --output text 2>/dev/null || echo "")

# Run the container
docker run -d \
  --name api \
  --restart unless-stopped \
  -p 8080:8080 \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e USE_STANDARD_PG=true \
  -e REDIS_ENABLED=false \
  -e ALLOW_DEGRADED_STARTUP=true \
  -e ALLOW_NO_AUTH_FOR_DEBUG=true \
  -e NODE_OPTIONS="--enable-source-maps --max-old-space-size=1536 --trace-uncaught --trace-warnings --unhandled-rejections=warn" \
  -e DATABASE_URL="$DATABASE_URL" \
  -e SESSION_SECRET="$SESSION_SECRET" \
  ${JWT_SECRET:+-e JWT_SECRET="$JWT_SECRET"} \
  $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:latest

# Create a simple health check script
cat > /home/ec2-user/check-api.sh << 'SCRIPT'
#!/bin/bash
echo "Checking API health..."
curl -s http://localhost:8080/health | jq .
echo ""
echo "Container status:"
docker ps --filter name=api
echo ""
echo "Recent logs:"
docker logs --tail 20 api
SCRIPT

chmod +x /home/ec2-user/check-api.sh

# Log the instance startup
echo "EC2 API deployment completed at $(date)" >> /var/log/api-deployment.log
```

### 3. Configure ALB Target Group

After the EC2 instance is running:

```bash
# Get the instance ID (from EC2 console or CLI)
INSTANCE_ID=i-xxxxxxxxxx

# Create instance-type target group
aws elbv2 create-target-group \
  --name api-ec2-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id vpc-0af5e5e12d19bae24 \
  --target-type instance \
  --health-check-path /health \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 10 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region us-east-1

# Register the EC2 instance
TG_ARN=$(aws elbv2 describe-target-groups --names api-ec2-tg --region us-east-1 --query 'TargetGroups[0].TargetGroupArn' --output text)

aws elbv2 register-targets \
  --target-group-arn $TG_ARN \
  --targets Id=$INSTANCE_ID,Port=8080 \
  --region us-east-1

# Get ALB listener ARN
LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:927289246324:loadbalancer/app/aiglossarypro-api-alb/xxx \
  --region us-east-1 \
  --query 'Listeners[0].ListenerArn' \
  --output text)

# Create rule to route /api/* to EC2 target group
aws elbv2 create-rule \
  --listener-arn $LISTENER_ARN \
  --priority 10 \
  --conditions Field=path-pattern,Values='/api/*' \
  --actions Type=forward,TargetGroupArn=$TG_ARN \
  --region us-east-1
```

### 4. Verify Deployment

```bash
# Test via ALB
ALB_DNS=aiglossarypro-api-alb-1884179415.us-east-1.elb.amazonaws.com
curl -s http://$ALB_DNS/health | jq .
curl -s http://$ALB_DNS/api/health | jq .
curl -s "http://$ALB_DNS/api/terms?limit=1" | jq .

# Test via CloudFront
curl -s https://d1m7nnfj3im4kp.cloudfront.net/api/health | jq .
curl -s "https://d1m7nnfj3im4kp.cloudfront.net/api/terms?limit=1" | jq .
```

## 📝 Manual Steps (if User Data fails)

SSH into the EC2 instance and run:

```bash
# Download and run the start script
curl -O https://raw.githubusercontent.com/pranaysuyash/aiglossarypro/main/scripts/ec2-start-api.sh
chmod +x ec2-start-api.sh

# Set environment variables
export AWS_REGION=us-east-1
export ACCOUNT_ID=927289246324
export ECR_REPO=aiglossarypro-api
export DATABASE_URL_ARN=arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/database
export SESSION_SECRET_ARN=arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/session
export JWT_SECRET_ARN=arn:aws:secretsmanager:us-east-1:927289246324:secret:aiglossarypro/jwt

# Run the script
./ec2-start-api.sh
```

## 🔧 Management Commands

### On the EC2 instance:

```bash
# Check status
docker ps
docker logs -f api

# Restart API
docker restart api

# Stop API
docker stop api && docker rm api

# Pull latest and restart
docker pull 927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api:latest
docker stop api && docker rm api
# Then run the start script again
```

### Cost Control:

```bash
# Stop EC2 instance when not needed
aws ec2 stop-instances --instance-ids $INSTANCE_ID --region us-east-1

# Start EC2 instance when needed
aws ec2 start-instances --instance-ids $INSTANCE_ID --region us-east-1

# Terminate when done (permanent)
aws ec2 terminate-instances --instance-ids $INSTANCE_ID --region us-east-1
```

## 💰 Cost Comparison

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| ECS Fargate | ~$18.02 | 0.5 vCPU, 2GB RAM, always on |
| EC2 t3.medium | ~$30.24 | 2 vCPU, 4GB RAM, always on |
| EC2 t3.medium (12hr/day) | ~$15.12 | Stop when not in use |
| ALB | ~$22.27 | Same for both |

## 🔄 Switching Back to ECS

When ready to switch back to ECS:

```bash
# Scale ECS service back to 1
aws ecs update-service \
  --cluster aiglossarypro \
  --service aiglossarypro-api-production \
  --desired-count 1 \
  --region us-east-1

# Wait for ECS to be healthy
aws ecs wait services-stable \
  --cluster aiglossarypro \
  --services aiglossarypro-api-production \
  --region us-east-1

# Remove EC2 from target group
aws elbv2 deregister-targets \
  --target-group-arn $TG_ARN \
  --targets Id=$INSTANCE_ID \
  --region us-east-1

# Stop EC2 instance
aws ec2 stop-instances --instance-ids $INSTANCE_ID --region us-east-1
```

## 📞 Emergency Contacts

- AWS Support: Via AWS Console
- CloudWatch Logs: `/ecs/aiglossarypro-api`
- Monitoring: CloudWatch Dashboard

## 🚨 Troubleshooting

### Container won't start
- Check Docker logs: `docker logs api`
- Verify secrets are accessible
- Check ECR login succeeded
- Ensure IAM role has correct permissions

### Health checks failing
- Check security group allows port 8080
- Verify container is running: `docker ps`
- Check application logs: `docker logs -f api`
- Test locally: `curl http://localhost:8080/health`

### ALB not routing correctly
- Verify target group health checks
- Check listener rules priority
- Ensure EC2 is in correct subnet
- Verify security groups allow ALB → EC2 traffic

---

**This guide provides a complete fallback deployment strategy for running the API on EC2 when ECS Fargate has issues.**