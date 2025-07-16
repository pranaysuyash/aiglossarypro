# AWS Deployment Blueprint for AI Glossary Pro

## Executive Summary

This blueprint provides a production-ready AWS deployment strategy for AI Glossary Pro, focusing on cost-effectiveness, scalability, and operational simplicity. The recommended architecture uses AWS App Runner for the application, RDS PostgreSQL for the database, ElastiCache Redis for caching, and CloudFront CDN for global content delivery.

**Estimated Monthly Cost**: $75-120 (with cost optimization strategies)

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   CloudFront    │────▶│   App Runner     │────▶│  RDS PostgreSQL │
│      (CDN)      │     │  (Application)   │     │   (Database)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                           │
                               ▼                           ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │ ElastiCache Redis│     │    S3 Bucket    │
                        │    (Caching)     │     │   (Storage)     │
                        └──────────────────┘     └─────────────────┘
```

---

## Pre-Deployment Checklist

### 1. Code Preparation

```bash
# Verify Docker build works locally
docker build -t aiglossarypro:latest .
docker run -p 3000:3000 --env-file .env.production aiglossarypro:latest

# Run production build
npm run build

# Test production mode locally
NODE_ENV=production npm start
```

### 2. Environment Variables Setup

Create `.env.production` with all required variables:

```env
# Core Configuration
NODE_ENV=production
PORT=3000
BASE_URL=https://aiglossarypro.com

# Database (RDS)
DATABASE_URL=postgresql://username:password@rds-endpoint.region.rds.amazonaws.com:5432/aiglossarypro?sslmode=require

# Redis (ElastiCache)
REDIS_URL=redis://elasticache-endpoint.region.cache.amazonaws.com:6379

# Session & Security
SESSION_SECRET=<generate-strong-64-char-secret>
JWT_SECRET=<generate-strong-32-char-secret>

# AWS Resources
AWS_REGION=us-east-1
S3_BUCKET_NAME=aiglossarypro-assets
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>

# Authentication (using existing setup)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-secret>
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-secret>

# Third-Party Services
OPENAI_API_KEY=<your-openai-key>
RESEND_API_KEY=<your-resend-key>
GUMROAD_WEBHOOK_SECRET=<your-gumroad-secret>

# Analytics
POSTHOG_API_KEY=<your-posthog-key>
GOOGLE_ANALYTICS_ID=<your-ga4-id>
SENTRY_DSN=<your-sentry-dsn>

# CORS & Security
PRODUCTION_URL=https://aiglossarypro.com
ALLOWED_ORIGINS=https://aiglossarypro.com
```

### 3. Database Migration Preparation

```sql
-- Export from Neon (if migrating existing data)
pg_dump $NEON_DATABASE_URL > aiglossarypro_backup.sql

-- Will import to RDS after setup
```

---

## AWS Services Setup

### 1. RDS PostgreSQL Setup

**Service**: Amazon RDS for PostgreSQL 15

```bash
# Create RDS instance via AWS CLI
aws rds create-db-instance \
  --db-instance-identifier aiglossarypro-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username dbadmin \
  --master-user-password <strong-password> \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00" \
  --no-publicly-accessible
```

**Cost Optimization**:
- Start with db.t3.micro (eligible for free tier if available)
- Use GP3 storage (more cost-effective than GP2)
- Enable automated backups for disaster recovery
- Place in private subnet for security

**Performance Settings**:
```sql
-- After RDS is created, optimize for our workload
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '768MB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET max_connections = 100;
```

### 2. ElastiCache Redis Setup

**Service**: Amazon ElastiCache for Redis 7.0

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id aiglossarypro-cache \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --security-group-ids sg-xxxxxxxxx \
  --cache-subnet-group-name aiglossarypro-subnet-group
```

**Configuration**:
- Enable Redis persistence (AOF) for data durability
- Set maxmemory-policy to `allkeys-lru`
- Configure connection pooling in app

### 3. VPC Configuration

