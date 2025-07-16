# AWS Quick Deploy Guide for AI Glossary Pro

## 🚀 Fastest Path to Production (2-3 Hours)

This guide provides the quickest way to deploy AI Glossary Pro on AWS, prioritizing speed over optimization.

---

## Option 1: Minimal Cost Deploy (~$30-40/month)

### Step 1: Keep Neon Database (Free)
No migration needed! Continue using your existing Neon PostgreSQL.

### Step 2: Deploy to App Runner (30 minutes)

1. **Push to ECR**:
```bash
# One-time ECR setup
aws ecr create-repository --repository-name aiglossarypro --region us-east-1

# Build and push
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

docker build -t aiglossarypro .
docker tag aiglossarypro:latest $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/aiglossarypro:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/aiglossarypro:latest
```

2. **Create App Runner Service** (in AWS Console):
   - Go to App Runner in AWS Console
   - Click "Create service"
   - Source: Container registry → ECR
   - Select your pushed image
   - Port: 3000
   - CPU: 0.25 vCPU, Memory: 0.5 GB (smallest size)
   - Add ALL environment variables from `.env.production`

3. **Critical Environment Variables**:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<your-neon-connection-string>
SESSION_SECRET=<generate-random-64-chars>
JWT_SECRET=<generate-random-32-chars>
PRODUCTION_URL=<app-runner-url-initially>
```

### Step 3: Quick Redis Alternative (5 minutes)
Instead of ElastiCache, use Upstash Redis (free tier):

1. Sign up at [upstash.com](https://upstash.com)
2. Create Redis database (free)
3. Copy the Redis URL
4. Add to App Runner env: `REDIS_URL=<upstash-redis-url>`

### Step 4: Use Existing S3 Bucket
Just ensure your AWS credentials in App Runner have access to your existing S3 bucket.

---

## Option 2: GitHub Direct Deploy (Simplest)

If you prefer not to use Docker/ECR:

1. **Fork and Configure**:
   - Ensure `Dockerfile` is in repo root
   - Commit `.env.production.example` with instructions

2. **App Runner from GitHub**:
   - Source: GitHub repository
   - Connect your GitHub account
   - Select repository and branch
   - Build settings: Use Dockerfile
   - Same environment variables as above

3. **Auto-deploy on Push**:
   - App Runner rebuilds on every push to main
   - No CI/CD setup needed initially

---

## Domain Setup (30 minutes)

### Using Namecheap DNS (Free)

1. **Get App Runner Domain**:
   - Copy your App Runner URL (e.g., `https://abc123.us-east-1.awsapprunner.com`)

2. **In Namecheap**:
   - Add CNAME record:
     - Host: `www`
     - Value: `abc123.us-east-1.awsapprunner.com`
   - Add URL Redirect:
     - Host: `@`
     - Value: `https://www.aiglossarypro.com`

3. **Update App Runner**:
   - Add custom domain in App Runner console
   - Wait for SSL certificate (automatic, ~10 mins)

4. **Update Environment**:
   - Change `PRODUCTION_URL=https://www.aiglossarypro.com`
   - Redeploy App Runner

---

## Pre-Launch Checklist

### 1. Test Critical Features
```bash
# Health check
curl https://your-app.awsapprunner.com/api/health

# Terms API
curl https://your-app.awsapprunner.com/api/terms?limit=5

# Auth flow (test in browser)
https://your-app.awsapprunner.com/api/auth/google
```

### 2. Update OAuth Redirects
- Google Console: Add `https://www.aiglossarypro.com/api/auth/google/callback`
- GitHub: Add `https://www.aiglossarypro.com/api/auth/github/callback`

### 3. Verify Services
- [ ] Database connection (check logs)
- [ ] Redis connection (check cache hits)
- [ ] S3 uploads working
- [ ] Email sending (test password reset)
- [ ] Payment webhooks (test with Gumroad)

---

## Cost Breakdown (Minimal Setup)

| Service | Cost/Month | Notes |
|---------|------------|-------|
| App Runner | $15-25 | 0.25 vCPU minimum |
| Neon DB | $0 | Free tier |
| Upstash Redis | $0 | Free tier |
| S3 Storage | $2-5 | Existing bucket |
| Domain | $0 | Already owned |
| **Total** | **$17-30** | Very affordable! |

---

## Monitoring Setup (10 minutes)

### 1. CloudWatch Logs
App Runner automatically sends logs to CloudWatch. Create log filters:

```bash
# Error filter
aws logs put-metric-filter \
  --log-group-name /aws/apprunner/aiglossarypro/service \
  --filter-name Errors \
  --filter-pattern "[ERROR]" \
  --metric-transformations \
    metricName=ErrorCount,metricNamespace=AIGlossaryPro,metricValue=1
```

### 2. Basic Alarms
```bash
# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "HighErrorRate" \
  --metric-name ErrorCount \
  --namespace AIGlossaryPro \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

---

## First Week Operations

### Day 1-2: Launch
- Deploy using this guide
- Monitor logs closely
- Fix any immediate issues

### Day 3-4: Optimize
- Review CloudWatch metrics
- Adjust App Runner size if needed
- Enable auto-scaling if traffic warrants

### Day 5-7: Plan Next Phase
- Consider RDS migration if Neon limits approached
- Evaluate need for ElastiCache
- Plan CloudFront CDN setup

---

## Troubleshooting

### App Runner Won't Start
1. Check CloudWatch logs
2. Common issues:
   - Missing environment variables
   - Database connection string wrong
   - Port mismatch (must be 3000)

### Database Connection Fails
1. Verify `DATABASE_URL` format
2. For Neon: Must include `?sslmode=require`
3. Test locally with same connection string

### Auth Not Working
1. Verify OAuth redirect URLs updated
2. Check `JWT_SECRET` is set
3. Confirm `PRODUCTION_URL` matches actual domain

---

## Emergency Rollback

If things go wrong:

1. **App Runner**: Use "Deploy previous version" button
2. **Database**: Neon has automatic backups
3. **DNS**: Change back to old hosting (if any)

---

## Next Steps After Launch

1. **Add CloudFront CDN** (better performance)
2. **Migrate to RDS** (when ready)
3. **Set up CI/CD** (GitHub Actions)
4. **Enable autoscaling** (based on traffic)

---

## Support Resources

- AWS App Runner Docs: https://docs.aws.amazon.com/apprunner/
- Troubleshooting Guide: Check CloudWatch Logs first
- Community: AWS subreddit, Dev.to

---

This quick deploy gets you live in 2-3 hours with minimal cost and complexity. Perfect for launching this week! 🎉