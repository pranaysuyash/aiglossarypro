# Current Infrastructure Configuration

**Date**: September 2, 2025  
**Purpose**: Complete documentation of current working infrastructure before optimization changes

---

## 🎯 Current Architecture Overview

```
Users → CloudFront (d1m7nnfj3im4kp.cloudfront.net)
    ├─ Frontend (/*) → S3 (aiglossarypro-frontend)
    └─ API (/api/*) → ALB (aiglossarypro-api-alb) → EC2 (i-045ff31e850f8b78d)
```

---

## 🏗️ EC2 Instance Configuration

### Instance Details
- **Instance ID**: `i-045ff31e850f8b78d`
- **Instance Type**: `t3.small`
- **AMI**: Amazon Linux 2
- **Launch Time**: 2025-08-10T14:40:47+00:00
- **Status**: `running`

### Network Configuration
- **VPC**: `vpc-00aff02c4878befa0`
- **Subnet**: `subnet-0688cb3b1905aca74` (us-east-1c)
- **Availability Zone**: `us-east-1c`
- **Public IP**: `52.0.112.85`
- **Private IP**: `172.31.46.188`
- **Security Groups**: `sg-05505263b72da8903`

### Application Configuration
- **API Port**: `8080`
- **Health Check**: `/health`
- **Direct Access**: `http://52.0.112.85:8080/health`
- **Response**: `{"status":"healthy","timestamp":"2025-09-02T10:04:53.166Z","environment":"production","uptime":1136393.282001331}`

---

## ⚖️ Application Load Balancer (ALB) Configuration

### ALB Details
- **Name**: `aiglossarypro-api-alb`
- **ARN**: `arn:aws:elasticloadbalancing:us-east-1:927289246324:loadbalancer/app/aiglossarypro-api-alb/4c8b5e7d8f9a0b1c`
- **DNS Name**: `aiglossarypro-api-alb-1884179415.us-east-1.elb.amazonaws.com`
- **Type**: `application`
- **Scheme**: `internet-facing`
- **State**: `active`
- **VPC**: `vpc-00aff02c4878befa0`

### ALB Availability Zones
- `us-east-1c`: `subnet-0688cb3b1905aca74`
- `us-east-1d`: `subnet-0a6b43ab8b1053961`
- `us-east-1e`: `subnet-05ba78c9937ad65c4`

### Target Group Configuration
- **Name**: `aiglossarypro-api-tg`
- **ARN**: `arn:aws:elasticloadbalancing:us-east-1:927289246324:targetgroup/aiglossarypro-api-tg/6ffdfcb32339ab5d`
- **Port**: `8080`
- **Protocol**: `HTTP`
- **Target Type**: `ip`
- **VPC**: `vpc-00aff02c4878befa0`
- **Health Check Path**: `/health`
- **Health Check Port**: `traffic-port`

### Target Health Status
- **Target**: `172.31.46.188:8080`
- **Health**: `healthy`
- **Description**: `None` (healthy)

---

## ☁️ CloudFront Distribution Configuration

### Distribution Details
- **Distribution ID**: `ESF8YR50LSGU8`
- **Domain Name**: `d1m7nnfj3im4kp.cloudfront.net`
- **Status**: `Deployed`
- **Comment**: "AIGlossaryPro Frontend CDN with API routing"
- **Default Root Object**: `index.html`
- **Price Class**: `PriceClass_100`
- **HTTP Version**: `http2and3`
- **IPv6 Enabled**: `true`

### Origins Configuration

#### Origin 1: ALB for API
- **Origin ID**: `ALB-aiglossarypro-api`
- **Domain Name**: `aiglossarypro-api-alb-1884179415.us-east-1.elb.amazonaws.com`
- **Protocol**: `http-only`
- **HTTP Port**: `80`
- **HTTPS Port**: `443`
- **Origin Path**: (empty)
- **Connection Attempts**: `3`
- **Connection Timeout**: `10` seconds
- **Origin Read Timeout**: `30` seconds
- **Origin Keepalive Timeout**: `5` seconds

#### Origin 2: S3 for Frontend
- **Origin ID**: `S3-aiglossarypro-frontend`
- **Domain Name**: `aiglossarypro-frontend.s3.us-east-1.amazonaws.com`
- **Origin Access Control**: `EPTWB30C5CPDW`
- **Connection Attempts**: `3`
- **Connection Timeout**: `10` seconds

#### Origin 3: Legacy ALB (Unused)
- **Origin ID**: `ALB-Origin`
- **Domain Name**: `aiglossarypro-api-alb-1884179415.us-east-1.elb.amazonaws.com`
- **Protocol**: `http-only`
- **HTTP Port**: `80`
- **HTTPS Port**: `443`

### Cache Behaviors

#### Default Behavior (Frontend)
- **Path Pattern**: `/*` (default)
- **Target Origin**: `S3-aiglossarypro-frontend`
- **Viewer Protocol Policy**: `redirect-to-https`
- **Allowed Methods**: `HEAD`, `GET`
- **Cached Methods**: `HEAD`, `GET`
- **Compress**: `true`
- **Cache Policy**: `4135ea2d-6df8-44a3-9df3-4b5a84be39ad`
- **Origin Request Policy**: `88a5eaf4-2fd4-4709-b370-b4c650ea3fcf`

