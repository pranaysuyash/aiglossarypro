# CLAUDE.md - AIGlossaryPro Production Deployment Guide

**Last Updated**: September 2, 2025  
**Status**: Production Integration Complete ✅ (Direct CloudFront → EC2)  
**API URL**: https://d1m7nnfj3im4kp.cloudfront.net/api/  
**Frontend URL**: https://d1m7nnfj3im4kp.cloudfront.net/

---

## 🎯 **CURRENT SYSTEM STATUS**

### **✅ FULLY OPERATIONAL (Cost Optimized)**
- **Frontend**: React app served via S3 + CloudFront (200 OK)
- **API Core**: Health, Terms, Categories endpoints working via direct EC2
- **Backend**: Node.js API running on EC2 instance (t3.small)
- **Infrastructure**: Direct CloudFront → EC2 (ALB removed)
- **Monitoring**: CloudWatch setup active
- **Cost**: ~$17/month (54% reduction - ALB eliminated)

### **🔧 KEY WORKING ENDPOINTS**
```bash
# Core API (Verified Working)
curl https://d1m7nnfj3im4kp.cloudfront.net/api/health
curl https://d1m7nnfj3im4kp.cloudfront.net/api/terms
curl https://d1m7nnfj3im4kp.cloudfront.net/api/categories

# Enhanced API (Newly Deployed)
curl https://d1m7nnfj3im4kp.cloudfront.net/api/auth/status
curl "https://d1m7nnfj3im4kp.cloudfront.net/api/search?q=machine"
curl https://d1m7nnfj3im4kp.cloudfront.net/api/user/profile
```

---

## 🚀 **DEPLOYMENT PROCESS (DIRECT CLOUDFRONT → EC2)**

### **1. Current Architecture**
```
Users → CloudFront (d1m7nnfj3im4kp.cloudfront.net)
    ├─ Frontend (/*) → S3 
    └─ API (/api/*) → EC2 Direct (ec2-52-0-112-85.compute-1.amazonaws.com:8080)
```

### **2. EC2 Backend Deployment**
```bash
# SSH to EC2 instance
ssh -i your-key.pem ec2-user@52.0.112.85

# Update code on EC2
cd /path/to/api
git pull origin main
npm install
pm2 restart all
```

### **3. Current EC2 Instance**
- **Instance ID**: i-045ff31e850f8b78d
- **Instance Type**: t3.small
- **Public IP**: 52.0.112.85
- **Public DNS**: ec2-52-0-112-85.compute-1.amazonaws.com
- **Private IP**: 172.31.46.188
- **Status**: Running and healthy (direct CloudFront routing)

### **4. Clear CloudFront Cache (CRITICAL)**
```bash
aws cloudfront create-invalidation --distribution-id ESF8YR50LSGU8 --paths "/api/*"
```

---

## 🔧 **CRITICAL CONFIGURATION DETAILS**

### **CloudFront Distribution ID**
- **ID**: `ESF8YR50LSGU8`
- **Domain**: `d1m7nnfj3im4kp.cloudfront.net`
- **Routing**: `/api/*` → ALB, `/*` → S3