Create a dedicated VPC for better security:

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create subnets
# Public subnets for App Runner VPC connector
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24 --availability-zone us-east-1b

# Private subnets for RDS and ElastiCache
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.11.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.12.0/24 --availability-zone us-east-1b
```

### 4. App Runner Deployment

**Step 1**: Create ECR Repository

```bash
# Create ECR repository
aws ecr create-repository --repository-name aiglossarypro

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push image
docker build -t aiglossarypro:latest .
docker tag aiglossarypro:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro:latest
```

**Step 2**: Create App Runner Service

```yaml
# apprunner.yaml
version: 1.0
runtime: docker
build:
  commands:
    pre-build:
      - echo "No pre-build commands"
run:
  runtime-version: latest
  command: npm start
  network:
    port: 3000
    env: PORT
  env:
    - name: NODE_ENV
      value: production
    - name: DATABASE_URL
      value: <RDS-connection-string>
    - name: REDIS_URL
      value: <ElastiCache-connection-string>
```

**App Runner Configuration**:
- Instance: 0.5 vCPU, 1 GB RAM (start small)
- Auto-scaling: Min 1, Max 10 instances
- Health check: `/api/health`
- VPC connector: Connect to private VPC for RDS/Redis access

### 5. S3 Bucket Setup

```bash
# Create S3 bucket for assets
aws s3 mb s3://aiglossarypro-assets

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket aiglossarypro-assets \
  --versioning-configuration Status=Enabled

# Configure CORS
aws s3api put-bucket-cors \
  --bucket aiglossarypro-assets \
  --cors-configuration file://cors.json
```

**CORS Configuration** (`cors.json`):
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
      "AllowedOrigins": ["https://aiglossarypro.com"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 6. CloudFront CDN Setup

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

**CloudFront Configuration**:
- Origin: App Runner endpoint
- Caching: 
  - Static assets: 1 year
  - API responses: No cache
  - HTML: 5 minutes
- Compression: Enable gzip/brotli
- Custom error pages for better UX

---

## CI/CD Pipeline with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: aiglossarypro

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linter
        run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build, tag, and push image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      - name: Update App Runner Service
        run: |
          aws apprunner start-deployment \
            --service-arn ${{ secrets.APP_RUNNER_SERVICE_ARN }}
      
      - name: Run database migrations
        run: |
          npm run db:migrate:prod
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Cost Optimization Strategies

### 1. Reserved Instances
- Purchase 1-year reserved instances for RDS and ElastiCache (save ~30%)
- Estimated savings: $20-30/month

### 2. Auto-scaling Configuration
```javascript
// App Runner auto-scaling config
{
  "MinSize": 1,
  "MaxSize": 10,
  "TargetCPU": 70,
  "TargetMemory": 80,
  "ScaleDownCooldown": 300,
  "ScaleUpCooldown": 60
}
```

### 3. Caching Strategy
- Cache static assets in CloudFront (reduce App Runner load)
- Use Redis for database query caching
- Implement browser caching headers

### 4. Database Optimization
- Enable RDS Performance Insights (free)
- Use read replicas only when needed
- Implement connection pooling

### 5. Cost Monitoring
```bash
# Set up billing alerts
aws cloudwatch put-metric-alarm \
  --alarm-name "Monthly-Billing-Alert" \
  --alarm-description "Alert when monthly bill exceeds $150" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 150 \
  --comparison-operator GreaterThanThreshold
```

---

## Security Hardening

### 1. Secrets Management
Use AWS Systems Manager Parameter Store:

```bash
# Store secrets securely
aws ssm put-parameter \
  --name "/aiglossarypro/production/database_url" \
  --value "postgresql://..." \
  --type SecureString