#### API Behavior
- **Path Pattern**: `/api/*`
- **Target Origin**: `ALB-aiglossarypro-api`
- **Viewer Protocol Policy**: `redirect-to-https`
- **Allowed Methods**: `HEAD`, `DELETE`, `POST`, `GET`, `OPTIONS`, `PUT`, `PATCH`
- **Cached Methods**: `HEAD`, `GET`
- **Compress**: `true`
- **Cache Policy**: `4135ea2d-6df8-44a3-9df3-4b5a84be39ad`
- **Origin Request Policy**: `216adef6-5c7f-47e4-b989-5492eafa07d3`

#### Assets Behavior
- **Path Pattern**: `/assets/*`
- **Target Origin**: `S3-aiglossarypro-frontend`
- **Viewer Protocol Policy**: `redirect-to-https`
- **Allowed Methods**: `HEAD`, `GET`
- **Cached Methods**: `HEAD`, `GET`
- **Compress**: `true`
- **Cache Policy**: `4135ea2d-6df8-44a3-9df3-4b5a84be39ad`
- **Origin Request Policy**: `88a5eaf4-2fd4-4709-b370-b4c650ea3fcf`

### Custom Error Responses
- **Error Code**: `404`
- **Response Page Path**: `/index.html`
- **Response Code**: `200`
- **Error Caching Min TTL**: `300` seconds

---

## 💰 Current Cost Breakdown

### Monthly Costs (Estimated)
- **EC2 t3.small**: ~$15-18/month (720 hours)
- **ALB**: ~$22/month ($0.0225/hour + $0.008/LCU)
- **CloudFront**: ~$0.50/month (minimal traffic)
- **S3**: ~$1-2/month (storage + requests)
- **EBS**: ~$2-3/month (GP3 storage)

**Total**: ~$39-45/month

---

## 🔧 Working Endpoints (Verified)

### Direct EC2 Access
```bash
# Health check
curl http://52.0.112.85:8080/health
# Response: {"status":"healthy","timestamp":"...","uptime":...}

# API base
curl http://52.0.112.85:8080/api
# Response: {"success":true,"message":"AI Glossary Pro API","version":"2.0.0",...}

# Terms endpoint
curl http://52.0.112.85:8080/api/terms
# Response: {"success":true,"total":0,"page":1,...}
```

### Via CloudFront
```bash
# Health check via CloudFront
curl https://d1m7nnfj3im4kp.cloudfront.net/api/health
# Response: {"status":"healthy","timestamp":"...","uptime":...}

# Terms via CloudFront
curl https://d1m7nnfj3im4kp.cloudfront.net/api/terms
# Response: {"success":true,"total":0,"page":1,...}

# Categories via CloudFront
curl https://d1m7nnfj3im4kp.cloudfront.net/api/categories
# Response: {"success":true,"data":[],"pagination":{...}}

# Frontend via CloudFront
curl https://d1m7nnfj3im4kp.cloudfront.net/
# Response: 200 OK (React app HTML)
```

---

## 🚨 Critical Dependencies

### For ALB to Work
1. EC2 instance must be running in registered subnets (us-east-1c, us-east-1d, us-east-1e)
2. Target group must have healthy targets (172.31.46.188:8080)
3. Security groups must allow ALB → EC2 communication on port 8080
4. Health checks must pass on `/health` endpoint

### For CloudFront to Work
1. ALB must be active and responding
2. Origins must be correctly configured
3. Cache behaviors must route paths properly
4. S3 bucket policy must allow CloudFront access

### For EC2 to Work
1. Instance must be running and healthy
2. Application must be listening on port 8080
3. Security groups must allow inbound traffic
4. VPC and subnet configuration must be correct

---

## 📋 Rollback Procedures

### If ALB Changes Fail
```bash
# Restore ALB target group registration
aws elbv2 register-targets --target-group-arn arn:aws:elasticloadbalancing:us-east-1:927289246324:targetgroup/aiglossarypro-api-tg/6ffdfcb32339ab5d --targets Id=172.31.46.188,Port=8080

# Verify target health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:927289246324:targetgroup/aiglossarypro-api-tg/6ffdfcb32339ab5d
```

### If CloudFront Changes Fail
```bash
# Restore original CloudFront configuration
aws cloudfront update-distribution --id ESF8YR50LSGU8 --distribution-config file://current-cf-config.json --if-match E17CLJ93FEF9RM

# Clear cache
aws cloudfront create-invalidation --distribution-id ESF8YR50LSGU8 --paths "/*"
```

### If EC2 Issues Occur
```bash
# Restart EC2 instance
aws ec2 reboot-instances --instance-ids i-045ff31e850f8b78d

# Check instance status
aws ec2 describe-instance-status --instance-ids i-045ff31e850f8b78d

# SSH access (if needed)
ssh -i your-key.pem ec2-user@52.0.112.85
```

---

## 🔒 Security Configuration

### Security Groups
- **EC2 Security Group**: `sg-05505263b72da8903`
  - Allows ALB traffic on port 8080
  - Allows SSH access (if configured)
  - Allows outbound internet access

### IAM Roles and Permissions
- EC2 instance may have IAM role for AWS service access
- CloudFront has S3 access via Origin Access Control
- ALB has necessary service-linked roles

---

## 📝 Change Log

### 2025-09-02: ALB → EC2 Connection Fixed
- Registered EC2 private IP (172.31.46.188:8080) with ALB target group
- Added us-east-1c subnet to ALB availability zones
- Verified all API endpoints working through CloudFront → ALB → EC2
- Updated documentation to reflect current state

### Previous State Issues (Resolved)
- ALB was configured but had no healthy targets
- ECS Fargate tasks were failing (desired=1, running=0)
- API endpoints returning 503 Service Unavailable
- CloudFront /api/* requests not reaching backend

---

**This configuration represents a fully working production setup as of September 2, 2025.**