### **S3 Bucket Policy (CRITICAL)**
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "cloudfront.amazonaws.com"},
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::aiglossarypro-frontend/*",
    "Condition": {
      "StringEquals": {
        "AWS:SourceArn": "arn:aws:cloudfront::927289246324:distribution/ESF8YR50LSGU8"
      }
    }
  }]
}
```

### **Current Task Definition**
- **Active**: aiglossarypro-api:57
- **Image**: enhanced-api-101730
- **Status**: Healthy and operational

---

## 📋 **STANDARD OPERATING PROCEDURES**

### **🔄 API Deployment Checklist**
1. ✅ Build Docker image with timestamp
2. ✅ Push to ECR repository `aiglossarypro-api`
3. ✅ Update task definition JSON file
4. ✅ Register new task definition
5. ✅ Update ECS service with new task definition
6. ✅ Wait for health checks to pass (60s start period)
7. ✅ Clear relevant CloudFront cache paths
8. ✅ Test endpoints with curl commands
9. ✅ Monitor in CloudWatch dashboard
10. ✅ Document changes and commit to git

### **🔍 Health Check Commands**
```bash
# Quick status check
aws ecs describe-services --cluster aiglossarypro --services aiglossarypro-api-production --query 'services[0].{DesiredCount:desiredCount,RunningCount:runningCount,PendingCount:pendingCount}' --output table

# Test all endpoints
curl -s https://d1m7nnfj3im4kp.cloudfront.net/api/health | jq '.status'
curl -s https://d1m7nnfj3im4kp.cloudfront.net/ -w "Status: %{http_code}\n" -o /dev/null
```

### **🚨 Troubleshooting Guide**

#### **Frontend Returns 403 Forbidden**
- **Cause**: S3 bucket policy has wrong CloudFront distribution ID
- **Fix**: Update bucket policy with correct distribution ID (`ESF8YR50LSGU8`)

#### **API Returns 503 Service Unavailable**
- **Cause**: ECS task is not running or health checks failing
- **Fix**: Check ECS service status, restart if needed

#### **New API Endpoints Return Frontend HTML**
- **Cause**: CloudFront cache returning old responses
- **Fix**: Create cache invalidation for affected paths

#### **Deployment Stuck in Progress**
- **Cause**: Health checks failing or deployment configuration issues
- **Fix**: Force new deployment with correct task definition

---

## 📊 **MONITORING AND MAINTENANCE**

### **CloudWatch Dashboard**
- **Name**: AIGlossaryPro-Production-Monitoring
- **URL**: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards
- **Widgets**: CPU, Memory, Request counts, Error logs, Response times

### **Cost Monitoring**
- **Monthly Cost**: $39.48
- **Breakdown**: ECS $18.02, ALB $22.27, CloudWatch $2.25, CloudFront $0.46
- **Optimization Potential**: 15-25% savings possible

### **Log Locations**
- **ECS Logs**: `/ecs/aiglossarypro-api` (14-day retention)
- **Monitoring Scripts**: `/monitoring/` directory
- **Cost Analysis**: `/monitoring/results/cost_analysis_*.txt`

---

## 🛠️ **DEVELOPMENT WORKFLOWS**

### **Adding New API Endpoints**
1. Update `simple-api.js` with new routes
2. Follow deployment checklist above
3. Update CORS configuration if needed
4. Add to monitoring if critical endpoint

### **Frontend Updates**
1. Build frontend: `cd apps/frontend && npm run build`
2. Deploy to S3: Update bucket contents
3. Invalidate CloudFront: `/*` paths for frontend changes

### **Database Integration**
- **Script Available**: `simple-api-with-db.js`
- **Database Preparation**: `prepare-database.js`
- **Test Script**: `test-database-integration.js`

---

## 🔒 **SECURITY CONSIDERATIONS**

### **Secrets Management**
- **AWS Secrets Manager**: Used for sensitive configuration
- **Environment Variables**: Non-sensitive config only
- **Database URLs**: Never log or expose in code

### **CORS Configuration**
```javascript
const allowedOrigins = [
  'https://d1m7nnfj3im4kp.cloudfront.net',
  'https://aiglossarypro.com',
  'https://www.aiglossarypro.com',
  'http://localhost:3000',  // Development
  'http://localhost:5173'   // Development
];
```

---

## 📝 **TASK MANAGEMENT STANDARDS**

### **When to Use TodoWrite Tool**
✅ **Use For**:
- Multi-step deployment processes
- Complex feature implementations
- Bug fixes requiring multiple changes
- Integration work with dependencies
- Any task requiring >3 steps

❌ **Don't Use For**:
- Single command executions
- Simple file edits
- Informational queries
- Single-step tasks

### **Task Priority Guidelines**
- **High**: Production issues, security fixes, deployment problems
- **Medium**: Feature improvements, optimization tasks
- **Low**: Documentation updates, code cleanup

---

## 🎯 **SUCCESS METRICS**

### **Current Performance**
- **API Response Time**: 0.6s average
- **Success Rate**: 100% for working endpoints
- **Uptime**: Stable with minimal restarts
- **Cost Efficiency**: Within budget targets

### **Quality Gates**
- ✅ All health checks passing
- ✅ No 5xx errors in monitoring
- ✅ Response times < 2s
- ✅ Frontend loads successfully
- ✅ All API endpoints return proper JSON

---

## 🚀 **QUICK COMMANDS REFERENCE**

### **Most Common Tasks**
```bash
# Check service status
aws ecs describe-services --cluster aiglossarypro --services aiglossarypro-api-production --query 'services[0].deployments[*].{Status:status,TaskDefinition:taskDefinition,RunningCount:runningCount}'

# Force restart service
aws ecs update-service --cluster aiglossarypro --service aiglossarypro-api-production --force-new-deployment

# Test API health
curl https://d1m7nnfj3im4kp.cloudfront.net/api/health

# Clear CloudFront cache
aws cloudfront create-invalidation --distribution-id ESF8YR50LSGU8 --paths "/*"

# View recent logs
aws logs tail /ecs/aiglossarypro-api --follow

# Check costs
./monitoring/cost-analysis.sh
```

---

## ⚠️ **CRITICAL REMINDERS**

1. **Always clear CloudFront cache** after API changes
2. **Use correct CloudFront distribution ID** in S3 bucket policy
3. **Wait for health checks** before assuming deployment failed
4. **Clean up old task definitions** to avoid confusion
5. **Document all changes** in git commits with proper messages
6. **Monitor costs regularly** to avoid budget overruns
7. **Test endpoints immediately** after deployment
8. **Keep CLAUDE.md updated** with any process changes

---

## 📞 **EMERGENCY PROCEDURES**

### **If Production is Down**
1. Check ECS service status immediately
2. Check CloudWatch alarms for alerts
3. Force restart ECS service if needed
4. Roll back to previous working task definition if necessary
5. Clear CloudFront cache if routing issues suspected

### **Recovery Commands**
```bash
# Emergency service restart
aws ecs update-service --cluster aiglossarypro --service aiglossarypro-api-production --desired-count 0
sleep 10
aws ecs update-service --cluster aiglossarypro --service aiglossarypro-api-production --desired-count 1

# Rollback to previous task definition (replace 56 with known good version)
aws ecs update-service --cluster aiglossarypro --service aiglossarypro-api-production --task-definition aiglossarypro-api:56
```

---

**This document represents the complete operational knowledge for AIGlossaryPro production system. Keep it updated with any changes to processes or configurations.**

**Document Version**: 1.0  
**Last Verified**: August 6, 2025  
**Next Review**: September 6, 2025