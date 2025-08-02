# AIGlossaryPro - AWS App Runner Migration Plan

**Status**: 🟡 **READY FOR MIGRATION**
**Target Platform**: AWS App Runner
**Estimated Timeline**: 1-2 days

## 🎯 Migration Rationale

Based on the successful Insurance RAG migration and current ECS deployment challenges:

### Current Issues with ECS
- Container exits immediately after startup
- Complex debugging due to limited visibility
- Platform architecture mismatches (ARM64 dev → x86_64 prod)
- High operational complexity

### Why AWS App Runner?
- **Proven Success**: Insurance RAG deployed successfully with 100% reliability
- **Simplified Operations**: No cluster management required
- **Better Error Visibility**: Clear, actionable error messages
- **Cost Effective**: Pay-per-use model, automatic scaling
- **Multi-arch Support**: Seamless ARM64 to x86_64 deployment

## 📋 Pre-Migration Checklist

### Current State Assessment
- [x] Docker image builds successfully locally
- [x] Environment validation implemented
- [x] Multi-arch Dockerfile created
- [x] Debugging scripts ready
- [ ] AWS Secrets Manager setup
- [ ] App Runner service configuration
- [ ] Domain configuration (optional)

### Required AWS Resources
1. **AWS Secrets Manager**: Store sensitive environment variables
2. **ECR Repository**: Already exists (927289246324.dkr.ecr.us-east-1.amazonaws.com/aiglossarypro-api)
3. **App Runner Service**: To be created
4. **IAM Roles**: For App Runner to access ECR and Secrets Manager

## 🚀 Migration Steps

### Step 1: Prepare Secrets (10 minutes)
```bash
# Run the deployment script which will set up secrets
./scripts/deploy-to-apprunner.sh
```

The script will automatically:
- Create AWS Secrets Manager entries for all sensitive variables
- Configure proper IAM permissions
- Validate all required environment variables

### Step 2: Build & Push Multi-arch Image (15 minutes)
```bash
# The deployment script handles this automatically
# Building for both linux/amd64 and linux/arm64
```

### Step 3: Deploy to App Runner (10 minutes)
```bash
# Automated by the deployment script
# Creates or updates App Runner service
```

### Step 4: Verify Deployment (5 minutes)
```bash
# Health check and endpoint testing
curl https://[your-service-url].awsapprunner.com/health
```

## 📊 Expected Outcomes

### Performance Targets
- **Startup Time**: < 30 seconds
- **Health Check Response**: < 500ms
- **API Response Time**: < 2 seconds
- **Availability**: 99.9%

### Cost Estimates
```
Monthly Costs (estimated):
- App Runner: $5-20 (0.25 vCPU, 0.5GB RAM)
- Secrets Manager: $0.40 per secret
- ECR Storage: ~$1 for images
- Total: $10-30/month
```

## 🛠️ Technical Architecture

### App Runner Configuration
```yaml
Service Configuration:
- CPU: 0.25 vCPU
- Memory: 0.5 GB
- Port: 8080
- Health Check: /health
- Auto-scaling: Enabled
- Min Instances: 1
- Max Instances: 25
```

### Environment Variables Strategy
```yaml
Public Variables (in App Runner):
- NODE_ENV: production
- PORT: 8080
- LOG_LEVEL: info

Secret Variables (AWS Secrets Manager):
- DATABASE_URL
- JWT_SECRET
- OPENAI_API_KEY
- GROQ_API_KEY
- ANTHROPIC_API_KEY
```

## 🔍 Monitoring & Debugging

### CloudWatch Integration
- Automatic log streaming
- Performance metrics
- Custom alarms for errors

### Debugging Commands
```bash
# View logs
aws logs tail /aws/apprunner/aiglossarypro-api --follow

# Check service status
aws apprunner describe-service --service-arn [arn]

# Update service
./scripts/deploy-to-apprunner.sh
```

## 🚨 Rollback Plan

If issues arise:
1. **Immediate**: App Runner maintains previous version
2. **Manual Rollback**: 
   ```bash
   aws apprunner update-service --service-arn [arn] \
     --source-configuration ImageIdentifier=[previous-tag]
   ```
3. **ECS Fallback**: Original ECS configuration remains available

## 📈 Success Metrics

### Day 1 Goals
- [ ] Successful deployment to App Runner
- [ ] All health checks passing
- [ ] Basic API endpoints responding
- [ ] No critical errors in logs

### Week 1 Goals
- [ ] 99% uptime achieved
- [ ] Response times meet targets
- [ ] Cost within estimates
- [ ] Auto-scaling tested

### Month 1 Goals
- [ ] Production traffic migrated
- [ ] Custom domain configured
- [ ] Monitoring alerts refined
- [ ] Documentation updated

## 🎯 Next Steps

1. **Review this plan** with the team
2. **Run deployment script**: `./scripts/deploy-to-apprunner.sh`
3. **Monitor deployment** progress
4. **Test all endpoints** post-deployment
5. **Update documentation** with new URLs

## 📝 Lessons from Insurance RAG Migration

### What Worked Well
- Multi-arch Docker builds
- Comprehensive error handling
- Clear deployment scripts
- Gradual migration approach

### What to Avoid
- Don't skip dependency verification
- Don't ignore health check failures
- Don't rush the migration
- Don't forget to update client configurations

## 🤝 Support Resources

### AWS Documentation
- [App Runner User Guide](https://docs.aws.amazon.com/apprunner/)
- [ECR with App Runner](https://docs.aws.amazon.com/apprunner/latest/dg/service-source-image.html)
- [Secrets Manager Integration](https://docs.aws.amazon.com/apprunner/latest/dg/env-variable.html)

### Internal Resources
- Deployment Script: `./scripts/deploy-to-apprunner.sh`
- Debug Script: `./scripts/docker-debug.sh`
- Cleanup Script: `./scripts/cleanup-services.sh`

---

**Ready to migrate?** Run `./scripts/deploy-to-apprunner.sh` to begin the automated migration process.