# Reference in App Runner
DATABASE_URL: arn:aws:ssm:region:account:parameter/aiglossarypro/production/database_url
```

### 2. Network Security
- Use security groups with least privilege
- Enable VPC Flow Logs
- Implement AWS WAF on CloudFront

### 3. Data Encryption
- Enable encryption at rest for RDS, ElastiCache, S3
- Use SSL/TLS for all connections
- Rotate credentials regularly

---

## Domain and SSL Setup

### 1. Route 53 Configuration
```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name aiglossarypro.com \
  --caller-reference $(date +%s)

# Update nameservers at Namecheap
```

### 2. SSL Certificate
```bash
# Request certificate from ACM
aws acm request-certificate \
  --domain-name aiglossarypro.com \
  --subject-alternative-names "*.aiglossarypro.com" \
  --validation-method DNS
```

### 3. DNS Records
```bash
# A record for root domain
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch file://dns-records.json
```

---

## Monitoring and Alerting

### 1. CloudWatch Dashboard
Create custom dashboard monitoring:
- App Runner request count and latency
- RDS CPU and connections
- ElastiCache hit rate
- Error rates and 5xx responses

### 2. Application Monitoring
```javascript
// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      s3: await checkS3(),
      openai: await checkOpenAI()
    },
    metrics: {
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };
  
  res.json(health);
});
```

---

## Migration Timeline

### Day 1: Infrastructure Setup
- [ ] Create VPC and subnets
- [ ] Launch RDS PostgreSQL
- [ ] Launch ElastiCache Redis
- [ ] Create S3 buckets

### Day 2: Application Deployment
- [ ] Build and push Docker image to ECR
- [ ] Create App Runner service
- [ ] Configure environment variables
- [ ] Test connectivity to RDS/Redis

### Day 3: Data Migration
- [ ] Export data from Neon
- [ ] Import to RDS
- [ ] Run migrations
- [ ] Verify data integrity

### Day 4: CDN and Domain
- [ ] Set up CloudFront
- [ ] Configure Route 53
- [ ] Update DNS records
- [ ] Test SSL certificates

### Day 5: Testing and Cutover
- [ ] Full application testing
- [ ] Performance testing
- [ ] Update OAuth redirect URLs
- [ ] Go live!

---

## Post-Deployment Tasks

1. **Performance Tuning**
   - Analyze CloudWatch metrics
   - Optimize slow queries
   - Adjust auto-scaling thresholds

2. **Backup Verification**
   - Test RDS backup restoration
   - Document recovery procedures

3. **Cost Review**
   - Review first week's costs
   - Identify optimization opportunities
   - Consider reserved instances

4. **Security Audit**
   - Run AWS Security Hub
   - Review IAM permissions
   - Enable GuardDuty

---

## Estimated Monthly Costs

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| App Runner | 0.5 vCPU, 1GB RAM, auto-scaling | $25-40 |
| RDS PostgreSQL | db.t3.micro, 20GB storage | $15-20 |
| ElastiCache Redis | cache.t3.micro | $12-15 |
| CloudFront CDN | 100GB transfer | $8-12 |
| Route 53 | 1 hosted zone | $0.50 |
| S3 Storage | 10GB storage, minimal requests | $2-3 |
| Data Transfer | Inter-AZ and egress | $5-10 |
| **Total** | | **$68-100** |

*Note: Costs can be reduced by ~30% with reserved instances after initial validation*

---

## Rollback Plan

In case of issues:

1. **App Runner**: Keep previous version, use instant rollback
2. **Database**: Restore from automated backup
3. **DNS**: Switch back to old infrastructure (keep it running for 48h)
4. **Cache**: Redis can be repopulated automatically

---

## Support Contacts

- AWS Support: [Create support ticket]
- App Runner Issues: Check CloudWatch logs first
- Database Issues: RDS Performance Insights
- Domain/SSL: Route 53 health checks

---

## Next Steps

1. Review and approve the architecture
2. Set up AWS account and IAM users
3. Begin Day 1 infrastructure setup
4. Schedule daily check-ins during migration week

This blueprint provides a production-ready, scalable, and cost-effective deployment for AI Glossary Pro on AWS.